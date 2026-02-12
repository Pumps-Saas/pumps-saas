import sys
import os
import uuid
from sqlmodel import Session, select, SQLModel

# Add backend directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.db import engine
from app.models import Invite, User
from app.core.security import get_password_hash

def create_first_user():
    # Ensure tables exist
    SQLModel.metadata.create_all(engine)
    
    email = "admin@pumps.com"
    password = "admin123"
    
    with Session(engine) as session:
        user = session.exec(select(User).where(User.email == email)).first()
        if user:
            print(f"User {email} already exists.")
            # Check for existing invite
            invite = session.exec(select(Invite).where(Invite.created_by_id == user.id)).first()
            if invite:
                print(f"Found existing Invite Code: {invite.code}")
            return
        
        user = User(
            email=email,
            hashed_password=get_password_hash(password),
            role="admin",
            is_active=True
        )
        session.add(user)
        session.commit()
        session.refresh(user)
        print(f"Admin user {email} created successfully.")
        
        # Create Invite
        invite_code = str(uuid.uuid4())
        invite = Invite(code=invite_code, created_by_id=user.id)
        session.add(invite)
        session.commit()
        print(f"Generated Invite Code: {invite.code}")

if __name__ == "__main__":
    create_first_user()
