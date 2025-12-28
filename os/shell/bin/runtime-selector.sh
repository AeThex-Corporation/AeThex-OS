#!/bin/bash
# AeThex Runtime Selector - determines which runtime to use for a file

FILE="$1"
EXT="${FILE##*.}"

case "$EXT" in
  exe|msi|bat)
    # Windows executable
    /opt/aethex/runtimes/windows/wine-launcher.sh "$FILE"
    ;;
  py|js|rs|go)
    # Dev file - run in container
    /opt/aethex/runtimes/linux-dev/dev-launcher.sh "$FILE"
    ;;
  *)
    # Native Linux
    xdg-open "$FILE"
    ;;
esac
