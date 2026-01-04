#!/bin/bash
# Wine Launcher - executes Windows .exe files

EXE_FILE="$1"

# Check if Wine is installed
if ! command -v wine &> /dev/null; then
  zenity --error --text="Wine not installed. Install Windows runtime?"
  exit 1
fi

# Set Wine prefix
export WINEPREFIX="$HOME/.wine-aethex"

# Try to run with Wine
wine "$EXE_FILE" 2>&1 | tee /tmp/wine-debug.log

# If Wine fails, offer VM fallback
if [ $? -ne 0 ]; then
  zenity --question --text="Wine failed. Use Windows VM instead?"
  if [ $? -eq 0 ]; then
    # TODO: [UNFINISHED FLOW] Implement QEMU/KVM Windows VM launcher
    # Required steps:
    #   1. Check for QEMU/KVM installation
    #   2. Download or locate Windows VM image
    #   3. Configure hardware passthrough (GPU, USB)
    #   4. Launch VM with proper networking
    #   5. Pass the .exe file to the VM for execution
    # See: FLOWS.md section "Windows Runtime (Wine Launcher)"
    notify-send "VM launcher not implemented yet"
  fi
fi
