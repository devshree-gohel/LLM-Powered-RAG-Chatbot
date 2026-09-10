# Backend PowerShell Launch Script
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host " Starting LLM-Powered RAG Chatbot Backend API...   " -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan
Set-Location -Path $PSScriptRoot
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
