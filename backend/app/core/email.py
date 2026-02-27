import os
from pathlib import Path
from email.message import EmailMessage
import aiosmtplib
from app.core.config import settings

async def send_email(
    email_to: str,
    subject: str,
    text_content: str,
    reply_to: str | None = None
) -> None:
    """
    Asynchronously sends an email using SMTP.
    If reply_to is provided, it sets the Reply-To header.
    """
    if not settings.SMTP_PASSWORD:
        print("SMTP_PASSWORD not set. Email not sent.")
        print(f"Subject: {subject}")
        print(f"To: {email_to}")
        print(text_content)
        return

    message = EmailMessage()
    message["From"] = f"{settings.EMAILS_FROM_NAME} <{settings.EMAILS_FROM_EMAIL}>"
    message["To"] = email_to
    message["Subject"] = subject
    
    if reply_to:
        message["Reply-To"] = reply_to
        
    message.set_content(text_content)

    print(f"Connecting to SMTP {settings.SMTP_HOST}:{settings.SMTP_PORT} as {settings.SMTP_USER}")

    try:
        await aiosmtplib.send(
            message,
            hostname=settings.SMTP_HOST,
            port=settings.SMTP_PORT,
            username=settings.SMTP_USER,
            password=settings.SMTP_PASSWORD,
            use_tls=True,
        )
        print(f"Email sent successfully to {email_to}")
    except Exception as e:
        print(f"Error sending email: {e}")
