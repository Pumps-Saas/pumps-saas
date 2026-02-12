from sqlmodel import SQLModel, create_engine, Session
from app.models import User, Invite, Project, Scenario, CustomFluid, Pump # Import models to register with SQLModel

sqlite_file_name = "pumps.db"
sqlite_url = f"sqlite:///{sqlite_file_name}"

# check_same_thread=False is needed for SQLite with FastAPI
connect_args = {"check_same_thread": False}
engine = create_engine(sqlite_url, connect_args=connect_args)

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session
