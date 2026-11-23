Write-Host "========================================================" -ForegroundColor Cyan
Write-Host " RackVision AI — Full-Stack Launch" -ForegroundColor Green
Write-Host " Backend API Docs: http://127.0.0.1:8000/docs" -ForegroundColor Yellow
Write-Host " Frontend Web App: http://localhost:5173" -ForegroundColor Yellow
Write-Host "========================================================" -ForegroundColor Cyan

# Start Backend in a new window
Start-Process powershell -ArgumentList "-NoExit", "-ExecutionPolicy", "Bypass", "-File", "$PSScriptRoot\run_backend.ps1"

# Start Frontend in a new window
Start-Process powershell -ArgumentList "-NoExit", "-ExecutionPolicy", "Bypass", "-File", "$PSScriptRoot\run_frontend.ps1"
