Write-Host "========================================================" -ForegroundColor Cyan
Write-Host " RackVision AI — Starting FastAPI Backend Server" -ForegroundColor Green
Write-Host " API Documentation: http://127.0.0.1:8000/docs" -ForegroundColor Yellow
Write-Host "========================================================" -ForegroundColor Cyan
Set-Location -Path "$PSScriptRoot\backend"
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
