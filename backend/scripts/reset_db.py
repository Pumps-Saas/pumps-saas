import os
import time

def reset_db():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    db_path = os.path.join(base_dir, "pumps.db")
    script_db_path = os.path.join(base_dir, "scripts", "pumps.db")

    print(f"Target DB: {db_path}")
    
    if os.path.exists(db_path):
        try:
            os.remove(db_path)
            print("Deleted backend/pumps.db")
        except Exception as e:
            print(f"Failed to delete backend/pumps.db: {e}")
    else:
        print("backend/pumps.db does not exist.")

    if os.path.exists(script_db_path):
        try:
            os.remove(script_db_path)
            print("Deleted scripts/pumps.db")
        except Exception as e:
            print(f"Failed to delete scripts/pumps.db: {e}")
    
    # Execute seed
    print("Running seed...")
    os.system("python scripts/seed_admin.py")

if __name__ == "__main__":
    reset_db()
