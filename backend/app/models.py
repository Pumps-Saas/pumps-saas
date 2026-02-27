from datetime import datetime
from typing import Optional, List, Any
from sqlmodel import SQLModel, Field, Relationship
from sqlalchemy import Column, JSON

# --- Auth Models ---

class UserBase(SQLModel):
    email: str = Field(unique=True, index=True)
    role: str = Field(default="user") # "admin" or "user"
    is_active: bool = Field(default=True)

class User(UserBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    hashed_password: str

    projects: List["Project"] = Relationship(back_populates="user", sa_relationship_kwargs={"cascade": "all, delete-orphan"})
    fluids: List["CustomFluid"] = Relationship(back_populates="user")
    pumps: List["Pump"] = Relationship(back_populates="user")
    invites_created: List["Invite"] = Relationship(back_populates="creator", sa_relationship_kwargs={"primaryjoin": "User.id==Invite.created_by_id"})
    tickets: List["SupportTicket"] = Relationship(back_populates="user", sa_relationship_kwargs={"cascade": "all, delete-orphan"})

class Token(SQLModel):
    access_token: str
    token_type: str

class TokenPayload(SQLModel):
    sub: Optional[int] = None

class Invite(SQLModel, table=True):
    code: str = Field(primary_key=True)
    created_by_id: int = Field(foreign_key="user.id")
    used_by_id: Optional[int] = Field(foreign_key="user.id", default=None)
    expires_at: Optional[datetime] = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    creator: "User" = Relationship(back_populates="invites_created", sa_relationship_kwargs={"primaryjoin": "User.id==Invite.created_by_id"})
    used_by: Optional["User"] = Relationship(sa_relationship_kwargs={"primaryjoin": "User.id==Invite.used_by_id"})

# --- Engineering Models ---

# Project
class ProjectBase(SQLModel):
    name: str
    description: Optional[str] = None

class Project(ProjectBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    user: "User" = Relationship(back_populates="projects")
    scenarios: List["Scenario"] = Relationship(back_populates="project", sa_relationship_kwargs={"cascade": "all, delete-orphan"})

class ProjectCreate(ProjectBase):
    pass

class ProjectRead(ProjectBase):
    id: int
    created_at: datetime
    updated_at: datetime

# Scenario
class ScenarioBase(SQLModel):
    name: str
    data: dict = Field(default={}, sa_column=Column(JSON))

class Scenario(ScenarioBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    project_id: int = Field(foreign_key="project.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)

    project: "Project" = Relationship(back_populates="scenarios")

class ScenarioCreate(ScenarioBase):
    pass

class ScenarioRead(ScenarioBase):
    id: int
    project_id: int
    created_at: datetime

# Project with Scenarios (for API response)
class ProjectReadWithScenarios(ProjectRead):
    scenarios: List[ScenarioRead] = []

# Custom Fluid
class CustomFluidBase(SQLModel):
    name: str
    properties: dict = Field(default={}, sa_column=Column(JSON))

class CustomFluid(CustomFluidBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)

    user: "User" = Relationship(back_populates="fluids")

class CustomFluidCreate(CustomFluidBase):
    pass

class CustomFluidRead(CustomFluidBase):
    id: int
    created_at: datetime

# Pump
class PumpBase(SQLModel):
    manufacturer: str
    model: str
    curve_points: List[dict] = Field(default=[], sa_column=Column(JSON))

class Pump(PumpBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)

    user: "User" = Relationship(back_populates="pumps")

class PumpCreate(PumpBase):
    pass

class PumpRead(PumpBase):
    id: int
    created_at: datetime

# --- Support Workflow Models ---

class SupportTicketBase(SQLModel):
    subject: str
    status: str = Field(default="open") # "open", "closed"

class SupportTicket(SupportTicketBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    user: "User" = Relationship(back_populates="tickets")
    messages: List["TicketMessage"] = Relationship(back_populates="ticket", sa_relationship_kwargs={"cascade": "all, delete-orphan"})

class SupportTicketCreate(SupportTicketBase):
    message: str # the initial message content
    attachment_url: Optional[str] = None

class SupportTicketRead(SupportTicketBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

class TicketMessageBase(SQLModel):
    sender_type: str = Field(default="user") # "user" or "admin"
    message: str
    attachment_url: Optional[str] = None

class TicketMessage(TicketMessageBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    ticket_id: int = Field(foreign_key="supportticket.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)

    ticket: "SupportTicket" = Relationship(back_populates="messages")

class TicketMessageCreate(TicketMessageBase):
    pass

class TicketMessageRead(TicketMessageBase):
    id: int
    ticket_id: int
    created_at: datetime

class SupportTicketReadWithMessages(SupportTicketRead):
    messages: List[TicketMessageRead] = []
