from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select, func
from typing import List, Any
from datetime import datetime, timedelta

from app.api.deps import get_current_active_admin, get_session
from app.models.user import User
from app.models import Project, Scenario, SupportTicket, Pump, CustomFluid, SystemLog, Invite
import secrets

router = APIRouter()

@router.get("/users")
def get_admin_users(
    session: Session = Depends(get_session),
    current_admin: User = Depends(get_current_active_admin)
) -> Any:
    """
    Get all users with their statistics.
    """
    users = session.exec(select(User)).all()
    
    results = []
    for user in users:
        # Aggregated stats
        projects_count = session.exec(select(func.count(Project.id)).where(Project.user_id == user.id)).one()
        tickets_count = session.exec(select(func.count(SupportTicket.id)).where(SupportTicket.user_id == user.id)).one()
        
        # Scenarios count requires join or nested query. Simple approach:
        scenarios_count = 0
        user_projects = session.exec(select(Project).where(Project.user_id == user.id)).all()
        for p in user_projects:
            scenarios_count += session.exec(select(func.count(Scenario.id)).where(Scenario.project_id == p.id)).one()
            
        results.append({
            "id": user.id,
            "email": user.email,
            "role": user.role,
            "is_active": user.is_active,
            "subscription_status": user.subscription_status,
            "subscription_end_date": user.subscription_end_date,
            "total_access_time_minutes": user.total_access_time_minutes,
            "stats": {
                "projects": projects_count,
                "scenarios": scenarios_count,
                "tickets": tickets_count
            }
        })
        
    return results

@router.post("/users/{user_id}/toggle-status")
def toggle_user_status(
    user_id: int,
    session: Session = Depends(get_session),
    current_admin: User = Depends(get_current_active_admin)
) -> Any:
    """
    Toggle a user's active status (block/unblock login).
    """
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if user.id == current_admin.id:
        raise HTTPException(status_code=400, detail="Cannot disable your own admin account")
        
    user.is_active = not user.is_active
    session.add(user)
    session.commit()
    session.refresh(user)
    return {"message": "Status toggled", "is_active": user.is_active}

@router.get("/resources")
def get_global_resources(
    session: Session = Depends(get_session),
    current_admin: User = Depends(get_current_active_admin)
) -> Any:
    """
    Get all global pumps and fluids from all users.
    """
    pumps = session.exec(select(Pump)).all()
    fluids = session.exec(select(CustomFluid)).all()
    
    # We want to associate the email
    pump_results = []
    for p in pumps:
        owner = session.get(User, p.user_id)
        pump_results.append({
            "id": p.id,
            "manufacturer": p.manufacturer,
            "model": p.model,
            "owner_email": owner.email if owner else "Unknown",
            "created_at": p.created_at
        })
        
    fluid_results = []
    for f in fluids:
        owner = session.get(User, f.user_id)
        fluid_results.append({
            "id": f.id,
            "name": f.name,
            "owner_email": owner.email if owner else "Unknown",
            "created_at": f.created_at
        })
        
    return {"pumps": pump_results, "fluids": fluid_results}

@router.post("/invites")
def generate_invite(
    session: Session = Depends(get_session),
    current_admin: User = Depends(get_current_active_admin)
) -> Any:
    """
    Generate a new invite token for new registrations.
    """
    code = secrets.token_hex(4)
    # Valid for 3 days by default
    expires_at = datetime.utcnow() + timedelta(days=3)
    
    new_invite = Invite(
        code=code,
        created_by_id=current_admin.id,
        expires_at=expires_at
    )
    session.add(new_invite)
    session.commit()
    session.refresh(new_invite)
    
    # Get all active invites
    all_invites = session.exec(select(Invite).order_by(Invite.created_at.desc())).all()
    
    return {"message": "Invite generated", "new_invite": code, "all_invites": all_invites}

@router.get("/kpis")
def get_system_kpis(
    session: Session = Depends(get_session),
    current_admin: User = Depends(get_current_active_admin)
) -> Any:
    """
    Generate System KPIs like DB usage proxies, active users, avg response times, errors, etc.
    """
    total_users = session.exec(select(func.count(User.id))).one()
    active_users = session.exec(select(func.count(User.id)).where(User.is_active == True)).one()
    
    total_projects = session.exec(select(func.count(Project.id))).one()
    total_scenarios = session.exec(select(func.count(Scenario.id))).one()
    
    # Analyze recent logs (e.g. last 1000 logs or everything for now if db is small)
    logs = session.exec(select(SystemLog).order_by(SystemLog.created_at.desc()).limit(1000)).all()
    
    avg_response_time = 0.0
    error_count = 0
    if logs:
        avg_response_time = sum(log.response_time_ms for log in logs) / len(logs)
        error_count = sum(1 for log in logs if log.status_code >= 400)
        
    error_rate = (error_count / len(logs)) * 100 if logs else 0.0
    
    return {
        "users": {"total": total_users, "active": active_users},
        "database": {"total_projects": total_projects, "total_scenarios": total_scenarios},
        "performance": {"avg_response_time_ms": round(avg_response_time, 2), "error_rate_percent": round(error_rate, 2)},
        "recent_errors": [
            {"endpoint": log.endpoint, "status": log.status_code, "error": log.error_message, "time": log.created_at}
            for log in logs if log.status_code >= 400
        ][:10] # Top 10 recent errors
    }
