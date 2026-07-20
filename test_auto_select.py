import sys
sys.path.append('c:\\Users\\pedro\\OneDrive\\Documentos\\Antigravity\\Pumps\\backend')
from app.api.v1.pumps_global import auto_select_pump
from app.schemas.calculations import SystemHeadCurveRequest, FluidProperties, PipeSection
from unittest.mock import MagicMock
from sqlmodel import Session

fluid = FluidProperties(name="Water", density_kg_m3=1000, viscosity_cp=1.0, vapor_pressure_bar_a=0.02, rho=1000.0, nu=1e-6, pv_kpa=2.0)
request = SystemHeadCurveRequest(
    fluid=fluid,
    flow_min_m3h=0,
    flow_max_m3h=100,
    static_head_m=10,
    pressure_suction_bar_g=0,
    pressure_discharge_bar_g=0,
    suction_sections=[],
    discharge_sections_before=[],
    discharge_parallel_sections={
        "R1": [PipeSection(id="1", length_m=10, elevation_m=0, diameter_mm=77.9, material="Steel", roughness_mm=0.045, fittings=[])],
        "R2": [PipeSection(id="2", length_m=10, elevation_m=0, diameter_mm=102.3, material="Steel", roughness_mm=0.045, fittings=[])]
    },
    discharge_sections_after=[]
)

session = MagicMock(spec=Session)
# mock session.exec().all() to return a mock pump
pump_mock = MagicMock()
pump_mock.id = 1
pump_mock.manufacturer = "Grundfos"
pump_mock.model = "CR 100"
pump_mock.max_head_m = 100
pump_mock.max_flow_m3h = 100
pump_mock.coeff_a = -0.01
pump_mock.coeff_b = 0
pump_mock.coeff_c = 50
pump_mock.curve_points = [{"flow": 0, "head": 50}, {"flow": 50, "head": 25}, {"flow": 100, "head": 0}]

mock_result = MagicMock()
mock_result.all.return_value = [pump_mock]
session.exec.return_value = mock_result
current_user = MagicMock()
current_user.subscription_tier = "premium"

try:
    print("Running auto_select_pump...")
    res = auto_select_pump(session=session, request=request, current_user=current_user)
    print("Done! Result:", res)
except Exception as e:
    print("Exception occurred:", e)
