Write-Host "========================================================" -ForegroundColor Cyan
Write-Host " RackVision AI — Starting React Vite Frontend" -ForegroundColor Green
Write-Host " Web Application: http://localhost:5173" -ForegroundColor Yellow
Write-Host "========================================================" -ForegroundColor Cyan
Set-Location -Path "$PSScriptRoot\frontend"
npm run dev
