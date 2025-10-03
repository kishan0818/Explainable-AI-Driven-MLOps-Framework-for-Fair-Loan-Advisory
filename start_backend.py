"""
Simple backend startup script
"""

import subprocess
import sys
import os
import time

def start_backend():
    """Start the FastAPI backend"""
    print("Starting TWXAI Backend...")
    
    # Change to backend directory
    backend_dir = "TWXAI_backend"
    if not os.path.exists(backend_dir):
        print(f"Error: {backend_dir} directory not found")
        return False
    
    os.chdir(backend_dir)
    
    # Activate virtual environment and start backend
    if os.name == 'nt':  # Windows
        activate_script = os.path.join("venv", "Scripts", "activate.bat")
        python_exe = os.path.join("venv", "Scripts", "python.exe")
    else:  # Unix/Linux/Mac
        activate_script = os.path.join("venv", "bin", "activate")
        python_exe = os.path.join("venv", "bin", "python")
    
    if not os.path.exists(python_exe):
        print(f"Error: Python executable not found at {python_exe}")
        return False
    
    try:
        # Start the backend
        print("Starting FastAPI backend on http://localhost:8000")
        subprocess.run([python_exe, "fastapi_backend.py"], check=True)
    except subprocess.CalledProcessError as e:
        print(f"Error starting backend: {e}")
        return False
    except KeyboardInterrupt:
        print("\nBackend stopped by user")
        return True
    
    return True

if __name__ == "__main__":
    start_backend()
