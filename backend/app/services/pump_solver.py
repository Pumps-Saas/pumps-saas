import numpy as np
from scipy.optimize import root
from typing import List, Tuple, Optional, Callable
from app.schemas.engineering import PumpCurvePoint, SystemState, OperatingPointResult
from app.services.fluid_dynamics import calculate_segment_head_loss

def fit_pump_curve(points: List[PumpCurvePoint], degree: int = 2) -> Tuple[Optional[np.poly1d], Optional[np.poly1d], Optional[np.poly1d]]:
    """
    Fit polynomial curves for Head vs Flow, Efficiency vs Flow, and NPSHr vs Flow.
    Returns (head_poly, eff_poly, npshr_poly).
    """
    if len(points) < degree + 1:
        return None, None, None

    flows = np.array([p.flow for p in points])
    heads = np.array([p.head for p in points])
    effs = np.array([p.efficiency for p in points])
    npshrs = np.array([p.npshr if p.npshr is not None else 0.0 for p in points])

    # Fit Head
    head_coeffs = np.polyfit(flows, heads, degree)
    head_poly = np.poly1d(head_coeffs)

    # Fit Efficiency
    eff_poly = None
    if np.any(effs > 0):
        eff_coeffs = np.polyfit(flows, effs, degree)
        eff_poly = np.poly1d(eff_coeffs)

    # Fit NPSHr
    npshr_poly = None
    if np.any(npshrs > 0):
        # Determine degree for NPSHr - often 2 is enough, but use passed degree
        npshr_coeffs = np.polyfit(flows, npshrs, degree)
        npshr_poly = np.poly1d(npshr_coeffs)

    return head_poly, eff_poly, npshr_poly

def calculate_system_curve_func(system: SystemState) -> Callable[[float], float]:
    """
    Returns a function H_sys(Q) that calculates total system head for a given flow Q.
    """
    def system_curve(flow_m3h: float) -> float:
        if flow_m3h < 0:
            return system.static_head
        
        # Calculate dynamic head loss for all segments in series
        total_head_loss = 0.0
        
        # Suction
        for seg in system.suction_segments:
            res = calculate_segment_head_loss(seg, flow_m3h, system.fluid)
            total_head_loss += res["head_loss_total"]
            
        # Discharge
        for seg in system.discharge_segments:
            res = calculate_segment_head_loss(seg, flow_m3h, system.fluid)
            total_head_loss += res["head_loss_total"]
            
        return system.static_head + total_head_loss
        
    return system_curve

def find_operating_point(system: SystemState) -> OperatingPointResult:
    """
    Find intersection of Pump Curve and System Curve.
    """
    head_poly, eff_poly, npshr_poly = fit_pump_curve(system.pump_curve)
    
    if not head_poly:
        return OperatingPointResult(
            flow=0, head=0, efficiency=0, power_kw=0, cost_per_year=0, 
            npsh_available=0, npsh_required=0, details=[]
        )
        
    sys_curve_func = calculate_system_curve_func(system)
    
    # Define error function: Pump_Head(Q) - System_Head(Q) = 0
    def error_func(q):
        # Prevent negative flow exploration
        if q < 0: return 1e6 
        return head_poly(q) - sys_curve_func(q)

    # Initial guess: Average of pump curve flow range
    max_flow = max(p.flow for p in system.pump_curve)
    initial_guess = [max_flow * 0.5]
    
    sol = root(error_func, initial_guess, method='hybr')
    
    op_flow = 0.0
    op_head = 0.0
    
    if sol.success:
        op_flow = float(sol.x[0])
        op_head = float(head_poly(op_flow))
    
    # Safety Check: If solver failed or found negative flow, fallback to intersection not found logic (or zero)
    if op_flow < 0 or not sol.success:
        op_flow = 0.0
        op_head = 0.0

    # Calculate final details at Operating Point
    details = []
    
    # Re-calculate segment details for the final flow
    for seg in system.suction_segments:
         res = calculate_segment_head_loss(seg, op_flow, system.fluid)
         details.append({**res, "segment_id": seg.id, "flow_rate": op_flow})
         
    for seg in system.discharge_segments:
         res = calculate_segment_head_loss(seg, op_flow, system.fluid)
         details.append({**res, "segment_id": seg.id, "flow_rate": op_flow})
    
    # Calculate Power & Cost
    op_eff = float(eff_poly(op_flow)) if eff_poly else 0.0
    op_npshr = float(npshr_poly(op_flow)) if npshr_poly else 0.0
    
    fluid_density = system.fluid.density
    
    power_kw = 0.0
    if op_eff > 0:
        # P (kW) = (Q * rho * g * H) / (3.6e6 * efficiency)
        # Efficiency is percentage e.g. 70
        power_kw = (op_flow * fluid_density * 9.81 * op_head) / (3600 * 1000 * (op_eff / 100))
        
    return OperatingPointResult(
        flow=op_flow,
        head=op_head,
        efficiency=op_eff,
        power_kw=power_kw,
        cost_per_year=power_kw * 24 * 365 * 0.50, # Rough estimate using 0.50 R$/kWh
        npsh_available=0.0, # Placeholder
        npsh_required=op_npshr,
        details=details
    )
