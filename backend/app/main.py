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

import time
import asyncio
from fastapi import Request
from app.db.session import SessionLocal
from app.models import SystemLog

@app.middleware("http")
async def log_kpi_middleware(request: Request, call_next):
    start_time = time.time()
    try:
        response = await call_next(request)
        process_time_ms = (time.time() - start_time) * 1000
        
        # Log to DB if it's a calculation or an error
        is_calc_route = "/calculate" in request.url.path
        is_error = response.status_code >= 400
        
        if is_calc_route or is_error:
            # Run db save in background to avoid slowing down the response
            db = SessionLocal()
            try:
                # We don't have the error body easily accessible here without consuming the stream, 
                # but we know the status code.
                log = SystemLog(
                    endpoint=request.url.path,
                    response_time_ms=process_time_ms,
                    status_code=response.status_code,
                    error_message=f"Error {response.status_code}" if is_error else None
                )
                db.add(log)
                db.commit()
            finally:
                db.close()
                
        return response
    except Exception as e:
        process_time_ms = (time.time() - start_time) * 1000
        db = SessionLocal()
        try:
            log = SystemLog(
                endpoint=request.url.path,
                response_time_ms=process_time_ms,
                status_code=500,
                error_message=str(e)
            )
            db.add(log)
            db.commit()
        finally:
            db.close()
        raise e

@app.on_event("startup")
def on_startup():
    from app.core.db import create_db_and_tables
    from app.core.email_poller import email_poller_task
    create_db_and_tables()
    
    # Launch background task for IMAP Support email polling
    asyncio.create_task(email_poller_task())

@app.get("/")
def root():
    return {"message": "Welcome to Pumps SaaS v2.0 API"}
