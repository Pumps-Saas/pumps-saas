from fastapi import APIRouter

api_router = APIRouter()

from app.api.v1 import calculate
from app.api.v1 import fluids

api_router.include_router(calculate.router, prefix="/calculate", tags=["calculation"])
api_router.include_router(fluids.router, prefix="/fluids", tags=["fluids"])

from app.api.v1 import auth, projects, pumps

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(projects.router, prefix="/projects", tags=["projects"])
api_router.include_router(pumps.router, prefix="/pumps", tags=["pumps"])

@api_router.get("/health")
def health_check():
    return {"status": "ok"}
