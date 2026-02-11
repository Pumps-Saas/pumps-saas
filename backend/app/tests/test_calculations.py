import pytest
import math
from app.schemas.calculations import PipeSection, FluidProperties, PipeFitting
from app.services.fluid_mechanics import calculate_pipe_section_loss, calculate_series_loss
from app.services.optimization import calculate_parallel_loss, find_operating_point

# Fixture for Standard Water
@pytest.fixture
def water_20c():
    return FluidProperties(
        name="Water 20C",
        rho=998.2,
        nu=1.004e-6,
        pv_kpa=2.34
    )

def test_single_pipe_loss(water_20c):
    # 100m length, 100mm diameter, Steel (0.046mm roughness)
    section = PipeSection(
        length_m=100.0,
        diameter_mm=100.0,
        material="Steel",
        roughness_mm=0.046
    )
    
    # flow 50 m3/h
    result = calculate_pipe_section_loss(section, 50.0, water_20c)
    
    # Manual Validation:
    # Q = 50/3600 = 0.01388 m3/s
    # A = pi * 0.1^2 / 4 = 0.007854 m2
    # V = 1.768 m/s
    # Re = 1.768 * 0.1 / 1.004e-6 = 1.76e5
    # eps/D = 0.00046
    # Haaland approx: 1/sqrt(f) = -1.8 log((eps/D/3.7)^1.11 + 6.9/Re)
    # f approx 0.018-0.019
    # hf = f * (L/D) * (v^2/2g)
    # hf approx 0.0185 * 1000 * (3.12 / 19.62) = 18.5 * 0.159 = 2.94 m
    
    assert result.velocity_m_s == pytest.approx(1.768, rel=0.01)
    assert result.reynolds > 1.7e5
    assert result.major_loss_m == pytest.approx(2.94, rel=0.1) # 10% tolerance is fine for differing friction methods

def test_parallel_loss(water_20c):
    # Two identical pipes in parallel should split flow equally
    section1 = PipeSection(length_m=100.0, diameter_mm=100.0, material="Steel", roughness_mm=0.046)
    section2 = PipeSection(length_m=100.0, diameter_mm=100.0, material="Steel", roughness_mm=0.046)
    
    parallel_sections = {
        "Branch A": [section1],
        "Branch B": [section2]
    }
    
    loss, distribution = calculate_parallel_loss(parallel_sections, 100.0, water_20c)
    
    assert distribution["Branch A"] == pytest.approx(50.0, rel=0.01)
    assert distribution["Branch B"] == pytest.approx(50.0, rel=0.01)
    assert loss > 0

def test_operating_point(water_20c):
    # Simple system: Static head 20m + Friction
    # Pump: H = 40 - 0.002 * Q^2
    
    suction = []
    discharge_before = [PipeSection(length_m=100.0, diameter_mm=100.0, material="Steel", roughness_mm=0.046)]
    discharge_after = []
    
    def pump_curve_func(q):
        return 40 - 0.002 * (q**2)
    
    flow_op, head_op, _ = find_operating_point(
        suction, discharge_before, {}, discharge_after,
        static_head_m=20.0,
        fluid=water_20c,
        pump_curve_func=pump_curve_func
    )
    
    # System Curve approx: H_sys = 20 + k * Q^2
    # At 50 m3/h, loss is ~3m. So H_sys(50) = 23m.
    # Pump(50) = 40 - 0.002*2500 = 35m.
    # Intersection should be between 50 and something higher.
    # Let's say Q=70. H_sys(70) ~ 20 + 3*(70/50)^2 = 20 + 3*1.96 = 26m.
    # Pump(70) = 40 - 0.002*4900 = 30.2m.
    # So intersection around 80?
    
    assert flow_op is not None
    assert 60 < flow_op < 90
    assert head_op == pytest.approx(pump_curve_func(flow_op), rel=0.001)
