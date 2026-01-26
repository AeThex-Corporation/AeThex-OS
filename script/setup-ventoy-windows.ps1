# AeThex-OS Ventoy Setup for Windows
# Automates Ventoy installation and ISO deployment

param(
    [Parameter(Mandatory=$false)]
    [string]$UsbDrive = "",
    
    [Parameter(Mandatory=$false)]
    [switch]$DownloadVentoy = $false
)

$ErrorActionPreference = "Stop"

Write-Host "╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║           AeThex-OS Ventoy Setup (Windows)                   ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")
if (-not $isAdmin) {
    Write-Host "❌ This script requires Administrator privileges!" -ForegroundColor Red
    Write-Host "   Right-click and select 'Run as Administrator'" -ForegroundColor Yellow
    pause
    exit 1
}

# Paths
$BUILD_DIR = "$PSScriptRoot\..\aethex-linux-build"
$ISO_DIR = "$BUILD_DIR\ventoy-isos"
$VENTOY_PKG = "$BUILD_DIR\AeThex-Ventoy-Package"
$VENTOY_DIR = "$BUILD_DIR\ventoy"
$VENTOY_VERSION = "1.0.96"
$VENTOY_URL = "https://github.com/ventoy/Ventoy/releases/download/v$VENTOY_VERSION/ventoy-$VENTOY_VERSION-windows.zip"

# Function: Download Ventoy
function Download-Ventoy {
    Write-Host "📥 Downloading Ventoy $VENTOY_VERSION..." -ForegroundColor Yellow
    
    $ventoyZip = "$BUILD_DIR\ventoy.zip"
    
    try {
        Invoke-WebRequest -Uri $VENTOY_URL -OutFile $ventoyZip -UseBasicParsing
        Write-Host "   Downloaded to $ventoyZip" -ForegroundColor Green
        
        # Extract
        Write-Host "📦 Extracting Ventoy..." -ForegroundColor Yellow
        Expand-Archive -Path $ventoyZip -DestinationPath $BUILD_DIR -Force
        
        # Find extracted folder
        $extractedFolder = Get-ChildItem -Path $BUILD_DIR -Directory | Where-Object { $_.Name -like "ventoy-*-windows" } | Select-Object -First 1
        
        if ($extractedFolder) {
            Rename-Item -Path $extractedFolder.FullName -NewName "ventoy" -Force
            Write-Host "   ✅ Ventoy extracted to $VENTOY_DIR" -ForegroundColor Green
        }
        
        # Cleanup
        Remove-Item $ventoyZip -Force
        
    } catch {
        Write-Host "❌ Failed to download Ventoy: $_" -ForegroundColor Red
        Write-Host "   Please download manually from https://www.ventoy.net" -ForegroundColor Yellow
        exit 1
    }
}

# Check if Ventoy exists
if (-not (Test-Path "$VENTOY_DIR\Ventoy2Disk.exe")) {
    if ($DownloadVentoy) {
        Download-Ventoy
    } else {
        Write-Host "❌ Ventoy not found at $VENTOY_DIR" -ForegroundColor Red
        Write-Host ""
        $download = Read-Host "Download Ventoy now? (y/n)"
        if ($download -eq "y") {
            Download-Ventoy
        } else {
            Write-Host "Please download Ventoy from https://www.ventoy.net" -ForegroundColor Yellow
            exit 1
        }
    }
}

# Check if ISOs exist
if (-not (Test-Path "$VENTOY_PKG\*.iso")) {
    Write-Host "❌ No ISOs found in $VENTOY_PKG" -ForegroundColor Red
    Write-Host "   Run build-all-isos.sh first to create ISOs" -ForegroundColor Yellow
    exit 1
}

# List available USB drives
Write-Host ""
Write-Host "📀 Available USB Drives:" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan

$usbDrives = Get-Disk | Where-Object { $_.BusType -eq "USB" }

if ($usbDrives.Count -eq 0) {
    Write-Host "❌ No USB drives detected!" -ForegroundColor Red
    Write-Host "   Please insert a USB drive (8GB+ recommended)" -ForegroundColor Yellow
    pause
    exit 1
}

$driveList = @()
$index = 1

foreach ($disk in $usbDrives) {
    $size = [math]::Round($disk.Size / 1GB, 2)
    $driveList += $disk
    
    Write-Host "[$index] Disk $($disk.Number) - $($disk.FriendlyName)" -ForegroundColor Yellow
    Write-Host "    Size: $size GB" -ForegroundColor Gray
    Write-Host "    Path: \\.\PhysicalDrive$($disk.Number)" -ForegroundColor Gray
    Write-Host ""
    $index++
}

# Select USB drive
if ([string]::IsNullOrEmpty($UsbDrive)) {
    $selection = Read-Host "Select USB drive [1-$($driveList.Count)]"
    
    try {
        $selectedIndex = [int]$selection - 1
        if ($selectedIndex -lt 0 -or $selectedIndex -ge $driveList.Count) {
            throw "Invalid selection"
        }
        $selectedDisk = $driveList[$selectedIndex]
    } catch {
        Write-Host "❌ Invalid selection!" -ForegroundColor Red
        exit 1
    }
} else {
    $selectedDisk = $driveList | Where-Object { $_.Number -eq $UsbDrive } | Select-Object -First 1
    if (-not $selectedDisk) {
        Write-Host "❌ Drive $UsbDrive not found!" -ForegroundColor Red
        exit 1
    }
}

$diskNumber = $selectedDisk.Number
$diskSize = [math]::Round($selectedDisk.Size / 1GB, 2)

Write-Host ""
Write-Host "⚠️  WARNING ⚠️" -ForegroundColor Red -BackgroundColor Yellow
Write-Host "═══════════════════════════════════════" -ForegroundColor Red
Write-Host "You selected: Disk $diskNumber - $($selectedDisk.FriendlyName) ($diskSize GB)" -ForegroundColor Yellow
Write-Host "ALL DATA on this drive will be ERASED!" -ForegroundColor Red
Write-Host ""
$confirm = Read-Host "Type 'YES' to continue, or anything else to cancel"

if ($confirm -ne "YES") {
    Write-Host "❌ Cancelled." -ForegroundColor Yellow
    exit 0
}

# Install Ventoy
Write-Host ""
Write-Host "🚀 Installing Ventoy to Disk $diskNumber..." -ForegroundColor Cyan

try {
    # Run Ventoy installer
    $ventoyExe = "$VENTOY_DIR\Ventoy2Disk.exe"
    $arguments = "/i /d:$diskNumber /s"
    
    Write-Host "   Running: $ventoyExe $arguments" -ForegroundColor Gray
    
    $process = Start-Process -FilePath $ventoyExe -ArgumentList $arguments -Wait -PassThru -NoNewWindow
    
    if ($process.ExitCode -ne 0) {
        throw "Ventoy installation failed with exit code $($process.ExitCode)"
    }
    
    Write-Host "   ✅ Ventoy installed successfully!" -ForegroundColor Green
    
} catch {
    Write-Host "❌ Ventoy installation failed: $_" -ForegroundColor Red
    Write-Host "   You may need to run Ventoy2Disk.exe manually" -ForegroundColor Yellow
    exit 1
}

# Wait for drive to be ready
Write-Host ""
Write-Host "⏳ Waiting for USB drive to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Find mounted Ventoy partition
$ventoyPartition = Get-Partition -DiskNumber $diskNumber | Where-Object { $_.Size -gt 100MB } | Select-Object -First 1
$driveLetter = $ventoyPartition.DriveLetter

if (-not $driveLetter) {
    # Try to assign drive letter
    $driveLetter = (68..90 | ForEach-Object { [char]$_ } | Where-Object { -not (Test-Path "${_}:\") } | Select-Object -First 1)
    Set-Partition -DiskNumber $diskNumber -PartitionNumber $ventoyPartition.PartitionNumber -NewDriveLetter $driveLetter
}

$usbPath = "${driveLetter}:\"

Write-Host "   USB mounted at $usbPath" -ForegroundColor Green

# Copy ISOs and config files
Write-Host ""
Write-Host "📋 Copying ISO files to USB..." -ForegroundColor Cyan

$isoFiles = Get-ChildItem -Path "$VENTOY_PKG\*.iso"
$totalSize = ($isoFiles | Measure-Object -Property Length -Sum).Sum
$totalSizeGB = [math]::Round($totalSize / 1GB, 2)

Write-Host "   Total size: $totalSizeGB GB" -ForegroundColor Gray
Write-Host "   Files to copy: $($isoFiles.Count)" -ForegroundColor Gray
Write-Host ""

foreach ($iso in $isoFiles) {
    $fileName = $iso.Name
    $fileSizeMB = [math]::Round($iso.Length / 1MB, 2)
    
    Write-Host "   Copying $fileName ($fileSizeMB MB)..." -ForegroundColor Yellow
    Copy-Item -Path $iso.FullName -Destination $usbPath -Force
    Write-Host "      ✅ Done" -ForegroundColor Green
}

# Copy configuration files
Write-Host ""
Write-Host "📝 Copying configuration files..." -ForegroundColor Cyan

$configFiles = @(
    "ventoy.json",
    "README.txt"
)

foreach ($file in $configFiles) {
    $sourcePath = "$VENTOY_PKG\$file"
    if (Test-Path $sourcePath) {
        Copy-Item -Path $sourcePath -Destination $usbPath -Force
        Write-Host "   ✅ $file" -ForegroundColor Green
    }
}

# Copy checksums
Copy-Item -Path "$VENTOY_PKG\*.sha256" -Destination $usbPath -Force -ErrorAction SilentlyContinue

# Create Windows launcher on USB
$launcherScript = @"
@echo off
title AeThex-OS Boot Menu
echo ╔══════════════════════════════════════════════════════════════╗
echo ║           AeThex-OS Multi-Boot USB                           ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.
echo This USB contains 5 AeThex-OS editions:
echo.
echo 📦 AeThex-Core.iso    - Base operating system
echo 🎮 AeThex-Gaming.iso  - Gaming edition (Steam, Discord)
echo 💻 AeThex-Dev.iso     - Developer edition (VS Code, Docker)
echo 🎨 AeThex-Creator.iso - Creator edition (OBS, video editing)
echo 🖥️  AeThex-Server.iso  - Server edition (headless)
echo.
echo To boot:
echo 1. Restart your computer
echo 2. Enter BIOS/UEFI (usually F2, F12, DEL, or ESC)
echo 3. Select this USB drive from boot menu
echo 4. Choose your AeThex-OS edition
echo.
echo Default credentials:
echo   Username: aethex
echo   Password: aethex
echo.
pause
"@

Set-Content -Path "$usbPath\START-HERE.bat" -Value $launcherScript

# Eject USB safely (optional)
Write-Host ""
$eject = Read-Host "Safely eject USB drive? (y/n)"
if ($eject -eq "y") {
    Write-Host "⏏️  Ejecting USB drive..." -ForegroundColor Yellow
    $driveEject = New-Object -comObject Shell.Application
    $driveEject.Namespace(17).ParseName($usbPath).InvokeVerb("Eject")
    Start-Sleep -Seconds 2
}

# Success summary
Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║                  ✅ SETUP COMPLETE!                          ║" -ForegroundColor Green
Write-Host "╚══════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "📀 USB Drive Location: $usbPath" -ForegroundColor Cyan
Write-Host "📦 ISOs Installed: $($isoFiles.Count)" -ForegroundColor Cyan
Write-Host "💾 Total Size: $totalSizeGB GB" -ForegroundColor Cyan
Write-Host ""
Write-Host "🚀 Next Steps:" -ForegroundColor Yellow
Write-Host "1. Boot your computer from this USB drive" -ForegroundColor White
Write-Host "2. Select your AeThex-OS edition from Ventoy menu" -ForegroundColor White
Write-Host "3. Login with username: aethex, password: aethex" -ForegroundColor White
Write-Host "4. Connect to the AeThex ecosystem at https://aethex.app" -ForegroundColor White
Write-Host ""
Write-Host "📚 Documentation: https://docs.aethex.app" -ForegroundColor Gray
Write-Host "💬 Discord: https://discord.gg/aethex" -ForegroundColor Gray
Write-Host ""

pause
