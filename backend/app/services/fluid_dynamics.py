import math
import numpy as np
from app.schemas.engineering import Fluid, PipeSegmentDefinition

GRAVITY = 9.81

def calculate_reynolds(velocity: float, diameter_m: float, kinematic_viscosity: float) -> float:
    """
    Calculate Reynolds Number.
    Re = (Velocity * Diameter) / Kinematic Viscosity
    """
    if kinematic_viscosity <= 0 or diameter_m <= 0:
        return 0.0
    return (velocity * diameter_m) / kinematic_viscosity

def calculate_friction_factor(reynolds: float, roughness_m: float, diameter_m: float) -> float:
    """
    Calculate Darcy friction factor 'f'.
    - Laminar (Re < 2000): f = 64/Re
    - Turbulent (Re > 4000): Swamee-Jain approximation of Colebrook-White
    """
    if reynolds <= 0:
        return 0.0
    
    if reynolds < 2000:
        return 64.0 / reynolds
    
    # Swamee-Jain Equation (Explicit approximation for turbulent flow)
    # Valid for 5000 < Re < 10^8 and 10^-6 < e/D < 10^-2
    # f = 0.25 / [log10( (e/3.7D) + (5.74/Re^0.9) )]^2
    
    if diameter_m <= 0:
        return 0.0
        
    relative_roughness = roughness_m / diameter_m
    
    # Transition zone handling (2000 < Re < 4000) - Interpolate or use Turbulent logic carefully
    # Detailed engineering often treats > 2300 as transitional/turbulent.
    # We will use Swamee-Jain for Re > 2300 for simplicity and robustness in this SaaS.
    
    try:
        term1 = relative_roughness / 3.7
        term2 = 5.74 / (reynolds ** 0.9)
        log_val = math.log10(term1 + term2)
        return 0.25 / (log_val ** 2)
    except (ValueError, ZeroDivisionError):
        return 0.02 # Fallback for edge cases

def calculate_velocity(flow_rate_m3h: float, diameter_mm: float) -> float:
    """
    Calculate velocity in m/s from flow in m3/h and diameter in mm.
    """
    if diameter_mm <= 0:
        return 0.0
    
    diameter_m = diameter_mm / 1000.0
    area = math.pi * (diameter_m ** 2) / 4.0
    flow_m3s = flow_rate_m3h / 3600.0
    
    return flow_m3s / area

def calculate_segment_head_loss(
    segment: PipeSegmentDefinition, 
    flow_rate_m3h: float, 
    fluid: Fluid
) -> dict:
    """
    Calculate head loss for a single pipe segment.
    Returns dictionary with detailed results.
    """
    if segment.diameter <= 0 or segment.length < 0:
         return {
            "velocity": 0.0,
            "reynolds": 0.0,
            "friction_factor": 0.0,
            "head_loss_major": 0.0,
            "head_loss_minor": 0.0,
            "head_loss_total": 0.0
        }

    velocity = calculate_velocity(flow_rate_m3h, segment.diameter)
    diameter_m = segment.diameter / 1000.0
    roughness_m = segment.roughness / 1000.0
    
    reynolds = calculate_reynolds(velocity, diameter_m, fluid.viscosity)
    friction_factor = calculate_friction_factor(reynolds, roughness_m, diameter_m)
    
    # Darcy-Weisbach
    # hf = f * (L/D) * (v^2 / 2g)
    head_loss_major = 0.0
    if diameter_m > 0:
        head_loss_major = friction_factor * (segment.length / diameter_m) * (velocity**2 / (2 * GRAVITY))
        
    # Minor Losses
    # hm = K * (v^2 / 2g)
    k_total = sum(f.k * f.quantity for f in segment.fittings)
    head_loss_minor = k_total * (velocity**2 / (2 * GRAVITY))
    
    # Add Equipment Loss (e.g. Heat Exchanger fixed loss)
    head_loss_minor += segment.equipment_loss
    
    return {
        "velocity": velocity,
        "reynolds": reynolds,
        "friction_factor": friction_factor,
        "head_loss_major": head_loss_major,
        "head_loss_minor": head_loss_minor,
        "head_loss_total": head_loss_major + head_loss_minor
    }
