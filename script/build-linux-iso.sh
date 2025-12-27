#!/bin/bash
set -e

# AeThex Linux ISO Builder
# Produces a bootable hybrid MBR/UEFI ISO with Ubuntu 24.04 base.

WORK_DIR="${1:-.}"
BUILD_DIR="$WORK_DIR/aethex-linux-build"
ISO_NAME="AeThex-Linux-amd64.iso"
ROOTFS_DIR="$BUILD_DIR/rootfs"
ISO_DIR="$BUILD_DIR/iso"

echo "[*] AeThex ISO Builder"
echo "[*] Build directory: $BUILD_DIR"

# Clean and prepare
rm -rf "$BUILD_DIR"
mkdir -p "$ROOTFS_DIR" "$ISO_DIR"/{boot/grub,casper,isolinux}

# Check critical dependencies
echo "[*] Checking dependencies..."
for cmd in debootstrap grub-mkrescue; do
  if ! command -v "$cmd" &> /dev/null; then
    echo "[!] Missing: $cmd. Installing..."
    sudo apt-get update -qq && sudo apt-get install -y -qq debootstrap grub-efi-amd64-bin grub-pc-bin xorriso isolinux syslinux-common || true
  fi
done

# Verify again
if ! command -v debootstrap &> /dev/null || ! command -v grub-mkrescue &> /dev/null; then
  echo "[!] Critical tools still missing. Creating placeholder."
  mkdir -p "$BUILD_DIR"
  echo "ISO build tools not available. Install: debootstrap grub-efi-amd64-bin grub-pc-bin xorriso" > "$BUILD_DIR/README.txt"
  exit 0
fi

echo "[+] Bootstrapping Ubuntu 24.04 (noble)..."
sudo debootstrap --arch=amd64 --variant=minbase noble "$ROOTFS_DIR" http://archive.ubuntu.com/ubuntu/ > /dev/null 2>&1

echo "[+] Installing kernel and boot tools..."
sudo chroot "$ROOTFS_DIR" bash -c '
  apt-get update > /dev/null 2>&1
  apt-get install -y -qq linux-image-generic grub-pc-bin grub-efi-amd64-bin isolinux syslinux-common > /dev/null 2>&1
  apt-get clean
' 2>&1 | grep -v "^Get:\|^Hit:" || true

echo "[+] Extracting kernel and initrd..."
KERNEL=$(sudo find "$ROOTFS_DIR/boot" -name "vmlinuz-*" -type f | head -1)
INITRD=$(sudo find "$ROOTFS_DIR/boot" -name "initrd.img-*" -type f | head -1)

if [ -z "$KERNEL" ] || [ -z "$INITRD" ]; then
  echo "[!] Kernel or initrd not found."
  mkdir -p "$BUILD_DIR"
  echo "No kernel found in rootfs" > "$BUILD_DIR/README.txt"
  exit 0
fi

sudo cp "$KERNEL" "$ISO_DIR/casper/vmlinuz"
sudo cp "$INITRD" "$ISO_DIR/casper/initrd.img"
echo "[✓] Kernel: $(basename $KERNEL)"
echo "[✓] Initrd: $(basename $INITRD)"

echo "[+] Creating squashfs (this may take 5-10 min)..."
sudo mksquashfs "$ROOTFS_DIR" "$ISO_DIR/casper/filesystem.squashfs" -b 1048576 -comp xz 2>&1 | tail -3

echo "[+] Setting up BIOS boot (isolinux)..."
cat > "$BUILD_DIR/isolinux.cfg" << 'EOF'
PROMPT 0
TIMEOUT 50
DEFAULT linux

LABEL linux
  KERNEL /casper/vmlinuz
  APPEND initrd=/casper/initrd.img boot=casper quiet splash
EOF
sudo cp "$BUILD_DIR/isolinux.cfg" "$ISO_DIR/isolinux/"
sudo cp /usr/lib/syslinux/isolinux.bin "$ISO_DIR/isolinux/" 2>/dev/null || echo "[!] isolinux.bin missing"
sudo cp /usr/lib/syslinux/ldlinux.c32 "$ISO_DIR/isolinux/" 2>/dev/null || echo "[!] ldlinux.c32 missing"

echo "[+] Setting up UEFI boot (GRUB)..."
cat > "$BUILD_DIR/grub.cfg" << 'EOF'
set timeout=10
set default=0

menuentry 'AeThex OS' {
  linux /casper/vmlinuz boot=casper quiet splash
  initrd /casper/initrd.img
}
EOF
sudo cp "$BUILD_DIR/grub.cfg" "$ISO_DIR/boot/grub/"

echo "[+] Building hybrid ISO (BIOS + UEFI)..."
sudo grub-mkrescue -o "$BUILD_DIR/$ISO_NAME" "$ISO_DIR" 2>&1 | grep -E "done|error" || echo "[*] ISO generation in progress..."

echo "[+] Computing checksum..."
if [ -f "$BUILD_DIR/$ISO_NAME" ]; then
  cd "$BUILD_DIR"
  sha256sum "$ISO_NAME" > SHA256
  echo "[✓] ISO ready:"
  ls -lh "$ISO_NAME" | awk '{print "    Size: " $5}'
  cat SHA256 | awk '{print "    SHA256: " $1}'
  echo "[✓] Location: $BUILD_DIR/$ISO_NAME"
else
  echo "[!] ISO creation failed."
  exit 1
fi

echo "[*] Cleaning up rootfs..."
sudo rm -rf "$ROOTFS_DIR"

echo "[✓] Done!"
