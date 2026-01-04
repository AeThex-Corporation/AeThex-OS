# AeThex OS Mobile App Deployment Script
# Deploys the app directly to your Samsung phone

$adbPath = "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"
$apkPath = "c:\Users\PCOEM\AeThexOS\AeThex-OS\android\app\build\outputs\apk\debug\app-debug.apk"

Write-Host "🚀 AeThex OS Mobile Deployment" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Check if phone is connected
Write-Host "📱 Checking for connected devices..."
& $adbPath devices

Write-Host ""
Write-Host "📦 Building APK..."
cd "c:\Users\PCOEM\AeThexOS\AeThex-OS\android"

# Set Java home if needed
$jdkPath = Get-ChildItem "C:\Program Files\Android\Android Studio\jre" -ErrorAction SilentlyContinue | Select-Object -First 1
if ($jdkPath) {
    $env:JAVA_HOME = $jdkPath.FullName
    Write-Host "✓ Java found at: $env:JAVA_HOME"
}

# Build with gradlew
Write-Host "⏳ This may take 2-5 minutes..."
& ".\gradlew.bat" assembleDebug 2>&1 | Tee-Object -FilePath "build.log"

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✓ APK built successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📲 Installing on your phone..."
    & $adbPath install -r $apkPath
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✓ App installed successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "🎉 Launching AeThex OS..."
        & $adbPath shell am start -n "com.aethex.os/com.aethex.os.MainActivity"
        Write-Host ""
        Write-Host "✓ App launched on your phone!" -ForegroundColor Green
    } else {
        Write-Host "❌ Installation failed" -ForegroundColor Red
    }
} else {
    Write-Host ""
    Write-Host "❌ Build failed. Check build.log for details" -ForegroundColor Red
    Get-Content build.log -Tail 50
}
