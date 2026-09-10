# Frontend PowerShell Launch Script
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host " Starting LLM-Powered RAG Chatbot React UI...      " -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan
Set-Location -Path $PSScriptRoot
npm run dev
