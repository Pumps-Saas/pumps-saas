from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, List, Any
from sqlmodel import Session, select

from app.core import db
from app.api import deps
from app.models import User, CustomFluid, CustomFluidCreate, CustomFluidRead
from app.core.constants import FLUIDOS_PADRAO, MATERIAIS_PADRAO, K_FACTORS, DIAMETROS_PADRAO
from app.schemas.calculations import FluidProperties

router = APIRouter()

@router.get("/standards", response_model=Dict[str, Any])
def get_standards():
    """
    Get all standard definitions: Fluids, Materials, Fittings (K Factors).
    """
    return {
        "fluids": FLUIDOS_PADRAO,
        "materials": MATERIAIS_PADRAO,
        "fittings": K_FACTORS,
        "diameters": DIAMETROS_PADRAO
    }

@router.get("/custom", response_model=List[CustomFluidRead])
def read_custom_fluids(
    session: Session = Depends(deps.get_session),
    current_user: User = Depends(deps.get_current_active_user),
    skip: int = 0,
    limit: int = 100,
):
    """
    Retrieve user's custom fluids.
    """
    statement = select(CustomFluid).where(CustomFluid.user_id == current_user.id).offset(skip).limit(limit)
    fluids = session.exec(statement).all()
    return fluids

@router.post("/custom", response_model=CustomFluidRead)
def create_custom_fluid(
    *,
    session: Session = Depends(deps.get_session),
    fluid_in: CustomFluidCreate,
    current_user: User = Depends(deps.get_current_active_user),
):
    """
    Create new custom fluid.
    """
    fluid = CustomFluid.from_orm(fluid_in)
    fluid.user_id = current_user.id
    session.add(fluid)
    session.commit()
    session.refresh(fluid)
    return fluid

@router.delete("/custom/{fluid_id}", response_model=CustomFluidRead)
def delete_custom_fluid(
    *,
    session: Session = Depends(deps.get_session),
    fluid_id: int,
    current_user: User = Depends(deps.get_current_active_user),
):
    """
    Delete a custom fluid.
    """
    statement = select(CustomFluid).where(CustomFluid.id == fluid_id, CustomFluid.user_id == current_user.id)
    fluid = session.exec(statement).first()
    if not fluid:
        raise HTTPException(status_code=404, detail="Fluid not found")
    
    session.delete(fluid)
    session.commit()
    return fluid
