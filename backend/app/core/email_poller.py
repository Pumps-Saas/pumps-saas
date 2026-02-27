import imaplib
import email
from email.header import decode_header
import re
import asyncio
from sqlmodel import Session, select
from app.core.config import settings
from app.core.db import engine
from app.models import SupportTicket, TicketMessage
from app.core.email import send_email

IMAP_SERVER = "imap.gmail.com"

def connect_to_imap():
    if not settings.SMTP_PASSWORD:
        return None
    try:
        mail = imaplib.IMAP4_SSL(IMAP_SERVER)
        mail.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        return mail
    except Exception as e:
        print(f"Failed to connect to IMAP: {e}")
        return None

async def poll_support_emails():
    """
    Connects to the support inbox, looks for unread emails 
    matching the Support Reply pattern, extracts the reply, 
    and saves it to the database as an Admin message.
    """
    mail = connect_to_imap()
    if not mail:
        return

    mail.select("inbox")
    # Search for unread emails sent from the Admin team themselves
    # or just any unread emails for simplicity in this MVP
    status, messages = mail.search(None, 'UNSEEN')
    
    if status != "OK":
        mail.logout()
        return

    email_ids = messages[0].split()
    
    for email_id in email_ids:
        res, msg_data = mail.fetch(email_id, '(RFC822)')
        for response_part in msg_data:
            if isinstance(response_part, tuple):
                msg = email.message_from_bytes(response_part[1])
                subject, encoding = decode_header(msg["Subject"])[0]
                if isinstance(subject, bytes):
                    subject = subject.decode(encoding if encoding else "utf-8")
                
                # Check if subject matches [Ticket #X]
                match = re.search(r'\[Ticket #(\d+)\]', subject)
                if not match:
                    # Ignore non-ticket emails
                    continue
                    
                ticket_id = int(match.group(1))
                
                # Extract text body
                body = ""
                if msg.is_multipart():
                    for part in msg.walk():
                        content_type = part.get_content_type()
                        content_disposition = str(part.get("Content-Disposition"))
                        try:
                            if content_type == "text/plain" and "attachment" not in content_disposition:
                                body = part.get_payload(decode=True).decode()
                                break
                        except:
                            pass
                else:
                    body = msg.get_payload(decode=True).decode()
                    
                # Clean up body to remove previous quoted emails (Gmail creates quotes after "Em qui., 27 de fev. de 2026...")
                # A very rudimentary way to grab the top reply:
                reply_text = body.split("\r\n\r\n> ")[0]
                reply_text = reply_text.split("Em ")[0] # Basic Portuguese Gmail quote detection
                reply_text = reply_text.strip()
                
                # Save to database
                with Session(engine) as db:
                    ticket = db.get(SupportTicket, ticket_id)
                    if ticket:
                        new_msg = TicketMessage(
                            ticket_id=ticket.id,
                            sender_type="admin",
                            message=reply_text
                        )
                        db.add(new_msg)
                        db.commit()
                        
                        # Forward the reply back to the user via email
                        asyncio.create_task(send_email(
                            email_to=ticket.user.email,
                            subject=f"Re: [Ticket #{ticket.id}] {ticket.subject}",
                            text_content=f"Você recebeu uma resposta da equipe de suporte:\n\n{reply_text}\n\n--\nPumps SaaS"
                        ))
        
        # Mark as read (already done implicitly by fetch without PEEK but to be safe)
        mail.store(email_id, '+FLAGS', '\Seen')

    mail.logout()

async def email_poller_task():
    """Background task string that loops infinitely"""
    print("Starting IMAP Poller Background Task...")
    while True:
        try:
            await poll_support_emails()
        except Exception as e:
            print(f"Error in IMAP Polling iteration: {e}")
        await asyncio.sleep(60) # Poll every 60 seconds
