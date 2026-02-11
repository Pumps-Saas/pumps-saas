from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any, Optional
import numpy as np
import numpy as np

from app.schemas.calculations import (
    PipeSection, FluidProperties, HeadLossResult, 
    OperatingPointRequest, OperatingPointResponse, SystemHeadCurveRequest
)
from app.services.fluid_mechanics import calculate_pipe_section_loss, calculate_series_loss
from app.services.optimization import calculate_parallel_loss, find_operating_point

router = APIRouter()

def pressure_to_head(pressure_bar: float, fluid: FluidProperties) -> float:
    """Converts pressure in bar to head in meters."""
    # 1 bar = 100,000 Pa
    # H = P / (rho * g)
    pressure_pa = pressure_bar * 100000
    g = 9.81
    return pressure_pa / (fluid.rho * g)

@router.post("/pipe-loss", response_model=HeadLossResult)
def get_pipe_loss(section: PipeSection, flow_rate_m3h: float, fluid: FluidProperties):
    """
    Calculate head loss for a single pipe section.
    """
    return calculate_pipe_section_loss(section, flow_rate_m3h, fluid)

@router.post("/system-curve")
def get_system_curve(request: SystemHeadCurveRequest):
    """
    Generate System Head vs Flow curve points.
    Considers geometric static head AND pressure differences.
    """
    # Calculate Pressure Head Difference
    head_pressure_suction = pressure_to_head(request.pressure_suction_bar_g, request.fluid)
    head_pressure_discharge = pressure_to_head(request.pressure_discharge_bar_g, request.fluid)
    
    # Total Static Head = Delta Z + Delta P_head
    # If static_head_m is Geometric Elevation (Z2 - Z1)
    total_static_head_m = request.static_head_m + (head_pressure_discharge - head_pressure_suction)

    flows = np.linspace(request.flow_min_m3h, request.flow_max_m3h, request.steps)
    points = []
    
    for flow in flows:
        if flow < 0: continue
        
        loss_suction = calculate_series_loss(request.suction_sections, flow, request.fluid)
        loss_before = calculate_series_loss(request.discharge_sections_before, flow, request.fluid)
        loss_parallel, _ = calculate_parallel_loss(request.discharge_parallel_sections, flow, request.fluid)
        
        if loss_parallel == -1.0:
            continue # Skip invalid points
            
        loss_after = calculate_series_loss(request.discharge_sections_after, flow, request.fluid)
        
        total_dynamic_head = loss_suction + loss_before + loss_parallel + loss_after
        total_head = total_static_head_m + total_dynamic_head
        
        
        # Calculate NPSHa for this flow
        # TODO: Refactor calculate_npsha to accept just loss_suction to avoid recalculating
        # For now, let's just reuse logic: NPSHa = H_abs_suction - H_vapor - H_loss_suction
        # Pre-calculated head_pressure_suction contains P_gauge effect converted to head.
        # But calculate_npsha uses P_gauge directly. Let's use calculate_npsha function for consistency.
        
        npsha = calculate_npsha(
            flow, 
            request.suction_sections, 
            request.fluid, 
            request.atmospheric_pressure_bar, 
            request.pressure_suction_bar_g
        )

        points.append({
            "flow": float(flow), 
            "head": float(total_head),
            "npsh_available": float(npsha)
        })
        
    return {"points": points}

def interpolate_npshr(flow: float, points: List[Any]) -> Optional[float]:
    """Interpolates NPSH Required from pump curve points."""
    # Handle dict or object
    def get_val(p, key):
        return p.get(key) if isinstance(p, dict) else getattr(p, key, None)

    npshr_points = [p for p in points if get_val(p, 'npshr') is not None]
    if len(npshr_points) < 2:
        return None
    flows = [get_val(p, 'flow') for p in npshr_points]
    npshrs = [get_val(p, 'npshr') for p in npshr_points]
    # Simple linear interpolation for now
    return float(np.interp(flow, flows, npshrs))

def interpolate_efficiency(flow: float, points: List[Any]) -> Optional[float]:
    """Interpolates efficiency from pump curve points."""
    def get_val(p, key):
        return p.get(key) if isinstance(p, dict) else getattr(p, key, None)

    eff_points = [p for p in points if get_val(p, 'efficiency') is not None]
    if len(eff_points) < 2:
        return None
    flows = [get_val(p, 'flow') for p in eff_points]
    effs = [get_val(p, 'efficiency') for p in eff_points]
    return float(np.interp(flow, flows, effs))

def calculate_npsha(
    flow_op: float, 
    suction_sections: List[PipeSection], 
    fluid: FluidProperties, 
    patm_bar: float, 
    p_gauge_suction_bar: float,
    # NOTE: We need Geometric Suction Head/Lift separately to be precise, 
    # but currently we don't have separate Z_suction in schema. 
    # Assuming 'pressure_suction_bar_g' includes any static column effect 
    # OR we are assuming Z_suction = 0 (pump centerline) for now if not provided.
    # To be fully accurate, the user should provide 'Static Suction Head' (Z1 - Z_pump).
    # Since we lack that field in current schema update (only total static), 
    # we will proceed with: NPSHa = (Patm + P_gauge - P_vapor)/gamma - H_loss_suction
    # This assumes the source level is at the pump centerline OR P_gauge accounts for Z.
    # TODO: Add Z_suction specifically in Phase 3b.
) -> float:
    # 1. Absolute Pressure at Suction Source
    p_abs_suction_bar = patm_bar + p_gauge_suction_bar
    
    # 2. Convert Vapor Pressure (kPa -> bar)
    pv_bar = fluid.pv_kpa / 100.0
    
    # 3. Head conversions
    head_abs_suction = pressure_to_head(p_abs_suction_bar, fluid)
    head_vapor = pressure_to_head(pv_bar, fluid)
    
    # 4. Suction Friction Loss
    h_loss_suction = calculate_series_loss(suction_sections, flow_op, fluid)
    
    # NPSHa = H_abs_source - H_vapor - H_loss
    # (Ignoring Z_suction for now as noted)
    return head_abs_suction - head_vapor - h_loss_suction


@router.post("/operating-point", response_model=OperatingPointResponse)
def get_operating_point(request: OperatingPointRequest):
    """
    Find operating point with advanced Phase 3 features (Pressure, NPSH).
    """
    if len(request.pump_curve_points) < 3:
        raise HTTPException(status_code=400, detail="At least 3 pump curve points are required.")
    
    flows = [p['flow'] for p in request.pump_curve_points]
    heads = [p['head'] for p in request.pump_curve_points]
    
    coeffs = np.polyfit(flows, heads, 2)
    pump_curve_func = np.poly1d(coeffs)
    
    # Calculate Effective Total Static Head
    head_pressure_suction = pressure_to_head(request.pressure_suction_bar_g, request.fluid)
    head_pressure_discharge = pressure_to_head(request.pressure_discharge_bar_g, request.fluid)
    total_static_head_m = request.static_head_m + (head_pressure_discharge - head_pressure_suction)

    flow_op, head_op, _ = find_operating_point(
        request.suction_sections,
        request.discharge_sections_before,
        request.discharge_parallel_sections,
        request.discharge_sections_after,
        total_static_head_m, # Passing combined static + pressure head
        request.fluid,
        pump_curve_func
    )
    
    if flow_op is None:
        raise HTTPException(status_code=404, detail="Could not find a valid operating point.")
        
    # --- Detailed Analysis ---
    
    # Efficiency & Power
    efficiency_op = interpolate_efficiency(flow_op, request.pump_curve_points)
    power_kw = None
    cost_per_year = None
    if efficiency_op is not None and efficiency_op > 0:
        q_m3s = flow_op / 3600.0
        rho = request.fluid.rho
        g = 9.81
        eta_pump = efficiency_op / 100.0
        eta_motor = request.efficiency_motor
        power_kw = (q_m3s * rho * g * head_op) / (eta_pump * eta_motor * 1000.0)
        cost_per_year = power_kw * request.hours_per_day * 365 * request.energy_cost_per_kwh

    # Detailed Losses
    details = []
    def append_details(sections: List[PipeSection]):
        for s in sections:
            details.append(calculate_pipe_section_loss(s, flow_op, request.fluid))

    append_details(request.suction_sections)
    append_details(request.discharge_sections_before)
    _, flow_dist = calculate_parallel_loss(request.discharge_parallel_sections, flow_op, request.fluid)
    for branch_name, branch_sections in request.discharge_parallel_sections.items():
        branch_flow = flow_dist.get(branch_name, 0)
        for s in branch_sections:
            details.append(calculate_pipe_section_loss(s, branch_flow, request.fluid))
    append_details(request.discharge_sections_after)

    # NPSH Calculation
    npsha = calculate_npsha(
        flow_op, 
        request.suction_sections, 
        request.fluid, 
        request.atmospheric_pressure_bar, 
        request.pressure_suction_bar_g
    )

    # NPSHr Interpolation
    npshr = interpolate_npshr(flow_op, request.pump_curve_points)
    cavitation_risk = (npshr is not None and npsha < npshr)
    
    return OperatingPointResponse(
        flow_op=float(flow_op),
        head_op=float(head_op),
        efficiency_op=float(efficiency_op) if efficiency_op else None,
        power_kw=float(power_kw) if power_kw else None,
        cost_per_year=float(cost_per_year) if cost_per_year else None,
        npsh_available=float(npsha),
        npsh_required=float(npshr) if npshr is not None else None,
        cavitation_risk=cavitation_risk,
        details=details
    )
