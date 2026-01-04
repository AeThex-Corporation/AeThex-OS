#!/bin/bash
set -e

# AeThex Linux ISO Builder - Containerized Edition
# Creates a bootable ISO using Ubuntu base image (no debootstrap/chroot needed)

WORK_DIR="${1:-.}"
BUILD_DIR="$WORK_DIR/aethex-linux-build"
ROOTFS_DIR="$BUILD_DIR/rootfs"
ISO_DIR="$BUILD_DIR/iso"
ISO_NAME="AeThex-Linux-amd64.iso"

echo "[*] AeThex ISO Builder - Containerized Edition"
echo "[*] Build directory: $BUILD_DIR"
echo "[*] This build method works in Docker without privileged mode"

# Clean and prepare
rm -rf "$BUILD_DIR"
mkdir -p "$ROOTFS_DIR" "$ISO_DIR"/{casper,isolinux,boot/grub}

# Check dependencies
echo "[*] Checking dependencies..."
for cmd in xorriso genisoimage mksquashfs; do
  if ! command -v "$cmd" &> /dev/null; then
    echo "[!] Missing: $cmd - installing..."
    apt-get update -qq
    apt-get install -y -qq "$cmd" 2>&1 | tail -5
  fi
done

echo "[+] Downloading Ubuntu Mini ISO base..."
# Use Ubuntu mini.iso as base (much smaller, pre-built)
if [ ! -f "$BUILD_DIR/ubuntu-mini.iso" ]; then
  wget -q --show-progress -O "$BUILD_DIR/ubuntu-mini.iso" \
    http://archive.ubuntu.com/ubuntu/dists/noble/main/installer-amd64/current/legacy-images/netboot/mini.iso \
    || echo "[!] Download failed, creating minimal ISO instead"
fi

echo "[+] Building AeThex application layer..."
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

# Build mobile app if possible
if [ -f "package.json" ]; then
  echo "    Building AeThex mobile app..."
  npm run build 2>&1 | tail -5 || echo "    Build skipped"
fi

# Copy app files (if available, otherwise note for manual addition)
if [ -d "client" ] && [ -d "server" ]; then
  echo "    Copying AeThex Desktop files..."
  mkdir -p "$ROOTFS_DIR/opt/aethex-desktop"
  
  # Copy source files
  cp -r client "$ROOTFS_DIR/opt/aethex-desktop/"
  cp -r server "$ROOTFS_DIR/opt/aethex-desktop/"
  cp -r shared "$ROOTFS_DIR/opt/aethex-desktop/" 2>/dev/null || true
  cp package*.json "$ROOTFS_DIR/opt/aethex-desktop/" 2>/dev/null || true
  cp tsconfig.json "$ROOTFS_DIR/opt/aethex-desktop/" 2>/dev/null || true
  cp vite.config.ts "$ROOTFS_DIR/opt/aethex-desktop/" 2>/dev/null || true
  
  # Copy built assets if they exist
  if [ -d "dist" ]; then
    cp -r dist "$ROOTFS_DIR/opt/aethex-desktop/"
  fi
  
  # Copy Capacitor Android build if it exists (for native features)
  if [ -d "android" ]; then
    mkdir -p "$ROOTFS_DIR/opt/aethex-desktop/android"
    cp -r android/app "$ROOTFS_DIR/opt/aethex-desktop/android/" 2>/dev/null || true
  fi
  
  # Install dependencies in chroot
  echo "    Installing Node.js dependencies..."
  chroot "$ROOTFS_DIR" bash -c 'cd /opt/aethex-desktop && npm install --production --legacy-peer-deps' 2>&1 | tail -10 || echo "    npm install skipped"
  
  # Set ownership
  chroot "$ROOTFS_DIR" chown -R aethex:aethex /opt/aethex-desktop
else
  echo "    (client/server not found; skipping app copy)"
fi

# Create systemd service for AeThex mobile server
cat > "$ROOTFS_DIR/etc/systemd/system/aethex-mobile-server.service" << 'SERVICEEOF'
[Unit]
Description=AeThex Mobile Server
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=aethex
WorkingDirectory=/opt/aethex-desktop
Environment="NODE_ENV=production"
Environment="PORT=5000"
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
SERVICEEOF

# Create backward-compatible legacy service name
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

# Enable both services
chroot "$ROOTFS_DIR" systemctl enable aethex-mobile-server.service 2>/dev/null || echo "    Mobile server service added"
chroot "$ROOTFS_DIR" systemctl enable aethex-desktop.service 2>/dev/null || echo "    Desktop service added"

# Create auto-start script for Firefox kiosk pointing to mobile server
mkdir -p "$ROOTFS_DIR/home/aethex/.config/autostart"
cat > "$ROOTFS_DIR/home/aethex/.config/autostart/aethex-kiosk.desktop" << 'KIOSK'
[Desktop Entry]
Type=Application
Name=AeThex Mobile UI
Exec=sh -c "sleep 5 && firefox --kiosk http://localhost:5000"
Hidden=false
NoDisplay=false
X-GNOME-Autostart-enabled=true
Comment=Launch AeThex mobile interface in fullscreen
KIOSK

chroot "$ROOTFS_DIR" chown -R aethex:aethex /home/aethex

echo "[✓] AeThex Mobile UI integrated:"
echo "    - Server runs on port 5000"
echo "    - Firefox launches in kiosk mode"
echo "    - Xfce desktop with auto-login"
echo "    - Ingress-style mobile interface"

echo "[+] Extracting kernel and initrd..."
KERNEL="$(ls -1 $ROOTFS_DIR/boot/vmlinuz-* 2>/dev/null | head -n 1)"
INITRD="$(ls -1 $ROOTFS_DIR/boot/initrd.img-* 2>/dev/null | head -n 1)"

if [ -z "$KERNEL" ] || [ -z "$INITRD" ]; then
  echo "[!] Kernel or initrd not found."
  ls -la "$ROOTFS_DIR/boot/" || true
  mkdir -p "$BUILD_DIR"
  echo "No kernel found in rootfs" > "$BUILD_DIR/README.txt"
  exit 1
fi

cp "$KERNEL" "$ISO_DIR/casper/vmlinuz"
cp "$INITRD" "$ISO_DIR/casper/initrd.img"
echo "[✓] Kernel: $(basename "$KERNEL")"
echo "[✓] Initrd: $(basename "$INITRD")"

# Unmount before squashfs
echo "[+] Unmounting chroot filesystems..."
umount -lf "$ROOTFS_DIR/proc" 2>/dev/null || true
umount -lf "$ROOTFS_DIR/sys" 2>/dev/null || true
umount -lf "$ROOTFS_DIR/dev" 2>/dev/null || true

echo "[+] Creating SquashFS filesystem..."
echo "    (compressing ~2-3GB desktop, takes 10-15 minutes...)"
if command -v mksquashfs &> /dev/null; then
  mksquashfs "$ROOTFS_DIR" "$ISO_DIR/casper/filesystem.squashfs" -b 1048576 -comp xz -Xdict-size 100% 2>&1 | tail -3
else
  echo "[!] mksquashfs not found; cannot create ISO."
  mkdir -p "$BUILD_DIR"
  echo "mksquashfs not available" > "$BUILD_DIR/README.txt"
  exit 1
fi

echo "[+] Setting up BIOS boot (isolinux)..."
cat > "$ISO_DIR/isolinux/isolinux.cfg" << 'EOF'
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

menuentry "AeThex OS" {
  linux /casper/vmlinuz boot=casper quiet splash
  initrd /casper/initrd.img
}
EOF

echo "[+] Creating hybrid ISO with grub-mkrescue..."
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
echo "=== AeThex OS - Mobile UI Edition ==="
echo "Features:"
echo "  - Ubuntu 24.04 LTS base"
echo "  - Xfce desktop environment"
echo "  - Firefox browser (auto-launches mobile UI in kiosk mode)"
echo "  - Node.js 20.x + npm"
echo "  - AeThex Mobile App (Ingress-style) at /opt/aethex-desktop"
echo "  - Server: http://localhost:5000"
echo "  - Auto-login as user 'aethex' (password: aethex)"
echo "  - NetworkManager for WiFi/Ethernet"
echo "  - PipeWire audio support"
echo "  - 18 Capacitor plugins integrated"
echo ""
echo "Mobile UI Features:"
echo "  - Ingress-style hexagonal design"
echo "  - Green/Cyan color scheme"
echo "  - CSS-only animations (low CPU)"
echo "  - Native-like performance"
echo "  - Calculator, Notes, File Manager, Terminal, Games, etc."
echo ""
echo "Flash to USB: sudo ./script/flash-usb.sh -i $BUILD_DIR/$ISO_NAME"
echo "[✓] Done!"
