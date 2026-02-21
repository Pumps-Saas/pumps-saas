import os
import sys
from pathlib import Path

# Add the 'backend' directory to the Python path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlmodel import Session, select, SQLModel
from app.models import User, Invite, Project, Scenario, Pump, CustomFluid
from app.core.config import settings
from sqlalchemy import create_engine

engine = create_engine(settings.DATABASE_URL)

def check_db():
    print(f"--- Checking database at {settings.DATABASE_URL} ---")
    
    try:
        with Session(engine) as session:
            users = session.exec(select(User)).all()
            invites = session.exec(select(Invite)).all()
            projects = session.exec(select(Project)).all()
            scenarios = session.exec(select(Scenario)).all()
            pumps = session.exec(select(Pump)).all()
            custom_fluids = session.exec(select(CustomFluid)).all()

            print(f"Users: {len(users)}")
            for u in users:
                print(f"  - {u.email} (Role: {u.role})")
            
            print(f"Invites: {len(invites)}")
            for i in invites:
                print(f"  - {i.code} (Creator: {i.created_by_id}, Used: {i.used_by_id})")
    except Exception as e:
        print(f"Error reading DB: {e}")

if __name__ == "__main__":
    check_db()
