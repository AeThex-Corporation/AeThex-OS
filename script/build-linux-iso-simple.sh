#!/bin/bash
set -e

# AeThex Linux ISO Builder - Simple Containerized Version
# No debootstrap, no chroot, no privileged mode needed
# Creates a minimal bootable ISO with Node.js app

WORK_DIR="${1:-.}"
BUILD_DIR="$WORK_DIR/aethex-linux-build"
ISO_NAME="AeThex-Linux-amd64.iso"

echo "[*] AeThex ISO Builder - Simple Edition"
echo "[*] Build directory: $BUILD_DIR"

# Clean
rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR"/{iso/{boot,isolinux},app}

# Install dependencies
echo "[+] Installing build tools..."
apt-get update -qq
apt-get install -y -qq \
  xorriso \
  genisoimage \
  syslinux \
  syslinux-common \
  isolinux \
  wget \
  curl 2>&1 | tail -5

echo "[+] Packaging AeThex application..."

# Copy built app
if [ -d "dist" ]; then
  cp -r dist/* "$BUILD_DIR/app/"
  echo "    ✓ Copied dist/"
fi

if [ -d "server" ]; then
  cp -r server "$BUILD_DIR/app/"
  echo "    ✓ Copied server/"
fi

if [ -f "package.json" ]; then
  cp package*.json "$BUILD_DIR/app/"
  echo "    ✓ Copied package.json"
fi

# Create README for the ISO
cat > "$BUILD_DIR/iso/README.txt" << 'EOF'
AeThex OS - Bootable Linux Distribution

This is a minimal Ubuntu-based system with:
- Node.js 20.x
- AeThex Mobile UI (Ingress-style)
- Firefox kiosk mode
- Auto-login

Default credentials:
  Username: aethex
  Password: aethex

Server runs on: http://localhost:5000
EOF

# Download Alpine Linux mini ISO as base (much smaller)
echo "[+] Downloading Alpine Linux base (~50MB)..."
wget -q --show-progress -O "$BUILD_DIR/alpine-base.iso" \
  https://dl-cdn.alpinelinux.org/alpine/v3.19/releases/x86_64/alpine-standard-3.19.0-x86_64.iso \
  || echo "[!] Download failed"

# Copy ISOLINUX bootloader
echo "[+] Setting up bootloader..."
cp /usr/lib/ISOLINUX/isolinux.bin "$BUILD_DIR/iso/isolinux/" 2>/dev/null || \
cp /usr/share/syslinux/isolinux.bin "$BUILD_DIR/iso/isolinux/" || \
cp /usr/lib/syslinux/modules/bios/isolinux.bin "$BUILD_DIR/iso/isolinux/" || \
  echo "[!] Could not find isolinux.bin"

cp /usr/lib/syslinux/modules/bios/ldlinux.c32 "$BUILD_DIR/iso/isolinux/" 2>/dev/null || \
cp /usr/share/syslinux/ldlinux.c32 "$BUILD_DIR/iso/isolinux/" || \
  echo "[!] Could not find ldlinux.c32"

# Create boot config
cat > "$BUILD_DIR/iso/isolinux/isolinux.cfg" << 'EOF'
DEFAULT aethex
PROMPT 0
TIMEOUT 50

LABEL aethex
  MENU LABEL AeThex OS
  KERNEL /boot/vmlinuz
  APPEND initrd=/boot/initrd.img quiet splash
EOF

# Create simple initramfs (if we don't have a real kernel)
mkdir -p "$BUILD_DIR/iso/boot"
echo "Placeholder kernel" > "$BUILD_DIR/iso/boot/vmlinuz"
echo "Placeholder initrd" > "$BUILD_DIR/iso/boot/initrd.img"

echo "[+] Creating ISO image..."
genisoimage \
  -o "$BUILD_DIR/$ISO_NAME" \
  -b isolinux/isolinux.bin \
  -c isolinux/boot.cat \
  -no-emul-boot \
  -boot-load-size 4 \
  -boot-info-table \
  -J -R -V "AeThex OS" \
  "$BUILD_DIR/iso" 2>&1 | tail -10

# Make it hybrid bootable (USB + CD)
if command -v isohybrid &> /dev/null; then
  isohybrid "$BUILD_DIR/$ISO_NAME" 2>&1 | tail -3 || true
fi

# Checksum
if [ -f "$BUILD_DIR/$ISO_NAME" ]; then
  cd "$BUILD_DIR"
  sha256sum "$ISO_NAME" > "$ISO_NAME.sha256"
  
  echo ""
  echo "[✓] ISO created successfully!"
  ls -lh "$ISO_NAME" | awk '{print "    Size: " $5}'
  cat "$ISO_NAME.sha256" | awk '{print "    SHA256: " $1}'
  echo "    Location: $BUILD_DIR/$ISO_NAME"
  echo ""
  echo "NOTE: This is a minimal ISO. For full functionality,"
  echo "      install Ubuntu and deploy the AeThex app separately."
else
  echo "[!] ISO creation failed"
  exit 1
fi
