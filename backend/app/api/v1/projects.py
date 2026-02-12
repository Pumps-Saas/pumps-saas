from typing import List, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from app.api import deps
from app.models import (
    User, Project, ProjectCreate, ProjectRead, ProjectReadWithScenarios,
    Scenario, ScenarioCreate, ScenarioRead
)

router = APIRouter()

# --- Projects ---

@router.post("/", response_model=ProjectRead)
def create_project(
    *,
    session: Session = Depends(deps.get_session),
    project_in: ProjectCreate,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Create new project.
    """
    # Check for duplicate name
    existing_project = session.exec(select(Project).where(Project.user_id == current_user.id, Project.name == project_in.name)).first()
    if existing_project:
        raise HTTPException(status_code=400, detail="A project with this name already exists.")

    project = Project(**project_in.dict(), user_id=current_user.id)
    session.add(project)
    session.commit()
    session.refresh(project)
    return project

@router.get("/", response_model=List[ProjectRead])
def read_projects(
    session: Session = Depends(deps.get_session),
    current_user: User = Depends(deps.get_current_active_user),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Retrieve projects.
    """
    # Filter by current_user
    statement = select(Project).where(Project.user_id == current_user.id).offset(skip).limit(limit)
    projects = session.exec(statement).all()
    return projects

@router.get("/{project_id}", response_model=ProjectReadWithScenarios)
def read_project(
    *,
    session: Session = Depends(deps.get_session),
    project_id: int,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get project by ID.
    """
    statement = select(Project).where(Project.id == project_id, Project.user_id == current_user.id)
    project = session.exec(statement).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project

@router.delete("/{project_id}", response_model=ProjectRead)
def delete_project(
    *,
    session: Session = Depends(deps.get_session),
    project_id: int,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Delete a project.
    """
    statement = select(Project).where(Project.id == project_id, Project.user_id == current_user.id)
    project = session.exec(statement).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    session.delete(project)
    session.commit()
    return project

# --- Scenarios ---

@router.post("/{project_id}/scenarios", response_model=ScenarioRead)
def create_scenario(
    *,
    session: Session = Depends(deps.get_session),
    project_id: int,
    scenario_in: ScenarioCreate,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Create new scenario in a project.
    """
    # Verify Project Ownership
    project = session.exec(select(Project).where(Project.id == project_id, Project.user_id == current_user.id)).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    scenario = Scenario(**scenario_in.dict(), project_id=project_id)
    session.add(scenario)
    session.commit()
    session.refresh(scenario)
    return scenario

@router.delete("/scenarios/{scenario_id}", response_model=ScenarioRead)
def delete_scenario(
    *,
    session: Session = Depends(deps.get_session),
    scenario_id: int,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Delete a scenario.
    """
    # Join with Project to verify ownership
    statement = select(Scenario).join(Project).where(Scenario.id == scenario_id, Project.user_id == current_user.id)
    scenario = session.exec(statement).first()
    if not scenario:
        raise HTTPException(status_code=404, detail="Scenario not found")
    
    session.delete(scenario)
    session.commit()
    return scenario
