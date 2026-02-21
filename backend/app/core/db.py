from sqlmodel import SQLModel, create_engine, Session
from app.models import User, Invite, Project, Scenario, CustomFluid, Pump # Import models to register with SQLModel
import os

DATABASE_URL = os.getenv("DATABASE_URL")

if DATABASE_URL:
    # Production: PostgreSQL or similar
    engine = create_engine(DATABASE_URL)
else:
    # Local: SQLite
    sqlite_file_name = "pumps.db"
    sqlite_url = f"sqlite:///{sqlite_file_name}"
    connect_args = {"check_same_thread": False}
    engine = create_engine(sqlite_url, connect_args=connect_args)

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session
