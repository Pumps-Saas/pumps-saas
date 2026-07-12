import os
import sys

# Add the current directory to sys.path so app modules can be imported
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlmodel import Session, select
from app.core.db import engine
from app.models import User, CustomFluid, Pump, Invite, SupportTicket, Project, Scenario, TicketMessage

keep_emails = ['admin@pumps-saas.com', 'pedrorodriguesangelo@hotmail.com']

with Session(engine) as session:
    users_to_delete = session.exec(select(User).where(User.email.notin_(keep_emails))).all()
    
    deleted_count = 0
    for user in users_to_delete:
        print(f"Limpando dados do usuário: {user.email}")
        
        # Excluir fluidos
        for f in session.exec(select(CustomFluid).where(CustomFluid.user_id == user.id)).all():
            session.delete(f)
            
        # Excluir bombas
        for p in session.exec(select(Pump).where(Pump.user_id == user.id)).all():
            session.delete(p)
            
        # Excluir convites criados por ele
        for i in session.exec(select(Invite).where(Invite.created_by_id == user.id)).all():
            session.delete(i)
            
        # Desvincular convites que ele usou
        for i in session.exec(select(Invite).where(Invite.used_by_id == user.id)).all():
            i.used_by_id = None
            session.add(i)

        # Excluir tickets de suporte e mensagens
        for t in session.exec(select(SupportTicket).where(SupportTicket.user_id == user.id)).all():
            for m in session.exec(select(TicketMessage).where(TicketMessage.ticket_id == t.id)).all():
                session.delete(m)
            session.delete(t)
            
        # Excluir projetos e cenários
        for p in session.exec(select(Project).where(Project.user_id == user.id)).all():
            for s in session.exec(select(Scenario).where(Scenario.project_id == p.id)).all():
                session.delete(s)
            session.delete(p)
            
        # Finalmente, excluir o usuário
        session.delete(user)
        deleted_count += 1
    
    session.commit()
    print(f"Limpeza concluída! {deleted_count} usuários removidos e todos os seus dados apagados.")
