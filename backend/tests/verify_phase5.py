import requests
import json
import sys

BASE_URL = "http://localhost:8000/api/v1"

def test_pump_insufficient():
    print("\n--- Testing Pump Insufficient (Phase 5) ---")
    
    # 1. Define a system with High Static Head (e.g., 100m)
    # 2. Define a pump with Low Max Head (e.g., 50m)
    
    payload = {
        "suction_sections": [],
        "discharge_sections_before": [],
        "discharge_parallel_sections": {},
        "discharge_sections_after": [],
        "fluid": {
            "name": "Water",
            "rho": 998.2,
            "nu": 1.004e-6,
            "pv_kpa": 2.34
        },
        "static_head_m": 100, # High head
        "pressure_suction_bar_g": 0,
        "pressure_discharge_bar_g": 0,
        "atmospheric_pressure_bar": 1.013,
        
        "pump_curve_points": [
            {"flow": 0, "head": 50, "efficiency": 0}, # Shut-off head 50m < 100m
            {"flow": 100, "head": 40, "efficiency": 0}
        ]
    }
    
    try:
        response = requests.post(f"{BASE_URL}/calculate/operating-point", json=payload)
        
        if response.status_code == 400:
            print("PASS: Received 400 Bad Request as expected.")
            print(f"Error Message: {response.json()['detail']}")
            if "Pump insufficient" in response.json()['detail']:
                print("PASS: Error message contains 'Pump insufficient'.")
            else:
                print("FAIL: Error message does not match expected.")
        else:
            print(f"FAIL: Expected 400, got {response.status_code}")
            print(response.text)
            sys.exit(1)
            
    except Exception as e:
        print(f"FAIL: Request failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    test_pump_insufficient()
    print("\nSUCCESS: Phase 5 backend verification passed.")
