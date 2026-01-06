#!/bin/bash
set -e

# AeThex OS - Full Layered Architecture Builder
# Includes: Base OS + Wine Runtime + Linux Dev Tools + Mode Switching

WORK_DIR="${1:-.}"
BUILD_DIR="$WORK_DIR/aethex-linux-build"
ROOTFS_DIR="$BUILD_DIR/rootfs"
ISO_DIR="$BUILD_DIR/iso"
ISO_NAME="AeThex-OS-Full-amd64.iso"

echo "═══════════════════════════════════════════════════════════════"
echo "  AeThex OS - Full Build"
echo "  Layered Architecture: Base + Runtimes + Shell"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "[*] Build directory: $BUILD_DIR"
echo "[*] Target ISO: $ISO_NAME"
echo ""

# Clean and prepare
rm -rf "$BUILD_DIR"
mkdir -p "$ROOTFS_DIR" "$ISO_DIR"/{casper,isolinux,boot/grub}

# Check dependencies
echo "[*] Checking dependencies..."
for cmd in debootstrap xorriso genisoimage mksquashfs grub-mkrescue; do
  if ! command -v "$cmd" &> /dev/null; then
    echo "[!] Missing: $cmd - installing..."
    apt-get update -qq
    apt-get install -y -qq "$cmd" 2>&1 | tail -5
  fi
done

echo ""
echo "┌─────────────────────────────────────────────────────────────┐"
echo "│ LAYER 1: Base OS (Ubuntu 22.04 LTS) - HP Compatible        │"
echo "└─────────────────────────────────────────────────────────────┘"
echo ""

echo "[+] Bootstrapping Ubuntu 22.04 base system (older kernel 5.15)..."
echo "    (debootstrap takes ~10-15 minutes...)"
debootstrap --arch=amd64 --variant=minbase jammy "$ROOTFS_DIR" http://archive.ubuntu.com/ubuntu/ 2>&1 | tail -20

echo "[+] Configuring base system..."
echo "aethex-os" > "$ROOTFS_DIR/etc/hostname"
cat > "$ROOTFS_DIR/etc/hosts" << 'EOF'
127.0.0.1 localhost
127.0.1.1 aethex-os
::1 localhost ip6-localhost ip6-loopback
EOF

# Mount filesystems for chroot
mount -t proc /proc "$ROOTFS_DIR/proc"
mount -t sysfs /sys "$ROOTFS_DIR/sys"
mount --bind /dev "$ROOTFS_DIR/dev"
mount -t devpts devpts "$ROOTFS_DIR/dev/pts"

echo "[+] Installing base packages..."
chroot "$ROOTFS_DIR" bash -c '
  export DEBIAN_FRONTEND=noninteractive
  
  # Add universe repository
  echo "deb http://archive.ubuntu.com/ubuntu jammy main restricted universe multiverse" > /etc/apt/sources.list
  echo "deb http://archive.ubuntu.com/ubuntu jammy-updates main restricted universe multiverse" >> /etc/apt/sources.list
  echo "deb http://archive.ubuntu.com/ubuntu jammy-security main restricted universe multiverse" >> /etc/apt/sources.list
  
  apt-get update
  apt-get install -y \
    linux-image-generic linux-headers-generic \
    casper \
    grub-pc-bin grub-efi-amd64-bin grub-common xorriso \
    systemd-sysv dbus \
    network-manager wpasupplicant \
    sudo curl wget git ca-certificates gnupg \
    pipewire wireplumber \
    xorg xserver-xorg-video-all \
    xfce4 xfce4-goodies lightdm \
    firefox thunar xfce4-terminal \
    file-roller mousepad ristretto \
    zenity notify-osd \
    vim nano
  
  apt-get clean
' 2>&1 | tail -50

echo ""
echo "┌─────────────────────────────────────────────────────────────┐"
echo "│ LAYER 2a: Windows Runtime (Wine 9.0)                       │"
echo "└─────────────────────────────────────────────────────────────┘"
echo ""

echo "[+] Adding WineHQ repository..."
chroot "$ROOTFS_DIR" bash -c '
  export DEBIAN_FRONTEND=noninteractive
  
  # Enable 32-bit architecture for Wine
  dpkg --add-architecture i386
  
  # Add WineHQ repository
  mkdir -pm755 /etc/apt/keyrings
  wget -O /etc/apt/keyrings/winehq-archive.key https://dl.winehq.org/wine-builds/winehq.key
  wget -NP /etc/apt/sources.list.d/ https://dl.winehq.org/wine-builds/ubuntu/dists/noble/winehq-noble.sources
  
  apt-get update
  apt-get install -y --install-recommends winehq-stable winetricks
  
  # Install Windows fonts
  apt-get install -y ttf-mscorefonts-installer
  
  # Install DXVK for DirectX support
  apt-get install -y dxvk
  
  apt-get clean
' 2>&1 | tail -30

echo "[+] Setting up Wine runtime environment..."
mkdir -p "$ROOTFS_DIR/opt/aethex/runtimes/windows"
cp os/runtimes/windows/wine-launcher.sh "$ROOTFS_DIR/opt/aethex/runtimes/windows/"
chmod +x "$ROOTFS_DIR/opt/aethex/runtimes/windows/wine-launcher.sh"

# Create Wine file associations
cat > "$ROOTFS_DIR/usr/share/applications/wine-aethex.desktop" << 'EOF'
[Desktop Entry]
Name=Windows Application (Wine)
Comment=Run Windows .exe files
Exec=/opt/aethex/runtimes/windows/wine-launcher.sh %f
Type=Application
MimeType=application/x-ms-dos-executable;application/x-msi;application/x-msdownload;
Icon=wine
Categories=Wine;
NoDisplay=false
EOF

chroot "$ROOTFS_DIR" update-desktop-database /usr/share/applications/ 2>/dev/null || true

echo ""
echo "┌─────────────────────────────────────────────────────────────┐"
echo "│ LAYER 2b: Linux Dev Runtime (Docker + Tools)               │"
echo "└─────────────────────────────────────────────────────────────┘"
echo ""

echo "[+] Installing Docker CE..."
chroot "$ROOTFS_DIR" bash -c '
  export DEBIAN_FRONTEND=noninteractive
  
  # Add Docker repository
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  chmod a+r /etc/apt/keyrings/docker.gpg
  
  echo "deb [arch=amd64 signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu jammy stable" > /etc/apt/sources.list.d/docker.list
  
  apt-get update
  apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
  
  systemctl enable docker
  
  apt-get clean
' 2>&1 | tail -20

echo "[+] Installing development tools..."
chroot "$ROOTFS_DIR" bash -c '
  export DEBIAN_FRONTEND=noninteractive
  
  # Build essentials
  apt-get install -y build-essential gcc g++ make cmake autoconf automake
  
  # Version control
  apt-get install -y git git-lfs
  
  # Node.js 20.x
  mkdir -p /etc/apt/keyrings
  curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg
  echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_20.x nodistro main" > /etc/apt/sources.list.d/nodesource.list
  apt-get update
  apt-get install -y nodejs
  
  # Python
  apt-get install -y python3 python3-pip python3-venv
  
  # Rust
  curl --proto "=https" --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
  
  # VSCode
  wget -qO- https://packages.microsoft.com/keys/microsoft.asc | gpg --dearmor > /etc/apt/keyrings/packages.microsoft.gpg
  echo "deb [arch=amd64,arm64,armhf signed-by=/etc/apt/keyrings/packages.microsoft.gpg] https://packages.microsoft.com/repos/code stable main" > /etc/apt/sources.list.d/vscode.list
  apt-get update
  apt-get install -y code
  
  apt-get clean
' 2>&1 | tail -30

echo "[+] Setting up dev runtime launchers..."
mkdir -p "$ROOTFS_DIR/opt/aethex/runtimes/linux-dev"
cp os/runtimes/linux-dev/dev-launcher.sh "$ROOTFS_DIR/opt/aethex/runtimes/linux-dev/"
chmod +x "$ROOTFS_DIR/opt/aethex/runtimes/linux-dev/dev-launcher.sh"

echo ""
echo "┌─────────────────────────────────────────────────────────────┐"
echo "│ LAYER 3: Shell & Mode Switching                            │"
echo "└─────────────────────────────────────────────────────────────┘"
echo ""

echo "[+] Installing runtime selector..."
mkdir -p "$ROOTFS_DIR/opt/aethex/shell/bin"
cp os/shell/bin/runtime-selector.sh "$ROOTFS_DIR/opt/aethex/shell/bin/"
chmod +x "$ROOTFS_DIR/opt/aethex/shell/bin/runtime-selector.sh"

# Install systemd service
cp os/shell/systemd/aethex-runtime-selector.service "$ROOTFS_DIR/etc/systemd/system/"
chroot "$ROOTFS_DIR" systemctl enable aethex-runtime-selector.service 2>/dev/null || true

echo "[+] Installing Node.js for AeThex Mobile UI..."
# Already installed in dev tools section

echo ""
echo "┌─────────────────────────────────────────────────────────────┐"
echo "│ AeThex Mobile App Integration                              │"
echo "└─────────────────────────────────────────────────────────────┘"
echo ""

echo "[+] Setting up AeThex Desktop application..."

# Build mobile app if possible
if [ -f "package.json" ]; then
  echo "    Building AeThex mobile app..."
  npm run build 2>&1 | tail -5 || echo "    Build skipped"
fi

# Copy app files
if [ -d "client" ] && [ -d "server" ]; then
  echo "    Copying AeThex Desktop files..."
  mkdir -p "$ROOTFS_DIR/opt/aethex-desktop"
  
  cp -r client "$ROOTFS_DIR/opt/aethex-desktop/"
  cp -r server "$ROOTFS_DIR/opt/aethex-desktop/"
  cp -r shared "$ROOTFS_DIR/opt/aethex-desktop/" 2>/dev/null || true
  cp package*.json "$ROOTFS_DIR/opt/aethex-desktop/" 2>/dev/null || true
  cp tsconfig.json "$ROOTFS_DIR/opt/aethex-desktop/" 2>/dev/null || true
  cp vite.config.ts "$ROOTFS_DIR/opt/aethex-desktop/" 2>/dev/null || true
  
  # Copy built assets
  if [ -d "dist" ]; then
    cp -r dist "$ROOTFS_DIR/opt/aethex-desktop/"
  fi
  
  echo "    Installing dependencies..."
  chroot "$ROOTFS_DIR" bash -c 'cd /opt/aethex-desktop && npm install --production --legacy-peer-deps' 2>&1 | tail -10 || true
else
  echo "    (client/server not found; skipping)"
fi

# Create systemd service
cat > "$ROOTFS_DIR/etc/systemd/system/aethex-mobile-server.service" << 'EOF'
[Unit]
Description=AeThex Mobile Server
After=network-online.target docker.service
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
EOF

chroot "$ROOTFS_DIR" systemctl enable aethex-mobile-server.service 2>/dev/null || true

echo ""
echo "┌─────────────────────────────────────────────────────────────┐"
echo "│ User Configuration                                          │"
echo "└─────────────────────────────────────────────────────────────┘"
echo ""

echo "[+] Creating aethex user..."
chroot "$ROOTFS_DIR" bash -c '
  useradd -m -s /bin/bash -G sudo,docker aethex
  echo "aethex:aethex" | chpasswd
  echo "aethex ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers
'

# Configure LightDM auto-login
mkdir -p "$ROOTFS_DIR/etc/lightdm"
cat > "$ROOTFS_DIR/etc/lightdm/lightdm.conf" << 'EOF'
[Seat:*]
autologin-user=aethex
autologin-user-timeout=0
user-session=xfce
EOF

# Auto-start Firefox kiosk
mkdir -p "$ROOTFS_DIR/home/aethex/.config/autostart"
cat > "$ROOTFS_DIR/home/aethex/.config/autostart/aethex-kiosk.desktop" << 'EOF'
[Desktop Entry]
Type=Application
Name=AeThex Mobile UI
Exec=sh -c "sleep 5 && firefox --kiosk http://localhost:5000"
Hidden=false
NoDisplay=false
X-GNOME-Autostart-enabled=true
Comment=Launch AeThex mobile interface in fullscreen
EOF

chroot "$ROOTFS_DIR" chown -R aethex:aethex /home/aethex /opt/aethex-desktop 2>/dev/null || true

echo ""
echo "┌─────────────────────────────────────────────────────────────┐"
echo "│ ISO Packaging                                               │"
echo "└─────────────────────────────────────────────────────────────┘"
echo ""

echo "[+] Regenerating initramfs with casper..."
chroot "$ROOTFS_DIR" bash -c '
  export DEBIAN_FRONTEND=noninteractive
  KERNEL_VERSION=$(ls /boot/vmlinuz-* | sed "s|/boot/vmlinuz-||" | head -n 1)
  echo "    Rebuilding initramfs for kernel $KERNEL_VERSION with casper..."
  update-initramfs -u -k "$KERNEL_VERSION"
' 2>&1 | tail -10

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

echo "[+] Verifying casper in initrd..."
if lsinitramfs "$ISO_DIR/casper/initrd.img" | grep -q "scripts/casper"; then
  echo "[✓] Casper scripts found in initrd"
else
  echo "[!] WARNING: Casper scripts NOT found in initrd!"
fi

# Unmount chroot filesystems
echo "[+] Unmounting chroot..."
umount -lf "$ROOTFS_DIR/dev/pts" 2>/dev/null || true
umount -lf "$ROOTFS_DIR/proc" 2>/dev/null || true
umount -lf "$ROOTFS_DIR/sys" 2>/dev/null || true
umount -lf "$ROOTFS_DIR/dev" 2>/dev/null || true

echo "[+] Creating SquashFS filesystem..."
echo "    (compressing ~4-5GB system, takes 15-20 minutes...)"
mksquashfs "$ROOTFS_DIR" "$ISO_DIR/casper/filesystem.squashfs" -b 1048576 -comp xz -Xdict-size 100% 2>&1 | tail -5

echo "[+] Setting up BIOS boot (isolinux)..."
cat > "$ISO_DIR/isolinux/isolinux.cfg" << 'EOF'
PROMPT 0
TIMEOUT 50
DEFAULT linux

LABEL linux
  MENU LABEL AeThex OS - Full Stack
  KERNEL /casper/vmlinuz
  APPEND initrd=/casper/initrd.img boot=casper quiet splash ---

LABEL safe
  MENU LABEL AeThex OS - Safe Mode (No ACPI)
  KERNEL /casper/vmlinuz
  APPEND initrd=/casper/initrd.img boot=casper acpi=off noapic nomodeset ---
EOF

cp /usr/lib/syslinux/isolinux.bin "$ISO_DIR/isolinux/" 2>/dev/null || \
cp /usr/share/syslinux/isolinux.bin "$ISO_DIR/isolinux/" 2>/dev/null || true
cp /usr/lib/syslinux/ldlinux.c32 "$ISO_DIR/isolinux/" 2>/dev/null || \
cp /usr/share/syslinux/ldlinux.c32 "$ISO_DIR/isolinux/" 2>/dev/null || true

echo "[+] Setting up UEFI boot (GRUB)..."
cat > "$ISO_DIR/boot/grub/grub.cfg" << 'EOF'
set timeout=10
set default=0

menuentry "AeThex OS - Full Stack" {
  linux /casper/vmlinuz boot=casper quiet splash ---
  initrd /casper/initrd.img
}

menuentry "AeThex OS - Safe Mode (No ACPI)" {
  linux /casper/vmlinuz boot=casper acpi=off noapic nomodeset ---
  initrd /casper/initrd.img
}

menuentry "AeThex OS - Debug Mode" {
  linux /casper/vmlinuz boot=casper debug ignore_loglevel earlyprintk=vga ---
  initrd /casper/initrd.img
}
EOF

echo "[+] Creating hybrid ISO..."
grub-mkrescue -o "$BUILD_DIR/$ISO_NAME" "$ISO_DIR" --verbose 2>&1 | tail -20

echo "[+] Computing SHA256 checksum..."
if [ -f "$BUILD_DIR/$ISO_NAME" ]; then
  cd "$BUILD_DIR"
  sha256sum "$ISO_NAME" > "$ISO_NAME.sha256"
  echo ""
  echo "═══════════════════════════════════════════════════════════════"
  echo "  ✓ ISO Build Complete!"
  echo "═══════════════════════════════════════════════════════════════"
  echo ""
  ls -lh "$ISO_NAME" | awk '{print "    Size: " $5}'
  cat "$ISO_NAME.sha256" | awk '{print "    SHA256: " $1}'
  echo "    Location: $BUILD_DIR/$ISO_NAME"
  echo ""
else
  echo "[!] ISO creation failed."
  exit 1
fi

echo "[*] Cleaning up rootfs..."
rm -rf "$ROOTFS_DIR"

echo ""
echo "┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓"
echo "┃  AeThex OS - Full Stack Edition                           ┃"
echo "┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛"
echo ""
echo "ARCHITECTURE:"
echo "  ├── Base OS: Ubuntu 22.04 LTS (kernel 5.15 - better hardware compat)"
echo "  ├── Runtime: Windows (Wine 9.0 + DXVK)"
echo "  ├── Runtime: Linux Dev (Docker + VSCode + Node + Python + Rust)"
echo "  ├── Live Boot: Casper (full live USB support)"
echo "  └── Shell: Mode switching + file associations"
echo ""
echo "INSTALLED RUNTIMES:"
echo "  • Wine 9.0 (run .exe files)"
echo "  • Docker CE (containerized development)"
echo "  • Node.js 20.x + npm"
echo "  • Python 3 + pip"
echo "  • Rust + Cargo"
echo "  • VSCode"
echo "  • Git + build tools"
echo ""
echo "DESKTOP ENVIRONMENT:"
echo "  • Xfce 4.18 (lightweight, customizable)"
echo "  • LightDM (auto-login as 'aethex')"
echo "  • Firefox (kiosk mode for mobile UI)"
echo "  • NetworkManager (WiFi/Ethernet)"
echo "  • PipeWire (modern audio)"
echo ""
echo "AETHEX MOBILE APP:"
echo "  • Server: http://localhost:5000"
echo "  • Ingress-style hexagonal UI"
echo "  • 18 Capacitor plugins"
echo "  • Auto-launches on boot"
echo ""
echo "CREDENTIALS:"
echo "  Username: aethex"
echo "  Password: aethex"
echo "  Sudo: passwordless"
echo ""
echo "FLASH TO USB:"
echo "  sudo dd if=$BUILD_DIR/$ISO_NAME of=/dev/sdX bs=4M status=progress"
echo "  (or use Rufus on Windows)"
echo ""
echo "[✓] Build complete! Flash to USB and boot."
echo ""

