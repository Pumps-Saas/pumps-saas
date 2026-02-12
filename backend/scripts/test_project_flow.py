import requests
import sys

BASE_URL = "http://localhost:8000/api/v1"

def test_flow():
    # 1. Login
    print("--- 1. Logging in ---")
    login_data = {
        "username": "admin@pumps.com",
        "password": "admin123"
    }
    # Using data= for form-urlencoded
    try:
        resp = requests.post(f"{BASE_URL}/auth/login", data=login_data)
        if resp.status_code != 200:
            print(f"Login Failed: {resp.status_code} - {resp.text}")
            return
        
        token = resp.json()["access_token"]
        print(f"Login Success. Token: {token[:10]}...")
    except Exception as e:
        print(f"Login Exception: {e}")
        return

    # 2. Create Project
    print("\n--- 2. Creating Project ---")
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    project_data = {
        "name": "API Test Project",
        "description": "Created via python script"
    }
    
    try:
        resp = requests.post(f"{BASE_URL}/projects/", json=project_data, headers=headers)
        if resp.status_code != 200:
             print(f"Create Project Failed: {resp.status_code} - {resp.text}")
        else:
             print(f"Create Project Success: {resp.json()}")
             project_id = resp.json()["id"]
             
             # 3. List Projects
             print("\n--- 3. Listing Projects ---")
             resp = requests.get(f"{BASE_URL}/projects/", headers=headers)
             print(f"Projects: {resp.json()}")

             # Cleanup
             print(f"\n--- 4. Deleting Project {project_id} ---")
             requests.delete(f"{BASE_URL}/projects/{project_id}", headers=headers)

    except Exception as e:
        print(f"Project Exception: {e}")

if __name__ == "__main__":
    test_flow()
