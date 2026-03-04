import numpy as np
from scipy.optimize import root_scalar

def L0(q): return 1000 + 0.1 * q**2
def L1(q): return 0.5 * q**2
def L2(q): return 0.5 * q**2

losses = [L0, L1, L2]
total_flow = 100.0

def branch_flow(branch_idx, H_target):
    loss_func = losses[branch_idx]
    if loss_func(0) >= H_target:
        return 0.0
    
    q_high = total_flow if total_flow > 0 else 1.0
    while loss_func(q_high) < H_target:
        q_high *= 2.0
        
    def err(q): return loss_func(q) - H_target
    res = root_scalar(err, bracket=[0, q_high], method='brentq')
    return res.root

def total_flow_err(H_target):
    q_sum = sum(branch_flow(i, H_target) for i in range(len(losses)))
    return q_sum - total_flow

H_min = min(L(0) for L in losses)
H_max = max(L(total_flow) for L in losses)

if H_max <= H_min:
    H_max = H_min + 1.0

# Ensure bracket is valid
while total_flow_err(H_max) < 0:
    H_max *= 2.0

res_H = root_scalar(total_flow_err, bracket=[H_min, H_max], method='brentq')
H_final = res_H.root

flows = [branch_flow(i, H_final) for i in range(len(losses))]

print(f"H_final (Parallel Loss): {H_final:.2f} m")
for i, q in enumerate(flows):
    print(f"Branch {i}: Flow = {q:.2f} m3/h, Loss = {losses[i](q):.2f} m")
