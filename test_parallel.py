import sys
sys.path.append('c:\\Users\\pedro\\OneDrive\\Documentos\\Antigravity\\Pumps\\backend')
from app.schemas.calculations import PipeSection, FluidProperties, FittingInfo
from app.services.optimization import calculate_parallel_loss

fluid = FluidProperties(name="Water", density_kg_m3=1000, viscosity_cp=1.0, vapor_pressure_bar_a=0.02)

r1 = [
    PipeSection(id="1", length_m=10, elevation_m=0, nominal_diameter_mm=80, internal_diameter_mm=77.9, roughness_mm=0.045, fittings=[]),
    PipeSection(id="2", length_m=10, elevation_m=0, nominal_diameter_mm=100, internal_diameter_mm=102.3, roughness_mm=0.045, fittings=[])
]
r2 = [
    PipeSection(id="3", length_m=10, elevation_m=0, nominal_diameter_mm=100, internal_diameter_mm=102.3, roughness_mm=0.045, fittings=[])
]

sections = {"R1": r1, "R2": r2}

try:
    print("Testing total flow 0")
    loss, flows = calculate_parallel_loss(sections, 0.0, fluid)
    print("0 flow OK", loss, flows)
    
    print("Testing total flow 100")
    loss, flows = calculate_parallel_loss(sections, 100.0, fluid)
    print("100 flow OK", loss, flows)
except Exception as e:
    print("ERROR:", e)
