import os
import sys
from sqlmodel import Session, select

sys.path.append(os.path.abspath(os.path.dirname(__file__)))

from app.core.db import engine
from app.models import User

def upgrade_user():
    with Session(engine) as session:
        user = session.exec(select(User).where(User.email == "admin@pumps-saas.com")).first()
        if user:
            user.subscription_tier = "premium"
            session.add(user)
            session.commit()
            print("User admin@pumps-saas.com updated to PREMIUM successfully in Supabase.")
        else:
            print("User not found.")

if __name__ == "__main__":
    upgrade_user()
