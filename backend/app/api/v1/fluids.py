from fastapi import APIRouter
from typing import Dict, List, Any
from app.core.constants import FLUIDOS_PADRAO, MATERIAIS_PADRAO, K_FACTORS
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
        "fittings": K_FACTORS
    }

@router.post("/custom", response_model=FluidProperties)
def add_custom_fluid(fluid: FluidProperties):
    """
    Validate and fallback for custom fluid creation. 
    In the future, this could save to a database.
    For now, it just echoes back the validated fluid.
    """
    return fluid
