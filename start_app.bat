@echo off
echo Starting Pumps Application...

:: Start Backend
start "Pumps Backend" cmd /k "call .venv\Scripts\activate && cd backend && uvicorn app.main:app --reload"

:: Start Frontend
start "Pumps Frontend" cmd /k "cd frontend && npm run dev"

echo ---------------------------------------------------
echo Servers are starting in separate windows.
echo backend: http://127.0.0.1:8000/docs
echo frontend: http://localhost:3000
echo ---------------------------------------------------
pause
