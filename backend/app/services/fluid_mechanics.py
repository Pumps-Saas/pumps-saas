import math
import numpy as np
from typing import List, Dict, Optional
from ..schemas.calculations import PipeSection, FluidProperties, HeadLossResult

def calculate_pipe_section_loss(
    section: PipeSection,
    flow_rate_m3h: float,
    fluid: FluidProperties
) -> HeadLossResult:
    """
    Calculates head loss in a single pipe section using Darcy-Weisbach equation.
    """
    if flow_rate_m3h < 0:
        flow_rate_m3h = 0
    
    # Convert units
    flow_rate_m3s = flow_rate_m3h / 3600.0
    diameter_m = section.diameter_mm / 1000.0
    length_m = section.length_m
    roughness_m = section.roughness_mm / 1000.0
    nu = fluid.nu

    # Handle zero diameter to avoid division by zero
    if diameter_m <= 0:
        return HeadLossResult(
            section_id=section.id,
            total_loss_m=1e12,
            major_loss_m=1e12,
            minor_loss_m=0,
            velocity_m_s=0,
            reynolds=0,
            friction_factor=0
        )

    area = (math.pi * diameter_m**2) / 4
    velocity = flow_rate_m3s / area if area > 0 else 0
    reynolds = (velocity * diameter_m) / nu if nu > 0 else 0

    friction_factor = 0.0
    if reynolds > 4000:
        # Colebrook-White approximation (Swamee-Jain is also good, but let's stick to the log formula used in original)
        # Original used: 0.25 / (log10((eps/D)/3.7 + 5.74/Re^0.9))^2
        # This is the Swamee-Jain approximation of Colebrook-White
        if length_m > 0:
             log_term = math.log10((roughness_m / (3.7 * diameter_m)) + (5.74 / reynolds**0.9))
             friction_factor = 0.25 / (log_term**2)
    elif reynolds > 0:
        # Laminar flow
        friction_factor = 64 / reynolds
    
    # Major Loss (Friction)
    major_loss = friction_factor * (length_m / diameter_m) * (velocity**2 / (2 * 9.81))

    # Minor Loss (Fittings/Local)
    k_total = sum(fitting.k * fitting.quantity for fitting in section.fittings)
    minor_loss = k_total * (velocity**2 / (2 * 9.81))
    
    # Equipment fixed loss
    equipment_loss = section.equipment_loss_m

    total_loss = major_loss + minor_loss + equipment_loss

    return HeadLossResult(
        section_id=section.id,
        total_loss_m=total_loss,
        major_loss_m=major_loss,
        minor_loss_m=minor_loss + equipment_loss,
        velocity_m_s=velocity,
        reynolds=reynolds,
        friction_factor=friction_factor
    )

def calculate_series_loss(
    sections: List[PipeSection],
    flow_rate_m3h: float,
    fluid: FluidProperties
) -> float:
    """
    Calculates total head loss for a list of pipe sections in series.
    """
    total_loss = 0.0
    if not sections:
        return 0.0
    
    for section in sections:
        result = calculate_pipe_section_loss(section, flow_rate_m3h, fluid)
        total_loss += result.total_loss_m
        
    return total_loss
