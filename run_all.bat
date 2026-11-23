@echo off
echo ========================================================
echo  RackVision AI — Full-Stack Launch
echo  Backend:  http://127.0.0.1:8000/docs
echo  Frontend: http://localhost:5173
echo ========================================================
start "RackVision Backend" cmd /k "cd backend && python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"
start "RackVision Frontend" cmd /k "cd frontend && npm run dev"
