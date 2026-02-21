import os
import sys
from pathlib import Path

# Add the 'backend' directory to the Python path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlmodel import Session, select, SQLModel
from app.models import Invite
from app.core.config import settings
from sqlalchemy import create_engine

engine = create_engine(settings.DATABASE_URL)

def verify_invite(code):
    with Session(engine) as session:
        invite = session.get(Invite, code)
        if invite:
            print(f"SUCCESS: Invite code {code} FOUND.")
            print(f"  - Created By: {invite.created_by_id}")
            print(f"  - Used By: {invite.used_by_id} (None means available)")
        else:
            print(f"FAILURE: Invite code {code} NOT FOUND.")
            # List all invites
            invites = session.exec(select(Invite)).all()
            print(f"  - Total Invites in DB: {len(invites)}")
            for i in invites:
                 print(f"  - {i.code}")

if __name__ == "__main__":
    verify_invite("be184130-a1cf-44b3-baf9-8d372ff6d449")
