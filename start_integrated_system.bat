@echo off
echo Starting TWXAI Integrated Loan Prediction System
echo ================================================

echo.
echo [1/3] Starting Python Backend (FastAPI)...
cd TWXAI_backend
start "Python Backend" cmd /k "venv\Scripts\python -m uvicorn fastapi_backend:app --reload"
cd ..

echo.
echo [2/3] Waiting for backend to start...
timeout /t 5 /nobreak > nul

echo.
echo [3/3] Starting Next.js Frontend...
start "Next.js Frontend" cmd /k "npm run dev"

echo.
echo ================================================
echo System started successfully!
echo.
echo Frontend: http://localhost:3000
echo Backend API: http://localhost:8000
echo Backend Docs: http://localhost:8000/docs
echo.
echo Press any key to close this window...
pause > nul
