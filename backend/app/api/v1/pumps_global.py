from typing import List, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
import numpy as np

from app.api import deps
from app.models import User, Pump
from app.schemas.calculations import SystemHeadCurveRequest
from app.services.optimization import find_operating_point
from app.api.v1.calculate import interpolate_efficiency, pressure_to_head

router = APIRouter()

@router.post("/auto-select", response_model=List[dict])
def auto_select_pump(
    *,
    session: Session = Depends(deps.get_session),
    request: SystemHeadCurveRequest,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Advanced AI Search: Select the best global pumps for the given system curve.
    Ranked by best efficiency at the operating point.
    Requires Premium Tier.
    """
    if current_user.subscription_tier not in ["premium", "enterprise"]:
        raise HTTPException(status_code=403, detail="Premium feature. Auto-Select requires Premium or Enterprise tier.")

    # Calculate Total Static Head
    head_pressure_suction = pressure_to_head(request.pressure_suction_bar_g, request.fluid)
    head_pressure_discharge = pressure_to_head(request.pressure_discharge_bar_g, request.fluid)
    total_static_head_m = request.static_head_m + (head_pressure_discharge - head_pressure_suction)

    statement = select(Pump).where(
        Pump.is_global == True,
        Pump.max_head_m >= total_static_head_m
    )
    global_pumps = session.exec(statement).all()

    results = []

    for pump in global_pumps:
        points = pump.curve_points
        if not points or len(points) < 3:
            continue

        flows = [p.get('flow', 0) for p in points]
        heads = [p.get('head', 0) for p in points]
        
        try:
            if pump.coeff_a is not None and pump.coeff_b is not None and pump.coeff_c is not None:
                pump_curve_func = np.poly1d([pump.coeff_a, pump.coeff_b, pump.coeff_c])
            else:
                coeffs = np.polyfit(flows, heads, 2)
                pump_curve_func = np.poly1d(coeffs)
            
            shut_off_head = pump_curve_func(0)
            if shut_off_head < total_static_head_m:
                continue # Pump is too weak

            flow_op, head_op, _ = find_operating_point(
                request.suction_sections,
                request.discharge_sections_before,
                request.discharge_parallel_sections,
                request.discharge_sections_after,
                total_static_head_m,
                request.fluid,
                pump_curve_func
            )
            
            if flow_op is None:
                continue # Does not intersect

            if flow_op > (pump.max_flow_m3h * 1.25):
                continue # Operating point is too far beyond the pump's catalog curve

            efficiency_op = interpolate_efficiency(flow_op, points)
            
            if efficiency_op is not None and efficiency_op > 0:
                results.append({
                    "pump_id": pump.id,
                    "manufacturer": pump.manufacturer,
                    "model": pump.model,
                    "curve_points": points,
                    "flow_op": float(flow_op),
                    "head_op": float(head_op),
                    "efficiency_op": float(efficiency_op)
                })

        except Exception as e:
            # Ignore invalid fitting/solver errors for specific bad pumps
            continue

    # Sort by efficiency (descending)
    results.sort(key=lambda x: x["efficiency_op"], reverse=True)
    
    return results[:5] # Return top 5
