import numpy as np
from scipy.optimize import root
from typing import List, Dict, Optional, Tuple, Callable
from ..schemas.calculations import PipeSection, FluidProperties
from .fluid_mechanics import calculate_series_loss

def calculate_parallel_loss(
    parallel_sections: Dict[str, List[PipeSection]],
    total_flow_m3h: float,
    fluid: FluidProperties
) -> Tuple[float, Dict[str, float]]:
    """
    Calculates head loss across parallel pipe branches and resulting flow distribution.
    Returns: (Head Loos (m), {branch_name: flow_m3h})
    """
    num_branches = len(parallel_sections)
    if num_branches < 2:
        return 0.0, {}

    branch_names = list(parallel_sections.keys())
    branch_lists = list(parallel_sections.values())

    # We solve for N-1 flow rates. The last one is determined by continuity.
    def equations(partial_flows_m3h):
        last_flow = total_flow_m3h - np.sum(partial_flows_m3h)
        
        # Penalty for negative flow (physically impossible in this simple model context)
        if last_flow < -0.01:
            return [1e12] * (num_branches - 1)

        all_flows = np.append(partial_flows_m3h, last_flow)
        losses = []
        for branch, flow in zip(branch_lists, all_flows):
            loss = calculate_series_loss(branch, flow, fluid)
            losses.append(loss)
        
        # Equations: Loss in branch[i] - Loss in last branch = 0
        errors = [losses[i] - losses[-1] for i in range(num_branches - 1)]
        return errors

    initial_guess = np.full(num_branches - 1, total_flow_m3h / num_branches)
    solution = root(equations, initial_guess, method='hybr', options={'xtol': 1e-8})

    if not solution.success:
        return -1.0, {}

    final_flows = np.append(solution.x, total_flow_m3h - np.sum(solution.x))
    
    # Calculate final loss using the first branch (all should be equal)
    final_loss = calculate_series_loss(branch_lists[0], final_flows[0], fluid)
    
    flow_distribution = {name: flow for name, flow in zip(branch_names, final_flows)}
    
    return final_loss, flow_distribution

def find_operating_point(
    suction_sections: List[PipeSection],
    discharge_sections_before: List[PipeSection],
    discharge_parallel_sections: Dict[str, List[PipeSection]],
    discharge_sections_after: List[PipeSection],
    static_head_m: float,
    fluid: FluidProperties,
    pump_curve_func: Callable[[float], float]
) -> Tuple[Optional[float], Optional[float], Callable[[float], float]]:
    """
    Finds the operating point (Flow, Head) where System Curve intersects Pump Curve.
    Returns: (Flow (m3/h), Head (m), System Curve Function)
    """

    def system_curve(flow_m3h):
        if flow_m3h < 0:
            return static_head_m
        
        loss_suction = calculate_series_loss(suction_sections, flow_m3h, fluid)
        loss_before = calculate_series_loss(discharge_sections_before, flow_m3h, fluid)
        loss_parallel, _ = calculate_parallel_loss(discharge_parallel_sections, flow_m3h, fluid)
        
        if loss_parallel == -1.0:
             # Logic error or non-convergence
             return 1e12
             
        loss_after = calculate_series_loss(discharge_sections_after, flow_m3h, fluid)
        
        total_dynamic_head = loss_suction + loss_before + loss_parallel + loss_after
        return static_head_m + total_dynamic_head

    def error_func(flow_m3h):
        try:
             # Handle single float input or numpy array
             f = float(flow_m3h)
             if f < 0: return 1e12
             return pump_curve_func(f) - system_curve(f)
        except TypeError:
             # If root passes an array
             return [pump_curve_func(fl) - system_curve(fl) for fl in flow_m3h]

    # Initial guess: 50 m3/h. Sometimes 'hybr' fails on extrapolated polynomials. 
    # Let's try multiple initial guesses if the first one fails to ensure we find intersections far out.
    guesses = [50.0, 10.0, 150.0, 300.0]
    flow_op = None
    
    for guess in guesses:
        solution = root(error_func, guess, method='hybr', options={'xtol': 1e-8})
        if solution.success and solution.x[0] > 1e-3:
            # Verify it's a real intersection (error is close to 0)
            if abs(error_func(solution.x[0])) < 0.1:
                flow_op = solution.x[0]
                break
                
    if flow_op is not None:
        head_op = pump_curve_func(flow_op)
        return flow_op, head_op, system_curve
    
    return None, None, system_curve

def find_natural_flow(
    suction_sections: List[PipeSection],
    discharge_sections_before: List[PipeSection],
    discharge_parallel_sections: Dict[str, List[PipeSection]],
    discharge_sections_after: List[PipeSection],
    total_static_head_m: float,
    fluid: FluidProperties
) -> float:
    """
    Finds the flow rate achievable without a pump (Gravity/Pressure driven).
    Logic: Solves for Q where System FrictionHead(Q) + TotalStaticHead = 0.
    Since Friction is always positive, TotalStaticHead must be negative (driving flow).
    """
    
    # Check if flow is inherently possible (negative static head drives flow)
    # Total Static Head = (Z2 - Z1) + (P2 - P1)/rho*g
    if total_static_head_m >= 0:
        return 0.0

    target_friction_loss = -total_static_head_m

    def friction_error_func(flow_m3h):
        # Prevent negative flow inputs during optimization
        # Use simple float cast since root passes array
        try:
            f = float(flow_m3h)
        except TypeError:
            f = float(flow_m3h[0])

        if f <= 1e-3:
            return -target_friction_loss
            
        loss_suction = calculate_series_loss(suction_sections, f, fluid)
        loss_before = calculate_series_loss(discharge_sections_before, f, fluid)
        loss_parallel, _ = calculate_parallel_loss(discharge_parallel_sections, f, fluid)
        
        if loss_parallel == -1.0:
                 return 1e9 # Penalty
                 
        loss_after = calculate_series_loss(discharge_sections_after, f, fluid)
        
        total_friction = loss_suction + loss_before + loss_parallel + loss_after
        
        return total_friction - target_friction_loss

    # Solve for root starting at 50 m3/h
    solution = root(friction_error_func, 50.0, method='hybr', options={'xtol': 1e-6})

    if solution.success and solution.x[0] > 1e-3:
        return float(solution.x[0])
        
    return 0.0
