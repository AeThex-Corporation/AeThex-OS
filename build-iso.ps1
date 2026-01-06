#!/usr/bin/env pwsh
# AeThex OS - ISO Build Wrapper for Windows/WSL
# Automatically handles line ending conversion

param(
    [string]$BuildDir = "/home/mrpiglr/aethex-build",
    [switch]$Clean,
    [switch]$Background
)

Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  AeThex OS - ISO Builder (Windows to WSL)" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Convert line endings and copy to temp location
Write-Host "[*] Converting line endings (CRLF to LF)..." -ForegroundColor Yellow
$scriptPath = "script/build-linux-iso-full.sh"
$timestamp = Get-Date -Format 'yyyyMMddHHmmss'
$tempScript = "/tmp/aethex-build-$timestamp.sh"

if (!(Test-Path $scriptPath)) {
    Write-Host "Error: $scriptPath not found" -ForegroundColor Red
    exit 1
}

# Read, convert, and pipe to WSL
$content = Get-Content $scriptPath -Raw
$unixContent = $content -replace "`r`n", "`n"
$unixContent | wsl bash -c "cat > $tempScript && chmod +x $tempScript"

Write-Host "[OK] Script prepared: $tempScript" -ForegroundColor Green
Write-Host ""

# Clean previous build if requested
if ($Clean) {
    Write-Host "[*] Cleaning previous build..." -ForegroundColor Yellow
    wsl bash -c "sudo rm -rf $BuildDir/aethex-linux-build; mkdir -p $BuildDir"
    Write-Host "[OK] Cleaned" -ForegroundColor Green
    Write-Host ""
}

# Run the build
$logFile = "$BuildDir/build-$timestamp.log"

if ($Background) {
    Write-Host "[*] Starting build in background..." -ForegroundColor Yellow
    Write-Host "    Log: $logFile" -ForegroundColor Gray
    Write-Host ""
    
    wsl bash -c "nohup sudo bash $tempScript $BuildDir > $logFile 2>&1 &"
    Start-Sleep -Seconds 3
    
    Write-Host "[*] Monitoring initial output:" -ForegroundColor Yellow
    wsl bash -c "tail -30 $logFile 2>/dev/null || echo 'Waiting for log...'"
    Write-Host ""
    Write-Host "[i] Build running in background. Monitor with:" -ForegroundColor Cyan
    Write-Host "    wsl bash -c `"tail -f $logFile`"" -ForegroundColor Gray
    Write-Host "    or" -ForegroundColor Gray
    Write-Host "    wsl bash -c `"ps aux | grep build-linux-iso`"" -ForegroundColor Gray
} else {
    Write-Host "[*] Starting build (30-60 min)..." -ForegroundColor Yellow
    Write-Host "    Log: $logFile" -ForegroundColor Gray
    Write-Host ""
    
    wsl bash -c "sudo bash $tempScript $BuildDir 2>&1 | tee $logFile"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "[OK] Build completed!" -ForegroundColor Green
        Write-Host ""
        Write-Host "[*] Checking for ISO..." -ForegroundColor Yellow
        wsl bash -c "find $BuildDir -name '*.iso' -exec ls -lh {} \;"
    } else {
        Write-Host ""
        Write-Host "Build failed. Check log:" -ForegroundColor Red
        Write-Host "    wsl bash -c `"tail -100 $logFile`"" -ForegroundColor Gray
        exit 1
    }
}
