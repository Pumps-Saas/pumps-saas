import os
import zipfile
import hashlib

def create_zip_and_hash():
    base_dir = r"c:\Users\pedro\OneDrive\Documentos\Antigravity\Pumps"
    zip_filename = os.path.join(base_dir, "Pumps_SaaS_SourceCode_INPI.zip")
    
    # Directories to include
    include_dirs = ['backend', 'frontend']
    
    # Directories/files to exclude
    exclude_dirs = {'.venv', 'node_modules', '__pycache__', '.pytest_cache', '.git', 'dist', 'build', '.next'}
    exclude_files = {'.DS_Store', 'pumps.db', 'pumps_backup_phase10.db', '.env'}

    print("Zipping files...")
    with zipfile.ZipFile(zip_filename, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for inc_dir in include_dirs:
            dir_path = os.path.join(base_dir, inc_dir)
            for root, dirs, files in os.walk(dir_path):
                # Modify dirs in-place to exclude unwanted directories
                dirs[:] = [d for d in dirs if d not in exclude_dirs]
                
                for file in files:
                    if file in exclude_files:
                        continue
                    if file.endswith('.pyc') or file.endswith('.pyo'):
                        continue
                        
                    file_path = os.path.join(root, file)
                    arcname = os.path.relpath(file_path, base_dir)
                    zipf.write(file_path, arcname)

    print(f"Zip file successfully created: {zip_filename}")
    
    # Calculate SHA-256
    print("Calculating SHA-256 Hash...")
    sha256_hash = hashlib.sha256()
    with open(zip_filename, "rb") as f:
        for byte_block in iter(lambda: f.read(4096), b""):
            sha256_hash.update(byte_block)
            
    hash_hex = sha256_hash.hexdigest()
    
    print("\n" + "="*50)
    print("INPI REGISTRATION DATA")
    print("="*50)
    print(f"File Name: Pumps_SaaS_SourceCode_INPI.zip")
    print(f"Hash Algorithm: SHA-256")
    print(f"Hash Value: {hash_hex}")
    print("="*50)

if __name__ == '__main__':
    create_zip_and_hash()
