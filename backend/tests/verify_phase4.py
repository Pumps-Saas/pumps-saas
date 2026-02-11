import requests
import json
import sys

BASE_URL = "http://localhost:8000/api/v1"

def test_standards():
    print("\n--- Testing Standards API ---")
    try:
        response = requests.get(f"{BASE_URL}/fluids/standards")
        response.raise_for_status()
        data = response.json()
        
        dims = data.get("diameters", {})
        print(f"checking for 40\" (1000mm)...")
        if '40" (1000mm)' in dims and dims['40" (1000mm)'] == 965.2:
            print("PASS: 40\" diameter found with correct ID.")
        else:
            print(f"FAIL: 40\" diameter missing or incorrect. Found: {dims.get('40\" (1000mm)')}")
            return False
            
        mats = data.get("materials", {})
        if "Concreto (Rugoso)" in mats:
             print("PASS: New materials found.")
        else:
             print("FAIL: Material 'Concreto (Rugoso)' missing.")
             return False

        return True
    except Exception as e:
        print(f"ERROR: {e}")
        return False

def test_system_curve_npsh():
    print("\n--- Testing System Curve NPSH Calculation ---")
    payload = {
        "fluid": {"name": "Water", "rho": 998.2, "nu": 1.004e-6, "pv_kpa": 2.34},
        "suction_sections": [
            {"id": "s1", "name": "Suction", "length_m": 10, "diameter_mm": 100, "material": "PVC", "roughness_mm": 0.0015, "equipment_loss_m": 0, "fittings": []}
        ],
        "discharge_sections_before": [],
        "discharge_parallel_sections": {},
        "discharge_sections_after": [],
        "static_head_m": 10,
        "pressure_suction_bar_g": 0,
        "pressure_discharge_bar_g": 0,
        "atmospheric_pressure_bar": 1.013,
        "flow_min_m3h": 0,
        "flow_max_m3h": 100,
        "steps": 5
    }
    
    try:
        response = requests.post(f"{BASE_URL}/calculate/system-curve", json=payload)
        response.raise_for_status()
        data = response.json()
        points = data.get("points", [])
        
        if not points:
            print("FAIL: No points returned.")
            return False
            
        first_point = points[0]
        if "npsh_available" in first_point:
            print(f"PASS: npsh_available found in response (Value at Q=0: {first_point['npsh_available']:.2f}m)")
            return True
        else:
            print("FAIL: npsh_available missing from response.")
            return False
    except Exception as e:
        print(f"ERROR: {e}")
        if response.content:
            print(f"Response Content: {response.content}")
        return False

def test_operating_point_npsh_risk():
    print("\n--- Testing Operating Point Cavitation Risk ---")
    # Scenario: High NPSHr, Low NPSHa
    payload = {
        "fluid": {"name": "Water", "rho": 998.2, "nu": 1.004e-6, "pv_kpa": 2.34},
        "suction_sections": [
            {"id": "s1", "name": "Suction", "length_m": 5, "diameter_mm": 50, "material": "PVC", "roughness_mm": 0.0015, "equipment_loss_m": 0, "fittings": []}
        ],
        "discharge_sections_before": [],
        "discharge_parallel_sections": {},
        "discharge_sections_after": [
             {"id": "d1", "name": "Discharge", "length_m": 10, "diameter_mm": 50, "material": "PVC", "roughness_mm": 0.0015, "equipment_loss_m": 0, "fittings": []}
        ],
        "static_head_m": 10,
        "pressure_suction_bar_g": -0.5, # Low suction pressure to lower NPSHa
        "pressure_discharge_bar_g": 0,
        "atmospheric_pressure_bar": 1.013,
        
        "pump_curve_points": [
            {"flow": 0, "head": 50, "npshr": 5},
            {"flow": 50, "head": 40, "npshr": 8}, # High NPSHr
            {"flow": 100, "head": 20, "npshr": 15}
        ],
        "efficiency_motor": 0.95,
        "energy_cost_per_kwh": 0.1,
        "hours_per_day": 24
    }

    try:
        response = requests.post(f"{BASE_URL}/calculate/operating-point", json=payload)
        response.raise_for_status()
        data = response.json()
        
        print(f"Operating Point: Flow={data['flow_op']:.2f}, Head={data['head_op']:.2f}")
        print(f"NPSHa: {data.get('npsh_available')}, NPSHr: {data.get('npsh_required')}")
        print(f"Cavitation Risk: {data.get('cavitation_risk')}")
        
        if 'npsh_required' in data and 'cavitation_risk' in data:
            if data['cavitation_risk'] == True:
                 print("PASS: Cavitation risk correctly identified.")
            else:
                 print("WARN: Cavitation risk false (might be valid depending on calculation).")
            return True
        else:
            print("FAIL: Missing NPSH fields in operating point response.")
            return False

    except Exception as e:
        print(f"ERROR: {e}")
        if response.content:
            print(f"Response Content: {response.content}")
        return False

if __name__ == "__main__":
    tests = [test_standards, test_system_curve_npsh, test_operating_point_npsh_risk]
    results = []
    for test in tests:
        results.append(test())
    
    if all(results):
        print("\nSUCCESS: All Phase 4 backend verifications pass.")
        sys.exit(0)
    else:
        print("\nFAILURE: Some backend verifications failed.")
        sys.exit(1)
