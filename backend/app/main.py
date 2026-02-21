from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.api import api_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
)

# Set all CORS enabled origins
origins = settings.get_cors_origins()
if origins:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in origins],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

app.include_router(api_router, prefix=settings.API_V1_STR)

@app.on_event("startup")
def on_startup():
    from app.core.db import create_db_and_tables
    create_db_and_tables()

@app.get("/")
def root():
    return {"message": "Welcome to Pumps SaaS v2.0 API"}
