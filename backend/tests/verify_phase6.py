import requests
import json
import sys

BASE_URL = "http://localhost:8000/api/v1"

def test_natural_flow_analysis():
    print("\n--- Testing Natural Flow & Memorial Analysis (Phase 6) ---")
    
    # scenario: High Suction Pressure (5 bar) vs 0 Discharge Pressure
    # Static Elevation: +10m
    # Net Pressure Head (Water): (0 - 5) * 100000 / (998.2 * 9.81) ≈ -51.05m
    # Total Static Head: 10 - 51.05 = -41.05m (Negative -> Driving Flow)
    
    payload = {
        "suction_sections": [
            {"length_m": 10, "diameter_mm": 100, "material": "Steel", "roughness_mm": 0.045, "fittings": []}
        ],
        "discharge_sections_before": [
            {"length_m": 50, "diameter_mm": 100, "material": "Steel", "roughness_mm": 0.045, "fittings": []}
        ],
        "discharge_parallel_sections": {},
        "discharge_sections_after": [],
        "fluid": {
            "name": "Water",
            "rho": 998.2,
            "nu": 1.004e-6,
            "pv_kpa": 2.34
        },
        "static_head_m": 10, 
        "pressure_suction_bar_g": 5.0, # High pressure source
        "pressure_discharge_bar_g": 0,
        "atmospheric_pressure_bar": 1.013,
        
        # Pump curve just to have valid request (even if pump is not needed for flow, it might add to it)
        # Pump Head + (-41.05) = Friction(Q)
        # Pump Head = Friction(Q) + 41.05
        # If Q is large, Friction > 41.05, so Pump Head required > 0.
        "pump_curve_points": [
            {"flow": 0, "head": 60, "efficiency": 0},
            {"flow": 100, "head": 50, "efficiency": 0},
             {"flow": 200, "head": 40, "efficiency": 0}
        ]
    }
    
    try:
        response = requests.post(f"{BASE_URL}/calculate/operating-point", json=payload)
        
        if response.status_code == 200:
            data = response.json()
            natural_flow = data.get('natural_flow_m3h', 0)
            breakdown = data.get('head_breakdown', {})
            
            print(f"Operating Flow: {data['flow_op']} m3/h")
            print(f"Natural Flow: {natural_flow} m3/h")
            print("Head Breakdown:")
            print(json.dumps(breakdown, indent=2))
            
            # Checks
            if natural_flow > 0:
                print("PASS: Natural Flow detected (>0).")
            else:
                print("FAIL: Expected Natural Flow > 0 due to high suction pressure.")
                
            total_head_calc = breakdown['static_head_m'] + breakdown['pressure_head_m'] + breakdown['friction_head_m']
            if abs(total_head_calc - breakdown['total_head_m']) < 0.1:
                 print("PASS: Total Head matches sum of breakdown components.")
            else:
                 print(f"FAIL: Memorial Sum Mismatch: {total_head_calc} vs {breakdown['total_head_m']}")
                 
            # Check consistency with Pump Head (should be equal at OP)
            if abs(data['head_op'] - breakdown['total_head_m']) < 0.5:
                print("PASS: Pump Head matches Total Required Head.")
            else:
                print(f"FAIL: Pump Head ({data['head_op']}) != Total Required Head ({breakdown['total_head_m']})")
                
        else:
            print(f"FAIL: Request failed with {response.status_code}")
            print(response.text)
            sys.exit(1)
            
    except Exception as e:
        print(f"FAIL: Logic Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    test_natural_flow_analysis()
    print("\nSUCCESS: Phase 6 verification complete.")
