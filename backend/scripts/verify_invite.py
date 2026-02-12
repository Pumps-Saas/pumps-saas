import sys
import os
from sqlmodel import Session, select, create_engine, SQLModel
from app.models import Invite

# Add backend directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def verify_invite(code):
    db_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "pumps.db")
    print(f"Checking DB at: {db_path}")
    
    if not os.path.exists(db_path):
        print("DB file not found!")
        return

    sqlite_url = f"sqlite:///{db_path}"
    engine = create_engine(sqlite_url)
    
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
