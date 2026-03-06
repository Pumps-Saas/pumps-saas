from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app.api.deps import get_session, get_current_active_user
from app.models import (
    User,
    SupportTicket,
    SupportTicketCreate,
    SupportTicketRead,
    SupportTicketReadWithMessages,
    TicketMessage,
    TicketMessageCreate
)
from app.core.email import send_email
from app.core.config import settings

router = APIRouter()

@router.get("/tickets", response_model=List[SupportTicketReadWithMessages])
def read_tickets(
    db: Session = Depends(get_session),
    current_user: User = Depends(get_current_active_user),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Retrieve user tickets.
    """
    statement = select(SupportTicket).where(SupportTicket.user_id == current_user.id).offset(skip).limit(limit)
    tickets = db.exec(statement).all()
    return tickets

@router.post("/tickets", response_model=SupportTicketRead)
async def create_ticket(
    *,
    db: Session = Depends(get_session),
    ticket_in: SupportTicketCreate,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Create new support ticket.
    """
    # 1. Create the SupportTicket entity
    ticket = SupportTicket(
        subject=ticket_in.subject,
        user_id=current_user.id,
        status="open"
    )
    db.add(ticket)
    db.commit()
    db.refresh(ticket)
    
    # 2. Add the initial message
    internal_message = f"[Reported by {current_user.email} -> {current_user.role}]\n\n{ticket_in.message}"
    
    first_msg = TicketMessage(
        ticket_id=ticket.id,
        sender_type="user",
        message=internal_message,
        attachment_url=ticket_in.attachment_url
    )
    db.add(first_msg)
    db.commit()
    db.refresh(first_msg)
    
    # 3. Trigger email to Support team
    email_subject = f"[Ticket #{ticket.id}] {ticket.subject}"
    
    await send_email(
        email_to=settings.EMAILS_FROM_EMAIL,
        subject=email_subject,
        text_content=internal_message,
        reply_to=settings.EMAILS_FROM_EMAIL,  # Force reply to the system so DB records it
        headers={"X-Pumps-Notification": "Original"}
    )
    
    return ticket
