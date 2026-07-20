from typing import List, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select, or_

from app.api import deps
from app.models import User, Pump, PumpCreate, PumpRead, PumpReadBasic
import numpy as np

router = APIRouter()

@router.post("/", response_model=PumpRead)
def create_pump(
    *,
    session: Session = Depends(deps.get_session),
    pump_in: PumpCreate,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Save a new pump to the user's catalog.
    """
    pump = Pump(**pump_in.dict(), user_id=current_user.id)
    
    # Pre-calculate performance parameters for fast filtering
    if pump.curve_points and len(pump.curve_points) >= 3:
        flows = [p.get('flow', 0) for p in pump.curve_points]
        heads = [p.get('head', 0) for p in pump.curve_points]
        try:
            coeffs = np.polyfit(flows, heads, 2)
            pump.coeff_a = float(coeffs[0])
            pump.coeff_b = float(coeffs[1])
            pump.coeff_c = float(coeffs[2])
            pump.max_head_m = float(max(heads))
            pump.max_flow_m3h = float(max(flows))
        except Exception:
            pass # Invalid curve, let it pass without pre-calc

    session.add(pump)
    session.commit()
    session.refresh(pump)
    return pump

@router.get("/", response_model=List[PumpReadBasic])
def read_pumps(
    session: Session = Depends(deps.get_session),
    current_user: User = Depends(deps.get_current_active_user),
    skip: int = 0,
    limit: int = 1000,
) -> Any:
    """
    Retrieve pumps from the user's catalog. Premium users also see global pumps.
    """
    if current_user.subscription_tier in ["pro", "premium", "enterprise"]:
        statement = select(Pump).where(
            or_(Pump.user_id == current_user.id, Pump.is_global == True)
        ).offset(skip).limit(limit)
    else:
        statement = select(Pump).where(Pump.user_id == current_user.id).offset(skip).limit(limit)
    pumps = session.exec(statement).all()
    return pumps

@router.get("/{pump_id}", response_model=PumpRead)
def read_pump(
    *,
    session: Session = Depends(deps.get_session),
    pump_id: int,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get pump by ID.
    """
    statement = select(Pump).where(
        Pump.id == pump_id,
        or_(Pump.user_id == current_user.id, Pump.is_global == True)
    )
    pump = session.exec(statement).first()
    if not pump:
        raise HTTPException(status_code=404, detail="Pump not found")
    return pump

@router.delete("/{pump_id}", response_model=PumpRead)
def delete_pump(
    *,
    session: Session = Depends(deps.get_session),
    pump_id: int,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Delete a pump from the catalog.
    """
    statement = select(Pump).where(Pump.id == pump_id, Pump.user_id == current_user.id)
    pump = session.exec(statement).first()
    if not pump:
        raise HTTPException(status_code=404, detail="Pump not found")
    
    session.delete(pump)
    session.commit()
    return pump
