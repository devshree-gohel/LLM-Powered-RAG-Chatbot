@echo off
title RAG Backend Server (FastAPI)
echo ===================================================
echo Starting LLM-Powered RAG Chatbot Backend API...
echo ===================================================
cd /d "%~dp0"
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
pause
