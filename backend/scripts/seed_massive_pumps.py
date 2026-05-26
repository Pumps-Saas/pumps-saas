import os
import sys
import numpy as np
from sqlmodel import Session, select

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.core.db import engine
from app.models import User, Pump

def generate_pump_curve(bep_flow, bep_head):
    """
    Generate a realistic centrifugal pump curve (Flow, Head, Efficiency, NPSHr).
    Using Ns (Specific Speed) heuristics for typical shapes.
    """
    # Shut-off head usually 15-25% higher than BEP head
    shutoff_head = bep_head * 1.2
    
    # Parabolic curve: H = A - B*Q^2
    # At Q=0, H = shutoff_head -> A = shutoff_head
    # At Q=bep_flow, H = bep_head -> bep_head = shutoff_head - B*(bep_flow^2)
    B = (shutoff_head - bep_head) / (bep_flow**2)
    
    points = []
    # Generate 6 points from 0 to 120% of BEP flow
    max_flow = bep_flow * 1.2
    flows = np.linspace(0, max_flow, 6)
    
    for q in flows:
        h = shutoff_head - B * (q**2)
        
        # Efficiency is parabolic, 0 at shutoff, max at BEP, lower at max_flow
        # max efficiency roughly scales with pump size (e.g., 60-85%)
        max_eff = min(85, 55 + (bep_flow / 10))
        if q == 0:
            eff = 0
        else:
            eff = max_eff * (1 - ((q - bep_flow)/bep_flow)**2)
            eff = max(0, eff)
            
        # NPSHr typically rises quadratically with flow
        # NPSHr at BEP is roughly 2-5m
        npshr_bep = 3.0 + (bep_flow / 50)
        npshr = npshr_bep * (q / bep_flow)**2 + 0.5
        
        points.append({
            "flow": float(q),
            "head": float(h),
            "efficiency": float(eff),
            "npshr": float(npshr)
        })
        
    return points

def seed_massive_pumps():
    print("Seeding massive pump library...")
    
    brands = [
        ("Grundfos", "CR"), 
        ("Flowserve", "Mark 3"), 
        ("KSB", "Meganorm"), 
        ("Sulzer", "AHLSTAR"), 
        ("IMBIL", "INI"), 
        ("Century", "CEN"), 
        ("Schneider", "BC")
    ]
    
    with Session(engine) as session:
        user = session.exec(select(User).where(User.email == "admin@pumps.com")).first()
        if not user:
            print("Admin user not found. Run base seed first.")
            return

        # Clear existing global pumps to avoid duplicates on re-runs
        existing = session.exec(select(Pump).where(Pump.is_global == True)).all()
        for p in existing:
            session.delete(p)
        session.commit()

        count = 0
        for manufacturer, base_model in brands:
            # Generate 40 models per brand
            for i in range(40):
                if i < 20:
                    bep_flow = 10 + (i * 10) # 10 to 200
                    bep_head = 15 + ((i % 5) * 30) # 15 to 135
                else:
                    bep_flow = 250 + ((i - 20) * 150) # 250 to 3100
                    bep_head = 20 + ((i % 5) * 40) # 20 to 180
                
                model_name = f"{base_model} {int(bep_flow)}-{int(bep_head)}"
                curve_points = generate_pump_curve(bep_flow, bep_head)
                
                pump = Pump(
                    manufacturer=manufacturer,
                    model=model_name,
                    curve_points=curve_points,
                    is_global=True,
                    user_id=user.id
                )
                
                # Pre-calculate
                flows = [p.get('flow', 0) for p in curve_points]
                heads = [p.get('head', 0) for p in curve_points]
                coeffs = np.polyfit(flows, heads, 2)
                pump.coeff_a = float(coeffs[0])
                pump.coeff_b = float(coeffs[1])
                pump.coeff_c = float(coeffs[2])
                pump.max_head_m = float(max(heads))
                pump.max_flow_m3h = float(max(flows))

                session.add(pump)
                count += 1

        session.commit()
        print(f"Successfully seeded {count} global pumps!")

if __name__ == "__main__":
    seed_massive_pumps()
