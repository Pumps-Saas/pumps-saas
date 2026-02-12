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
    invite_code: str

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
    Register a new user. REQUIRES VALID INVITE CODE.
    """
    # 1. Check Invite Code
    invite = session.get(Invite, user_in.invite_code)
    if not invite:
        raise HTTPException(status_code=400, detail="Invalid invite code")
    if invite.used_by_id:
        raise HTTPException(status_code=400, detail="Invite code already used")
    
    # 2. Check Exists
    user = session.exec(select(User).where(User.email == user_in.email)).first()
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this username already exists in the system.",
        )
    
    # 3. Create User
    user = User(
        email=user_in.email,
        hashed_password=security.get_password_hash(user_in.password),
        role="user",
        is_active=True
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
