#!/usr/bin/env bash
set -euo pipefail

# AeThex OS USB flashing helper (Linux/macOS)
# Usage:
#   sudo ./script/flash-usb.sh -i path/to/AeThex-Linux-amd64.iso -d /dev/sdX
#   sudo ./script/flash-usb.sh -i path/to/AeThex-Linux-amd64.iso   # will list devices and prompt

ISO=""
DEVICE=""

usage() {
  echo "Usage: sudo $0 -i <iso_path> [-d <device>]" >&2
  echo "Example: sudo $0 -i ./artifacts/AeThex-Linux-amd64.iso -d /dev/sdX" >&2
}

while getopts ":i:d:h" opt; do
  case "$opt" in
    i) ISO="$OPTARG" ;;
    d) DEVICE="$OPTARG" ;;
    h) usage; exit 0 ;;
    *) usage; exit 1 ;;
  esac
done

if [[ $EUID -ne 0 ]]; then
  echo "This script must run as root (use sudo)." >&2
  exit 1
fi

if [[ -z "$ISO" ]]; then
  usage
  exit 1
fi

if [[ ! -f "$ISO" ]]; then
  echo "ISO not found: $ISO" >&2
  exit 1
fi

OS_NAME="$(uname -s)"

list_devices_linux() {
  lsblk -dpno NAME,SIZE,MODEL,TRAN | grep -E "/dev/" || true
}

list_devices_macos() {
  diskutil list | sed -n '/(external, physical)/,/^$/p' || diskutil list
}

echo "ISO: $ISO"
echo "Detecting removable drives..."

if [[ "$OS_NAME" == "Linux" ]]; then
  list_devices_linux
elif [[ "$OS_NAME" == "Darwin" ]]; then
  list_devices_macos
else
  echo "Unsupported OS: $OS_NAME" >&2
  exit 1
fi

if [[ -z "$DEVICE" ]]; then
  read -r -p "Enter target device (e.g., /dev/sdX or /dev/diskN): " DEVICE
fi

if [[ -z "$DEVICE" ]]; then
  echo "No device specified." >&2
  exit 1
fi

echo "\nWARNING: This will ERASE ALL DATA on $DEVICE"
read -r -p "Type ERASE to continue: " CONFIRM
if [[ "$CONFIRM" != "ERASE" ]]; then
  echo "Aborted." >&2
  exit 1
fi

echo "Unmounting any mounted partitions from $DEVICE..."
if [[ "$OS_NAME" == "Linux" ]]; then
  mapfile -t parts < <(lsblk -no NAME "$DEVICE" 2>/dev/null | tail -n +2)
  for p in "${parts[@]}"; do
    mountpoint="/dev/$p"
    umount "$mountpoint" 2>/dev/null || true
  done
elif [[ "$OS_NAME" == "Darwin" ]]; then
  diskutil unmountDisk force "$DEVICE" || true
fi

echo "Writing ISO to $DEVICE... this may take several minutes."
if [[ "$OS_NAME" == "Linux" ]]; then
  if command -v pv >/dev/null 2>&1; then
    pv "$ISO" | dd of="$DEVICE" bs=4M conv=fsync status=progress
  else
    dd if="$ISO" of="$DEVICE" bs=4M conv=fsync status=progress
  fi
  sync
elif [[ "$OS_NAME" == "Darwin" ]]; then
  # On macOS, use raw disk for performance (/dev/rdiskN)
  RAW_DEVICE="$DEVICE"
  if [[ "$DEVICE" == /dev/disk* ]]; then
    RAW_DEVICE="/dev/r$(basename "$DEVICE")"
  fi
  dd if="$ISO" of="$RAW_DEVICE" bs=4m
  sync
  diskutil eject "$DEVICE" || true
fi

echo "\nDone. Safely remove the USB, plug into target PC, and boot."
echo "If boot fails on UEFI, ensure Secure Boot is disabled or keys enrolled."
