#!/bin/bash
# AeThex Linux - Create Bootable USB Drive
# Usage: sudo bash create-usb.sh /dev/sdX

set -e

if [[ $EUID -ne 0 ]]; then
   echo "This script must be run as root (sudo)" 
   exit 1
fi

if [ -z "$1" ]; then
    echo "Usage: sudo bash create-usb.sh /dev/sdX"
    echo ""
    echo "Available devices:"
    lsblk -d -o NAME,SIZE,TYPE,MOUNTPOINT | grep disk
    echo ""
    echo "Example: sudo bash create-usb.sh /dev/sdb"
    exit 1
fi

DEVICE=$1
BUILD_DIR="$HOME/aethex-linux-build"
ISO_FILE="${BUILD_DIR}/AeThex-Linux-1.0.0-alpha-amd64.iso"

# Check if ISO exists
if [ ! -f "$ISO_FILE" ]; then
    echo "ERROR: ISO not found at $ISO_FILE"
    echo "Build it first: sudo bash script/build-linux-iso.sh"
    exit 1
fi

# Confirm device
echo "WARNING: This will ERASE all data on ${DEVICE}"
echo "Device info:"
lsblk "${DEVICE}" || exit 1
echo ""
read -p "Are you sure you want to continue? (yes/no): " -r
if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    echo "Cancelled."
    exit 1
fi

# Unmount if mounted
echo "Unmounting ${DEVICE}..."
umount ${DEVICE}* 2>/dev/null || true

# Write ISO to USB
echo "Writing ISO to ${DEVICE}..."
echo "This may take 5-10 minutes..."
dd if="${ISO_FILE}" of="${DEVICE}" bs=4M status=progress oflag=sync

# Sync to ensure all data is written
sync

echo ""
echo "Success! USB drive is ready."
echo "You can now:"
echo "  1. Remove the USB drive safely"
echo "  2. Boot from it on any PC"
echo "  3. Default login: aethex / aethex"
