#!/bin/bash
# AeThex Desktop Launcher - starts X and opens the app in fullscreen browser

export DISPLAY=:0

# Start X server if not running
if ! pgrep -x "X" > /dev/null; then
    startx &
    sleep 3
fi

# Launch Chromium in kiosk mode pointing to local server
chromium-browser --kiosk --no-first-run --disable-infobars --disable-session-crashed-bubble \
  --disable-restore-session-state http://localhost:5000 &
