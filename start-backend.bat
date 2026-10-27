@echo off
set PYTHONPATH=backend;seed
echo ========================================================
echo  AICTE SATYAPAN - FastAPI Backend Server
echo  API Documentation: http://localhost:8000/docs
echo  Advisory: AI outputs require mandatory human official sign-off
echo ========================================================
.\venv\Scripts\uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
