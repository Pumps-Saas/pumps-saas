import sys
import os
from pathlib import Path

# Add the 'backend' directory to the Python path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlmodel import Session, select
from app.models import User, Project, Scenario, Pump
from app.core.config import settings
from sqlalchemy import create_engine
import json

engine = create_engine(settings.DATABASE_URL)

def seed():
    with Session(engine) as session:
        # Find Admin User
        admin = session.exec(select(User).where(User.email == "admin@pumps.com")).first()
        if not admin:
            print("Admin user not found!")
            return

        # 1. Create Test Project
        project = session.exec(select(Project).where(Project.name == "Projeto Teste", Project.user_id == admin.id)).first()
        if not project:
            project = Project(name="Projeto Teste", description="Projeto para demonstrar todas as features Premium", user_id=admin.id)
            session.add(project)
            session.commit()
            session.refresh(project)

        # 2. Create Premium Scenario
        scenario_data = {
            "fluid": {
                "name": "Water (20°C)",
                "rho": 998.2,
                "nu": 1.004e-06,
                "pv_kpa": 2.34
            },
            "suction_sections": [
                {
                    "id": "s1",
                    "name": "Sucção Principal",
                    "length_m": 15,
                    "equipment_loss_m": 0,
                    "diameter_mm": 150,
                    "material": "Aço Carbono",
                    "roughness_mm": 0.045,
                    "fittings": [
                        {"name": "Válvula de Gaveta Aberta", "k": 0.2, "quantity": 1},
                        {"name": "Cotovelo 90° Padrão", "k": 0.75, "quantity": 2}
                    ]
                }
            ],
            "discharge_sections_before": [],
            "discharge_parallel_sections": {},
            "discharge_sections_after": [
                {
                    "id": "d1",
                    "name": "Recalque Principal",
                    "length_m": 120,
                    "equipment_loss_m": 0,
                    "diameter_mm": 100,
                    "material": "Aço Carbono",
                    "roughness_mm": 0.045,
                    "fittings": [
                        {"name": "Válvula de Retenção", "k": 2.0, "quantity": 1},
                        {"name": "Válvula Globo (Controle)", "k": 6.0, "quantity": 1},
                        {"name": "Cotovelo 90° Padrão", "k": 0.75, "quantity": 5}
                    ]
                }
            ],
            "static_head": 30,
            "pressure_suction_bar_g": 0,
            "pressure_discharge_bar_g": 2.5,
            "atmospheric_pressure_bar": 1.01325,
            "altitude_m": 0,
            "pump_manufacturer": "Sulzer",
            "pump_model": "AHLSTAR A 50-200",
            "pump_base_rpm": 3500,
            "pump_current_rpm": 2900,
            "parallel_pumps": 2,
            "pump_curve": [
                {"flow": 0, "head": 65, "efficiency": 0, "npshr": 1},
                {"flow": 25, "head": 62, "efficiency": 45, "npshr": 1.5},
                {"flow": 50, "head": 55, "efficiency": 72, "npshr": 2.2},
                {"flow": 75, "head": 42, "efficiency": 68, "npshr": 4.0},
                {"flow": 100, "head": 20, "efficiency": 40, "npshr": 8.0}
            ],
            "efficiency_motor": 0.92,
            "hours_per_day": 16,
            "days_per_year": 365,
            "energy_cost_per_kwh": 0.85
        }

        scenario = session.exec(select(Scenario).where(Scenario.name == "Cenário Teste Premium", Scenario.project_id == project.id)).first()
        if not scenario:
            scenario = Scenario(name="Cenário Teste Premium", project_id=project.id, data=scenario_data)
            session.add(scenario)
        else:
            scenario.data = scenario_data
        
        # 3. Create Global Pumps
        global_pumps_data = [
            {
                "manufacturer": "KSB",
                "model": "Meganorm 65-200",
                "is_global": True,
                "curve_points": [
                    {"flow": 0, "head": 50, "efficiency": 0},
                    {"flow": 30, "head": 48, "efficiency": 50},
                    {"flow": 60, "head": 42, "efficiency": 75},
                    {"flow": 90, "head": 30, "efficiency": 60},
                    {"flow": 120, "head": 10, "efficiency": 30}
                ]
            },
            {
                "manufacturer": "Goulds",
                "model": "3196 2x3-8",
                "is_global": True,
                "curve_points": [
                    {"flow": 0, "head": 80, "efficiency": 0},
                    {"flow": 40, "head": 78, "efficiency": 40},
                    {"flow": 80, "head": 70, "efficiency": 65},
                    {"flow": 120, "head": 55, "efficiency": 78},
                    {"flow": 160, "head": 30, "efficiency": 50}
                ]
            },
            {
                "manufacturer": "Flowserve",
                "model": "Mark 3 1.5x3-10",
                "is_global": True,
                "curve_points": [
                    {"flow": 0, "head": 120, "efficiency": 0},
                    {"flow": 25, "head": 115, "efficiency": 35},
                    {"flow": 50, "head": 100, "efficiency": 60},
                    {"flow": 75, "head": 75, "efficiency": 70},
                    {"flow": 100, "head": 40, "efficiency": 45}
                ]
            }
        ]

        for gp_data in global_pumps_data:
            gp = session.exec(select(Pump).where(Pump.model == gp_data["model"], Pump.is_global == True)).first()
            if not gp:
                gp = Pump(**gp_data, user_id=admin.id)
                session.add(gp)
        
        session.commit()
        print("Teste Premium Criado com Sucesso!")

if __name__ == "__main__":
    seed()
