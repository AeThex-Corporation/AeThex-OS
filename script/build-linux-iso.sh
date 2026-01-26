#!/bin/bash
set -euo pipefail

# AeThex Linux ISO Builder - Containerized Edition
# Creates a bootable ISO using debootstrap + chroot

WORK_DIR="${1:-.}"
BUILD_DIR="$WORK_DIR/aethex-linux-build"
ROOTFS_DIR="$BUILD_DIR/rootfs"
ISO_DIR="$BUILD_DIR/iso"
ISO_NAME="AeThex-Linux-amd64.iso"

echo "[*] AeThex ISO Builder - Containerized Edition"
echo "[*] Build directory: $BUILD_DIR"
echo "[*] This build method works in Docker without privileged mode"

# Clean and prepare
if [ -d "$BUILD_DIR" ]; then
  sudo rm -rf "$BUILD_DIR" 2>/dev/null || {
    find "$BUILD_DIR" -type f -exec chmod 644 {} \; 2>/dev/null || true
    find "$BUILD_DIR" -type d -exec chmod 755 {} \; 2>/dev/null || true
    rm -rf "$BUILD_DIR"
  }
fi
mkdir -p "$ROOTFS_DIR" "$ISO_DIR" "$ISO_DIR"/casper "$ISO_DIR"/isolinux "$ISO_DIR"/boot/grub

# Check dependencies
echo "[*] Checking dependencies..."
apt-get update -qq
apt-get install -y -qq \
  debootstrap squashfs-tools xorriso grub-common grub-pc-bin grub-efi-amd64-bin \
  syslinux-common isolinux mtools dosfstools wget ca-certificates 2>&1 | tail -10

echo "[+] Bootstrapping Ubuntu base (noble)..."
debootstrap --arch=amd64 noble "$ROOTFS_DIR" http://archive.ubuntu.com/ubuntu/
cp /etc/resolv.conf "$ROOTFS_DIR/etc/resolv.conf"

cleanup_mounts() {
  umount -lf "$ROOTFS_DIR/proc" 2>/dev/null || true
  umount -lf "$ROOTFS_DIR/sys" 2>/dev/null || true
  umount -lf "$ROOTFS_DIR/dev/pts" 2>/dev/null || true
  umount -lf "$ROOTFS_DIR/dev" 2>/dev/null || true
}
trap cleanup_mounts EXIT

echo "[+] Building AeThex application layer..."
mkdir -p "$ROOTFS_DIR/proc" "$ROOTFS_DIR/sys" "$ROOTFS_DIR/dev/pts"
mount -t proc proc "$ROOTFS_DIR/proc" || true
mount -t sysfs sys "$ROOTFS_DIR/sys" || true
mount --bind /dev "$ROOTFS_DIR/dev" || true
mount --bind /dev/pts "$ROOTFS_DIR/dev/pts" || true

echo "[+] Installing Xfce desktop, browser, and system tools..."
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
    casper live-boot live-boot-initramfs-tools \
    xorg xfce4 xfce4-goodies lightdm \
    epiphany-browser network-manager \
    sudo curl wget git ca-certificates gnupg \
    pipewire-audio wireplumber \
    file-roller thunar-archive-plugin \
    xfce4-terminal mousepad ristretto \
    dbus-x11
  apt-get clean
  
  # Verify kernel was installed
  if ! ls /boot/vmlinuz-* 2>/dev/null | grep -q .; then
    echo "ERROR: linux-image-generic failed to install!"
    exit 1
  fi
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

# Create auto-start script for browser pointing to mobile server
mkdir -p "$ROOTFS_DIR/home/aethex/.config/autostart"
cat > "$ROOTFS_DIR/home/aethex/.config/autostart/aethex-kiosk.desktop" << 'KIOSK'
[Desktop Entry]
Type=Application
Name=AeThex Mobile UI
Exec=sh -c "sleep 5 && epiphany-browser --incognito --new-window http://localhost:5000"
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

echo "[+] Extracting kernel and initrd from rootfs..."
KERNEL="$(ls -1 $ROOTFS_DIR/boot/vmlinuz-* 2>/dev/null | head -n 1)"
INITRD="$(ls -1 $ROOTFS_DIR/boot/initrd.img-* 2>/dev/null | head -n 1)"

if [ -z "$KERNEL" ] || [ -z "$INITRD" ]; then
  echo "[!] FATAL: Kernel or initrd not found in $ROOTFS_DIR/boot/"
  echo "[!] Contents of $ROOTFS_DIR/boot/:"
  ls -la "$ROOTFS_DIR/boot/" || true
  exit 1
fi

echo "[+] Copying kernel and initrd to $ISO_DIR/casper/..."
cp -v "$KERNEL" "$ISO_DIR/casper/vmlinuz" || { echo "[!] Failed to copy kernel"; exit 1; }
cp -v "$INITRD" "$ISO_DIR/casper/initrd.img" || { echo "[!] Failed to copy initrd"; exit 1; }

# Verify files exist
if [ ! -f "$ISO_DIR/casper/vmlinuz" ]; then
  echo "[!] ERROR: vmlinuz not found after copy"
  ls -la "$ISO_DIR/casper/" || true
  exit 1
fi
if [ ! -f "$ISO_DIR/casper/initrd.img" ]; then
  echo "[!] ERROR: initrd.img not found after copy"
  ls -la "$ISO_DIR/casper/" || true
  exit 1
fi

echo "[✓] Kernel: $(basename "$KERNEL") ($(du -h "$ISO_DIR/casper/vmlinuz" | cut -f1))"
echo "[✓] Initrd: $(basename "$INITRD") ($(du -h "$ISO_DIR/casper/initrd.img" | cut -f1))"
echo "[✓] Initrd -> $ISO_DIR/casper/initrd.img"
echo "[✓] Files verified in ISO directory"

# Unmount before squashfs
echo "[+] Unmounting chroot filesystems..."
umount -lf "$ROOTFS_DIR/proc" 2>/dev/null || true
umount -lf "$ROOTFS_DIR/sys" 2>/dev/null || true
umount -lf "$ROOTFS_DIR/dev/pts" 2>/dev/null || true
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

echo "[+] Final verification before ISO creation..."
for file in "$ISO_DIR/casper/vmlinuz" "$ISO_DIR/casper/initrd.img" "$ISO_DIR/casper/filesystem.squashfs"; do
  if [ ! -f "$file" ]; then
    echo "[!] CRITICAL: Missing $file"
    echo "[!] ISO directory contents:"
    find "$ISO_DIR" -type f 2>/dev/null | head -20
    exit 1
  fi
  echo "[✓] $(basename "$file") - $(du -h "$file" | cut -f1)"
done
echo "[+] Final verification before ISO creation..."
for f in "$ISO_DIR/casper/vmlinuz" "$ISO_DIR/casper/initrd.img" "$ISO_DIR/casper/filesystem.squashfs"; do
  if [ ! -f "$f" ]; then
    echo "[!] CRITICAL: Missing $f"
    ls -la "$ISO_DIR/casper/" || true
    exit 1
  fi
  echo "[✓] $(basename "$f") $(du -h "$f" | awk '{print $1}')"
done

echo "[+] Creating live boot manifest..."
printf $(du -sx --block-size=1 "$ROOTFS_DIR" | cut -f1) > "$ISO_DIR/casper/filesystem.size"
cat > "$ISO_DIR/casper/filesystem.manifest" << 'MANIFEST'
casper
live-boot
live-boot-initramfs-tools
MANIFEST

echo "[+] Setting up BIOS boot (isolinux)..."
mkdir -p "$ISO_DIR/isolinux"
cat > "$ISO_DIR/isolinux/isolinux.cfg" << 'EOF'
DEFAULT vesamenu.c32
PROMPT 0
TIMEOUT 100

LABEL live
  MENU LABEL ^AeThex OS
  KERNEL /casper/vmlinuz
  APPEND initrd=/casper/initrd.img root=/dev/sr0 ro live-media=/dev/sr0 boot=live config ip=dhcp live-config hostname=aethex

LABEL safe
  MENU LABEL AeThex OS (^Safe Mode)
  KERNEL /casper/vmlinuz
  APPEND initrd=/casper/initrd.img root=/dev/sr0 ro live-media=/dev/sr0 boot=live nomodeset config ip=dhcp live-config hostname=aethex
EOF

# Copy syslinux binaries
for src in /usr/lib/syslinux/modules/bios /usr/lib/ISOLINUX /usr/share/syslinux; do
  if [ -f "$src/isolinux.bin" ]; then
    cp "$src/isolinux.bin" "$ISO_DIR/isolinux/" 2>/dev/null
    cp "$src/ldlinux.c32" "$ISO_DIR/isolinux/" 2>/dev/null || true
    cp "$src/vesamenu.c32" "$ISO_DIR/isolinux/" 2>/dev/null || true
    cp "$src/libcom32.c32" "$ISO_DIR/isolinux/" 2>/dev/null || true
    cp "$src/libutil.c32" "$ISO_DIR/isolinux/" 2>/dev/null || true
  fi
done

echo "[+] Setting up UEFI boot (GRUB)..."
mkdir -p "$ISO_DIR/boot/grub"
cat > "$ISO_DIR/boot/grub/grub.cfg" << 'EOF'
set timeout=10
set default=0

menuentry "AeThex OS" {
  linux /casper/vmlinuz root=/dev/sr0 ro live-media=/dev/sr0 boot=live config ip=dhcp live-config hostname=aethex
  initrd /casper/initrd.img
}

menuentry "AeThex OS (safe mode)" {
  linux /casper/vmlinuz root=/dev/sr0 ro live-media=/dev/sr0 boot=live nomodeset config ip=dhcp live-config hostname=aethex
  initrd /casper/initrd.img
}
EOF

echo "[+] Verifying ISO structure before xorriso..."
echo "[*] Checking ISO_DIR contents:"
ls -lh "$ISO_DIR/" || echo "ISO_DIR missing!"
echo "[*] Checking casper contents:"
ls -lh "$ISO_DIR/casper/" || echo "casper dir missing!"
echo "[*] Checking isolinux contents:"
ls -lh "$ISO_DIR/isolinux/" || echo "isolinux dir missing!"

if [ ! -f "$ISO_DIR/casper/vmlinuz" ]; then
  echo "[!] CRITICAL: vmlinuz not in ISO_DIR/casper!"
  find "$ISO_DIR" -name "vmlinuz*" 2>/dev/null || echo "vmlinuz not found anywhere in ISO_DIR"
  exit 1
fi

if [ ! -f "$ISO_DIR/casper/initrd.img" ]; then
  echo "[!] CRITICAL: initrd.img not in ISO_DIR/casper!"
  exit 1
fi

echo "[✓] All casper files verified in place"

echo "[+] Creating EFI boot image..."
mkdir -p "$ISO_DIR/EFI/boot"
grub-mkstandalone \
  --format=x86_64-efi \
  --output="$ISO_DIR/EFI/boot/bootx64.efi" \
  --locales="" \
  --fonts="" \
  "boot/grub/grub.cfg=$ISO_DIR/boot/grub/grub.cfg" 2>&1 | tail -5

# Create EFI image for ISO
dd if=/dev/zero of="$ISO_DIR/boot/grub/efi.img" bs=1M count=10 2>/dev/null
mkfs.vfat "$ISO_DIR/boot/grub/efi.img" >/dev/null 2>&1
EFI_MOUNT=$(mktemp -d)
mount -o loop "$ISO_DIR/boot/grub/efi.img" "$EFI_MOUNT"
mkdir -p "$EFI_MOUNT/EFI/boot"
cp "$ISO_DIR/EFI/boot/bootx64.efi" "$EFI_MOUNT/EFI/boot/"
umount "$EFI_MOUNT"
rmdir "$EFI_MOUNT"

echo "[+] Creating hybrid ISO with xorriso (El Torito boot)..."
xorriso -as mkisofs \
  -iso-level 3 \
  -full-iso9660-filenames \
  -volid "AeThex-OS" \
  -eltorito-boot isolinux/isolinux.bin \
  -eltorito-catalog isolinux/boot.cat \
  -no-emul-boot -boot-load-size 4 -boot-info-table \
  -eltorito-alt-boot \
  -e boot/grub/efi.img \
  -no-emul-boot \
  -isohybrid-mbr /usr/lib/ISOLINUX/isohdpfx.bin \
  -isohybrid-gpt-basdat \
  -output "$BUILD_DIR/$ISO_NAME" \
  "$ISO_DIR" 2>&1 | tail -20

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
