from typing import List, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
import numpy as np

from app.api import deps
from app.models import User, Pump
from app.schemas.calculations import SystemHeadCurveRequest
from app.services.optimization import find_operating_point, calculate_parallel_loss
from app.services.fluid_mechanics import calculate_series_loss
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

    # [PERFORMANCE FIX] Pre-calculate the system curve polynomial ONCE
    # instead of running the nested-root physics engine for every pump in the database
    test_flows = np.linspace(request.flow_min_m3h or 0.0, request.flow_max_m3h or 100.0, 15)
    test_heads = []
    for q in test_flows:
        if q <= 0:
            test_heads.append(total_static_head_m)
            continue
        loss_suc = calculate_series_loss(request.suction_sections, q, request.fluid)
        loss_bef = calculate_series_loss(request.discharge_sections_before, q, request.fluid)
        loss_par, _ = calculate_parallel_loss(request.discharge_parallel_sections, q, request.fluid)
        loss_aft = calculate_series_loss(request.discharge_sections_after, q, request.fluid)
        test_heads.append(total_static_head_m + loss_suc + loss_bef + loss_par + loss_aft)
    
    sys_coeffs = np.polyfit(test_flows, test_heads, 2)

    for pump in global_pumps:
        points = pump.curve_points
        if not points or len(points) < 3:
            continue

        flows = [p.get('flow', 0) for p in points]
        heads = [p.get('head', 0) for p in points]
        
        try:
            if pump.coeff_a is not None and pump.coeff_b is not None and pump.coeff_c is not None:
                pump_coeffs = [pump.coeff_a, pump.coeff_b, pump.coeff_c]
                pump_curve_func = np.poly1d(pump_coeffs)
            else:
                pump_coeffs = np.polyfit(flows, heads, 2)
                pump_curve_func = np.poly1d(pump_coeffs)
            
            shut_off_head = pump_curve_func(0)
            if shut_off_head < total_static_head_m:
                continue # Pump is too weak

            # O(1) mathematical intersection of two 2nd degree polynomials
            diff_coeffs = np.array(pump_coeffs) - np.array(sys_coeffs)
            roots = np.roots(diff_coeffs)
            
            # Find positive real roots
            real_roots = [r.real for r in roots if abs(r.imag) < 1e-5 and r.real > 0]
            
            if not real_roots:
                continue # Does not intersect

            flow_op = min(real_roots)
            head_op = float(pump_curve_func(flow_op))

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
