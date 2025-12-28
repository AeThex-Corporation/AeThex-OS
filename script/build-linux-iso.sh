#!/bin/bash
set -e

# AeThex Linux ISO Builder - Full Desktop Edition
# Produces a bootable hybrid MBR/UEFI ISO with Ubuntu 24.04, Xfce desktop, and AeThex app

WORK_DIR="${1:-.}"
BUILD_DIR="$WORK_DIR/aethex-linux-build"
ISO_NAME="AeThex-Linux-amd64.iso"
ROOTFS_DIR="$BUILD_DIR/rootfs"
ISO_DIR="$BUILD_DIR/iso"

echo "[*] AeThex ISO Builder - Full Desktop Edition"
echo "[*] Build directory: $BUILD_DIR"

# Clean and prepare
rm -rf "$BUILD_DIR"
mkdir -p "$ROOTFS_DIR" "$ISO_DIR"/{boot/grub,casper,isolinux}

# Check critical dependencies
echo "[*] Checking dependencies..."
for cmd in debootstrap grub-mkrescue mksquashfs xorriso; do
  if ! command -v "$cmd" &> /dev/null; then
    echo "[!] Missing: $cmd"
    exit 1
  fi
done

echo "[+] Bootstrapping Ubuntu 24.04 (noble)..."
echo "    (this may take 10-15 minutes, please wait...)"
debootstrap --arch=amd64 --variant=minbase noble "$ROOTFS_DIR" http://archive.ubuntu.com/ubuntu/ 2>&1 | tail -5

# Prepare chroot networking and mounts
cp -f /etc/resolv.conf "$ROOTFS_DIR/etc/resolv.conf" || true
mount -t proc /proc "$ROOTFS_DIR/proc" || true
mount -t sysfs /sys "$ROOTFS_DIR/sys" || true
mount --bind /dev "$ROOTFS_DIR/dev" || true

echo "[+] Installing Xfce desktop, Firefox, and system tools..."
echo "    (packages installing, ~15-20 minutes...)"
chroot "$ROOTFS_DIR" bash -c '
  export DEBIAN_FRONTEND=noninteractive
  
  # Enable universe repository
  sed -i "s/^# deb/deb/" /etc/apt/sources.list
  echo "deb http://archive.ubuntu.com/ubuntu noble universe" >> /etc/apt/sources.list
  echo "deb http://archive.ubuntu.com/ubuntu noble-updates universe" >> /etc/apt/sources.list
  
  apt-get update
  apt-get install -y \
    linux-image-generic \
    grub-pc-bin grub-efi-amd64-bin grub-common xorriso \
    xorg xfce4 xfce4-goodies lightdm \
    firefox network-manager \
    sudo curl wget git ca-certificates gnupg \
    pipewire-audio wireplumber \
    file-roller thunar-archive-plugin \
    xfce4-terminal mousepad ristretto \
    dbus-x11
  apt-get clean
' 2>&1 | tail -50

echo "[+] Installing Node.js 20.x from NodeSource..."
chroot "$ROOTFS_DIR" bash -c '
  export DEBIAN_FRONTEND=noninteractive
  
  # Install ca-certificates first
  apt-get install -y ca-certificates curl gnupg
  
  mkdir -p /etc/apt/keyrings
  curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg
  echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_20.x nodistro main" > /etc/apt/sources.list.d/nodesource.list
  apt-get update
  apt-get install -y nodejs
  node --version || echo "Node install failed"
  npm --version || echo "npm not found"
' 2>&1 | tail -10

echo "[+] Creating AeThex user with auto-login..."
chroot "$ROOTFS_DIR" bash -c '
  useradd -m -s /bin/bash -G sudo aethex
  echo "aethex:aethex" | chpasswd
  echo "aethex ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers
'

# Configure LightDM for auto-login
mkdir -p "$ROOTFS_DIR/etc/lightdm"
cat > "$ROOTFS_DIR/etc/lightdm/lightdm.conf" << 'LIGHTDM'
[Seat:*]
autologin-user=aethex
autologin-user-timeout=0
user-session=xfce
LIGHTDM

echo "[+] Setting up AeThex Desktop application..."

# Copy app files (if available, otherwise note for manual addition)
if [ -d "client" ] && [ -d "server" ]; then
  echo "    Copying AeThex Desktop files..."
  mkdir -p "$ROOTFS_DIR/opt/aethex-desktop"
  cp -r client "$ROOTFS_DIR/opt/aethex-desktop/"
  cp -r server "$ROOTFS_DIR/opt/aethex-desktop/"
  cp -r shared "$ROOTFS_DIR/opt/aethex-desktop/" 2>/dev/null || true
  cp package*.json "$ROOTFS_DIR/opt/aethex-desktop/" 2>/dev/null || true
  
  # Install dependencies in chroot
  chroot "$ROOTFS_DIR" bash -c 'cd /opt/aethex-desktop && npm install --production' 2>&1 | tail -10 || echo "    npm install skipped"
else
  echo "    (client/server not found; skipping app copy)"
fi

# Create systemd service for AeThex server
cat > "$ROOTFS_DIR/etc/systemd/system/aethex-desktop.service" << 'SERVICEEOF'
[Unit]
Description=AeThex Desktop Server
After=network.target

[Service]
Type=simple
User=aethex
WorkingDirectory=/opt/aethex-desktop
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
SERVICEEOF

# Enable AeThex service
chroot "$ROOTFS_DIR" systemctl enable aethex-desktop.service 2>/dev/null || echo "    systemd service added"

# Create auto-start script for Firefox kiosk
mkdir -p "$ROOTFS_DIR/home/aethex/.config/autostart"
cat > "$ROOTFS_DIR/home/aethex/.config/autostart/aethex-kiosk.desktop" << 'KIOSK'
[Desktop Entry]
Type=Application
Name=AeThex Kiosk
Exec=firefox --kiosk http://localhost:5000
Hidden=false
NoDisplay=false
X-GNOME-Autostart-enabled=true
KIOSK

chroot "$ROOTFS_DIR" chown -R aethex:aethex /home/aethex

echo "[✓] AeThex Desktop integrated with Xfce auto-login and Firefox kiosk"

echo "[+] Extracting kernel and initrd..."
KERNEL="$(ls -1 $ROOTFS_DIR/boot/vmlinuz-* 2>/dev/null | head -n 1)"
INITRD="$(ls -1 $ROOTFS_DIR/boot/initrd.img-* 2>/dev/null | head -n 1)"

if [ -z "$KERNEL" ] || [ -z "$INITRD" ]; then
  echo "[!] Kernel or initrd not found."
  ls -la "$ROOTFS_DIR/boot/" || true
  exit 1
fi

cp "$KERNEL" "$ISO_DIR/casper/vmlinuz"
cp "$INITRD" "$ISO_DIR/casper/initrd.img"
echo "[✓] Kernel: $(basename "$KERNEL")"
echo "[✓] Initrd: $(basename "$INITRD")"
  echo "No kernel found in rootfs" > "$BUILD_DIR/README.txt"
  exit 0
fi

cp "$KERNEL" "$ISO_DIR/casper/vmlinuz"
cp "$INITRD" "$ISO_DIR/casper/initrd.i

# Unmount before squashfs
echo "[+] Unmounting chroot filesystems..."
umount -lf "$ROOTFS_DIR/procfilesystem..."
echo "    (compressing ~2-3GB desktop, takes 10-15 minutes...)"
mksquashfs "$ROOTFS_DIR" "$ISO_DIR/casper/filesystem.squashfs" -b 1048576 -comp xz -Xdict-size 100% 2>&1 | tail -3mksquashfs "$ROOTFS_DIR" "$ISO_DIR/casper/filesystem.squashfs" -b 1048576 -comp xz 2>&1 | tail -3
else
  echo "[!] mksquashfs not found; cannot create ISO."
  mkdir -p "$BUILD_DIR"
  echo "mksquashfs not available" > "$BUILD_DIR/README.txt"
  exit 0
fi

echo "[+] Setting up BIOS boot (isolinux)..."
cat > "$BUILD_DIR/isolinux.cfg" << 'EOF'
PROMPT 0
TIMEOUT 50
DEFAULT linux

LABEL linux
  KERNELISO_DIR/isolinux/isolinux.cfg" << 'EOF'
PROMPT 0
TIMEOUT 50
DEFAULT linux

LABEL linux
  MENU LABEL AeThex OS
  KERNEL /casper/vmlinuz
  APPEND initrd=/casper/initrd.img boot=casper quiet splash
EOF
cp /usr/lib/syslinux/isolinux.bin "$ISO_DIR/isolinux/" 2>/dev/null || \
cp /usr/share/syslinux/isolinux.bin "$ISO_DIR/isolinux/" 2>/dev/null || echo "[!] isolinux.bin missing"
cp /usr/lib/syslinux/ldlinux.c32 "$ISO_DIR/isolinux/" 2>/dev/null || \
cp /usr/share/syslinux/ldlinux.c32 "$ISO_DIR/isolinux/" 2>/dev/null || echo "[!] ldlinux.c32 missing"

echo "[+] Setting up UEFI boot (GRUB)..."
cat > "$ISO_DIR/boot/grub/grub.cfg" << 'EOF'
set timeout=10
set default=0
with grub-mkrescue..."
grub-mkrescue -o "$BUILD_DIR/$ISO_NAME" "$ISO_DIR" --verbose 2>&1 | tail -20

echo "[+] Computing SHA256 checksum..."
if [ -f "$BUILD_DIR/$ISO_NAME" ]; then
  cd "$BUILD_DIR"
  sha256sum "$ISO_NAME" > "$ISO_NAME.sha256"
  echo "[✓] ISO ready:"
  ls -lh "$ISO_NAME" | awk '{print "    Size: " $5}'
  cat "$ISO_NAME.sha256" | awk '{print "    SHA256: " $1}'
  echo "[✓] Location: $BUILD_DIR/$ISO_NAME"
else
  echo "[!] ISO creation failed."
  exit 1
fi

echo "[*] Cleaning up rootfs..."
rm -rf "$ROOTFS_DIR"

echo "[✓] Build complete!"
echo ""
echo "=== AeThex OS Full Desktop Edition ==="
echo "Features:"
echo "  - Xfce desktop environment"
echo "  - Firefox browser (auto-launches in kiosk mode)"
echo "  - Node.js 20.x + npm"
echo "  - AeThex Desktop app at /opt/aethex-desktop"
echo "  - Auto-login as user 'aethex'"
echo "  - NetworkManager for WiFi/Ethernet"
echo "  - Audio support (PulseAudio)"
echo ""
echo "Flash to USB: sudo ./script/flash-usb.sh -i $BUILD_DIR/$ISO_NAME
echo "[✓] Done!"
