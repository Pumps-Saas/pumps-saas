import stripe
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlmodel import Session
from app.api import deps
from app.core.config import settings
from app.models import User

router = APIRouter()

stripe.api_key = settings.STRIPE_API_KEY

@router.post("/create-checkout-session")
async def create_checkout_session(plan: str, db: Session = Depends(deps.get_session), current_user: User = Depends(deps.get_current_active_user)):
    try:
        # In a real app we would map `plan` to a Stripe Price ID
        # For this MVP, we will use a generic mode or mock price IDs.
        
        checkout_session = stripe.checkout.Session.create(
            customer_email=current_user.email,
            payment_method_types=['card', 'boleto', 'pix'],
            line_items=[
                {
                    'price_data': {
                        'currency': 'brl',
                        'product_data': {
                            'name': f'Pumps SaaS - Plano {plan.capitalize()}',
                        },
                        'unit_amount': 9900 if plan == 'basic' else 19900,
                        'recurring': {'interval': 'month'}
                    },
                    'quantity': 1,
                },
            ],
            mode='subscription',
            success_url=settings.FRONTEND_URL + "/dashboard?success=true",
            cancel_url=settings.FRONTEND_URL + "/dashboard?canceled=true",
            metadata={'user_id': current_user.id, 'plan': plan}
        )
        return {"id": checkout_session.id, "url": checkout_session.url}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/webhook")
async def stripe_webhook(request: Request, db: Session = Depends(deps.get_session)):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError as e:
        raise HTTPException(status_code=400, detail="Invalid signature")

    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        
        user_id = session.get('metadata', {}).get('user_id')
        plan = session.get('metadata', {}).get('plan')
        customer_id = session.get('customer')
        
        if user_id:
            user = db.get(User, int(user_id))
            if user:
                user.stripe_customer_id = customer_id
                user.subscription_status = "active"
                user.subscription_tier = plan or "basic"
                db.add(user)
                db.commit()

import smtplib
from email.message import EmailMessage
from pydantic import BaseModel

class ContactForm(BaseModel):
    first_name: str
    last_name: str
    email: str
    message: str

@router.post("/contact")
async def process_contact_form(contact: ContactForm):
    try:
        msg = EmailMessage()
        msg.set_content(f"""Nova mensagem de contato recebida pela Landing Page:

Nome: {contact.first_name} {contact.last_name}
Email: {contact.email}

Mensagem:
{contact.message}
""")
        msg["Subject"] = "Nova mensagem via Formulário de Vendas"
        msg["From"] = "Pumps SaaS Sales <vendas@pumps-saas.com>"
        msg["To"] = "vendas@pumps-saas.com"
        msg["Reply-To"] = contact.email

        if settings.SMTP_PASSWORD:
            with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
                server.starttls()
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                server.send_message(msg)
        else:
            print("SIMULATING EMAIL SEND (No SMTP_PASSWORD):", msg.as_string())
            
        return {"status": "success"}
    except Exception as e:
        print("Error sending email:", e)
        raise HTTPException(status_code=500, detail="Erro ao enviar e-mail. Tente novamente mais tarde.")
