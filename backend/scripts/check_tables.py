import os
from sqlalchemy import create_engine, inspect

def check_tables():
    db_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "pumps.db")
    print(f"Checking DB at: {db_path}")
    
    sqlite_url = f"sqlite:///{db_path}"
    engine = create_engine(sqlite_url)
    
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    print("Tables found:", tables)
    
    if "project" in tables:
        print("SUCCESS: 'project' table exists.")
        columns = [c['name'] for c in inspector.get_columns("project")]
        print("Columns:", columns)
    else:
        print("FAILURE: 'project' table MISSING.")

if __name__ == "__main__":
    check_tables()
