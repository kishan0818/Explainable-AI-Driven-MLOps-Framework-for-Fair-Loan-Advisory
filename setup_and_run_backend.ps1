Write-Host "=== TWXAI Backend Setup & Run ===" -ForegroundColor Cyan

# 1. Check/Enter Directory
if (Test-Path "TWXAI_backend") {
    cd TWXAI_backend
} else {
    Write-Host "Error: TWXAI_backend directory not found!" -ForegroundColor Red
    exit 1
}

# 2. Setup Venv
if (!(Test-Path "venv")) {
    Write-Host "Creating Python Virtual Environment..." -ForegroundColor Yellow
    python -m venv venv
} else {
    Write-Host "Virtual environment found." -ForegroundColor Green
}

# 3. Activate Venv
Write-Host "Activating Virtual Environment..."
try {
    & ".\venv\Scripts\Activate.ps1"
} catch {
    Write-Host "Failed to activate venv. Ensuring execution policy..." -ForegroundColor Yellow
    Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process -Force
    & ".\venv\Scripts\Activate.ps1"
}

# 4. Install Dependencies
Write-Host "Installing/Updating Dependencies..." -ForegroundColor Yellow
pip install -r requirements.txt

# 5. Start Backend
Write-Host "Starting FastAPI Backend..." -ForegroundColor Green
Write-Host "Server will be available at http://localhost:8000"
python fastapi_backend.py
