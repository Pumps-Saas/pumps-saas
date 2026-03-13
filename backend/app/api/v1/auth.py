from datetime import timedelta
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlmodel import Session, select

from app.core import security, db
from app.api import deps
from app.models import User, Invite, UserBase

router = APIRouter()

class Token(UserBase):
    access_token: str
    token_type: str

class UserCreate(UserBase):
    password: str
    invite_code: str | None = None

class UserResponse(UserBase):
    id: int

@router.post("/login", response_model=Token)
def login_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(), 
    session: Session = Depends(deps.get_session)
) -> Any:
    """
    OAuth2 compatible token login, get an access token for future requests.
    """
    user = session.exec(select(User).where(User.email == form_data.username)).first()
    if not user or not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    elif not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    
    access_token_expires = timedelta(minutes=security.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        subject=user.email, expires_delta=access_token_expires
    )
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "email": user.email,
        "role": user.role,
        "is_active": user.is_active
    }

@router.post("/register", response_model=UserResponse)
def register_user(
    *,
    session: Session = Depends(deps.get_session),
    user_in: UserCreate,
) -> Any:
    """
    Register a new user. Supports Pre-created accounts from Stripe Webhooks.
    """
    if not user_in.invite_code:
        raise HTTPException(
            status_code=400,
            detail="Registration requires an invite code. Please purchase a plan first."
        )

    invite = session.get(Invite, user_in.invite_code)
    if not invite:
        raise HTTPException(status_code=400, detail="Invalid invite code")
    if invite.used_by_id:
        raise HTTPException(status_code=400, detail="Invite code already used")
        
    # Check if this invite belongs to a pre-created Stripe customer
    pre_user = session.get(User, invite.created_by_id)
    if pre_user and pre_user.hashed_password == "TEMP_WAITING_REGISTRATION":
        if pre_user.email.lower() != user_in.email.lower():
            raise HTTPException(status_code=400, detail=f"Please use the email address associated with your purchase: {pre_user.email}")
            
        # Activate pre-created user
        pre_user.hashed_password = security.get_password_hash(user_in.password)
        pre_user.is_active = True
        session.add(pre_user)
        
        invite.used_by_id = pre_user.id
        session.add(invite)
        session.commit()
        session.refresh(pre_user)
        return pre_user
    
    # 2. Check Exists (Regular Registration via Admin Invite fallback)
    user = session.exec(select(User).where(User.email == user_in.email)).first()
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this username already exists in the system.",
        )
    
    # 3. Create User (Authorized by Invite)
    user = User(
        email=user_in.email,
        hashed_password=security.get_password_hash(user_in.password),
        role="user",
        is_active=True,
        subscription_status="active",
        subscription_tier="basic"
    )
    session.add(user)
    session.commit()
    session.refresh(user)

    # 4. Mark Invite Used
    invite.used_by_id = user.id
    session.add(invite)
    session.commit()

    return user

@router.get("/me", response_model=UserResponse)
def read_users_me(current_user: User = Depends(deps.get_current_active_user)) -> Any:
    """
    Get current user.
    """
    return current_user
