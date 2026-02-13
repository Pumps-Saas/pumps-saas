from typing import List, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from app.api import deps
from app.models import User, Pump, PumpCreate, PumpRead

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
    session.add(pump)
    session.commit()
    session.refresh(pump)
    return pump

@router.get("/", response_model=List[PumpRead])
def read_pumps(
    session: Session = Depends(deps.get_session),
    current_user: User = Depends(deps.get_current_active_user),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Retrieve pumps from the user's catalog.
    """
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
    statement = select(Pump).where(Pump.id == pump_id, Pump.user_id == current_user.id)
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
