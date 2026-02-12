import sys
import os
from sqlmodel import Session, select, create_engine, SQLModel
from app.models import User, Invite

# Add backend directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def check_db(db_path):
    print(f"--- Checking {db_path} ---")
    if not os.path.exists(db_path):
        print("File does not exist.")
        return

    sqlite_url = f"sqlite:///{db_path}"
    engine = create_engine(sqlite_url)
    
    try:
        with Session(engine) as session:
            users = session.exec(select(User)).all()
            invites = session.exec(select(Invite)).all()
            print(f"Users: {len(users)}")
            for u in users:
                print(f"  - {u.email} (Role: {u.role})")
            
            print(f"Invites: {len(invites)}")
            for i in invites:
                print(f"  - {i.code} (Creator: {i.created_by_id}, Used: {i.used_by_id})")
    except Exception as e:
        print(f"Error reading DB: {e}")

if __name__ == "__main__":
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    
    # Check backend/pumps.db
    check_db(os.path.join(base_dir, "pumps.db"))
    
    # Check backend/scripts/pumps.db
    check_db(os.path.join(base_dir, "scripts", "pumps.db"))
