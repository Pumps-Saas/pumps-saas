import sys
import os
import uuid

# Add the backend directory to sys.path so we can import app modules
# Adjust based on where this script is located: backend/scripts/generate_invite.py
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.dirname(current_dir)
sys.path.append(backend_dir)

from sqlmodel import Session, select, create_engine
from app.models import User, Invite

# Re-create engine here to avoid import issues with app.core.db if config is tricky
sqlite_file_name = "pumps.db"
sqlite_url = f"sqlite:///{backend_dir}/{sqlite_file_name}"
engine = create_engine(sqlite_url)

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
