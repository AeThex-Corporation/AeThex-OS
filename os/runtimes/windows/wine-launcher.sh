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
    # Launch QEMU/KVM Windows VM (TODO: implement)
    notify-send "VM launcher not implemented yet"
  fi
fi
