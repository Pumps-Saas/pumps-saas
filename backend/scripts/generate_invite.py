import sys
import os
import uuid
from datetime import timedelta
import random
import string
from pathlib import Path

# Add the 'backend' directory to the Python path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlmodel import Session, select
from app.models import Invite
from datetime import datetime
from app.core.config import settings
from sqlalchemy import create_engine

engine = create_engine(settings.DATABASE_URL)

def generate_invite():
    with Session(engine) as session:
        # Find admin user to be the creator
        # Try both common admins or any user
        admin = session.exec(select(User).where(User.email == "admin@pumps.com")).first()
        
        if not admin:
            print("Error: Admin 'admin@pumps.com' not found.")
            # Fallback to any user
            admin = session.exec(select(User)).first()
            if not admin:
                print("Checking failed: No users found in DB.")
                return
            print(f"Fallback: Using user '{admin.email}' as creator.")

        # Generate new code
        new_code = str(uuid.uuid4())
        invite = Invite(code=new_code, created_by_id=admin.id)
        session.add(invite)
        try:
            session.commit()
            print(f"INVITE_CODE:{new_code}")
        except Exception as e:
            print(f"Error saving invite: {e}")

if __name__ == "__main__":
    generate_invite()
