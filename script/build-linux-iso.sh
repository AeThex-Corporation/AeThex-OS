#!/bin/bash
set -e

# AeThex Linux - ISO Builder Script (Proof of Concept)
# Builds a bootable Ubuntu-based ISO with AeThex Desktop Environment

VERSION="1.0.0-alpha"
BUILD_DIR="$HOME/aethex-linux-build"
REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ISO_NAME="AeThex-Linux-${VERSION}-amd64.iso"

echo "======================================"
echo "  AeThex Linux ISO Builder"
echo "  Version: ${VERSION}"
echo "======================================"
echo ""

# Check for root
if [[ $EUID -ne 0 ]]; then
   echo "This script must be run as root (sudo)" 
   exit 1
fi

# Install dependencies
echo "[1/10] Installing build dependencies..."
apt-get update -qq
apt-get install -y \
  debootstrap \
  squashfs-tools \
  xorriso \
  grub-pc-bin \
  grub-efi-amd64-bin \
  mtools \
  dosfstools \
  isolinux \
  syslinux-common \
  > /dev/null 2>&1

echo "[2/10] Creating build directory..."
mkdir -p "${BUILD_DIR}"/{chroot,iso,iso/boot/{grub,isolinux}}
cd "${BUILD_DIR}"

# Bootstrap Ubuntu base system
echo "[3/10] Bootstrapping Ubuntu 24.04 base system (this may take 5-10 minutes)..."
if [ ! -d "chroot/bin" ]; then
  debootstrap --arch=amd64 noble chroot http://archive.ubuntu.com/ubuntu/
fi

# Chroot configuration
echo "[4/10] Configuring base system..."
cat > chroot/etc/apt/sources.list << 'EOF'
deb http://archive.ubuntu.com/ubuntu noble main restricted universe multiverse
deb http://archive.ubuntu.com/ubuntu noble-updates main restricted universe multiverse
deb http://archive.ubuntu.com/ubuntu noble-security main restricted universe multiverse
EOF

# Install packages in chroot
echo "[5/10] Installing system packages..."
chroot chroot /bin/bash -c "
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y \
  linux-image-generic \
  linux-headers-generic \
  grub-efi-amd64 \
  grub-pc-bin \
  systemd \
  network-manager \
  pulseaudio \
  mesa-utils \
  xorg \
  lightdm \
  openbox \
  wget \
  curl \
  git \
  sudo \
  > /dev/null 2>&1
"

echo "[6/10] Building AeThex Desktop binary..."
cd "${REPO_DIR}"
if [ ! -f "src-tauri/target/release/aethex-os" ]; then
  echo "Building Tauri app (this may take a few minutes)..."
  npm run tauri:build || {
    echo "ERROR: Tauri build failed. Make sure Rust and dependencies are installed."
    exit 1
  }
fi

# Copy AeThex Desktop to chroot
echo "[7/10] Installing AeThex Desktop..."
cp "${REPO_DIR}/src-tauri/target/release/aethex-os" "${BUILD_DIR}/chroot/usr/bin/aethex-desktop"
chmod +x "${BUILD_DIR}/chroot/usr/bin/aethex-desktop"

# Copy assets if they exist
if [ -d "${REPO_DIR}/dist/public" ]; then
  mkdir -p "${BUILD_DIR}/chroot/usr/share/aethex-desktop"
  cp -r "${REPO_DIR}/dist/public"/* "${BUILD_DIR}/chroot/usr/share/aethex-desktop/"
fi

# Create desktop session
echo "[8/10] Configuring desktop environment..."
mkdir -p "${BUILD_DIR}/chroot/usr/share/xsessions"
cat > "${BUILD_DIR}/chroot/usr/share/xsessions/aethex.desktop" << 'EOF'
[Desktop Entry]
Name=AeThex OS
Comment=AeThex Desktop Environment
Exec=/usr/bin/aethex-desktop
Type=Application
DesktopNames=AeThex
X-Ubuntu-Gettext-Domain=aethex-session
EOF

# Create default user
chroot chroot /bin/bash -c "
useradd -m -s /bin/bash aethex || true
echo 'aethex:aethex' | chpasswd
usermod -aG sudo,audio,video,plugdev aethex
"

# Configure auto-login
cat > "${BUILD_DIR}/chroot/etc/lightdm/lightdm.conf" << 'EOF'
[Seat:*]
autologin-user=aethex
autologin-user-timeout=0
user-session=aethex
EOF

# Configure hostname
echo "aethex-linux" > "${BUILD_DIR}/chroot/etc/hostname"

# Create systemd service
mkdir -p "${BUILD_DIR}/chroot/etc/systemd/system"
cat > "${BUILD_DIR}/chroot/etc/systemd/system/aethex-desktop.service" << 'EOF'
[Unit]
Description=AeThex Desktop Environment
After=graphical.target network.target
Wants=network.target

[Service]
Type=simple
User=aethex
Environment=DISPLAY=:0
ExecStart=/usr/bin/aethex-desktop
Restart=on-failure
RestartSec=5

[Install]
WantedBy=graphical.target
EOF

chroot chroot systemctl enable lightdm aethex-desktop || true

# Create GRUB config
echo "[9/10] Configuring bootloader..."
cat > "${BUILD_DIR}/iso/boot/grub/grub.cfg" << 'EOF'
set default="0"
set timeout=10

menuentry "AeThex Linux (Live)" {
    linux /boot/vmlinuz boot=casper quiet splash
    initrd /boot/initrd
}

menuentry "AeThex Linux (Install)" {
    linux /boot/vmlinuz boot=casper only-ubiquity quiet splash
    initrd /boot/initrd
}
EOF

# Copy kernel and initrd
echo "[10/10] Creating ISO image..."
cp "${BUILD_DIR}/chroot/boot/vmlinuz-"* "${BUILD_DIR}/iso/boot/vmlinuz"
cp "${BUILD_DIR}/chroot/boot/initrd.img-"* "${BUILD_DIR}/iso/boot/initrd"

# Create squashfs
mksquashfs "${BUILD_DIR}/chroot" "${BUILD_DIR}/iso/live/filesystem.squashfs" \
  -comp xz -e boot || {
  echo "ERROR: Failed to create squashfs"
  exit 1
}

# Create ISO
cd "${BUILD_DIR}"
xorriso -as mkisofs \
  -iso-level 3 \
  -full-iso9660-filenames \
  -volid "AETHEX_LINUX" \
  -appid "AeThex Linux ${VERSION}" \
  -publisher "AeThex Corporation" \
  -eltorito-boot boot/grub/grub.cfg \
  -eltorito-catalog boot/grub/boot.cat \
  -no-emul-boot \
  -boot-load-size 4 \
  -boot-info-table \
  -eltorito-alt-boot \
  -e EFI/efiboot.img \
  -no-emul-boot \
  -isohybrid-gpt-basdat \
  -output "${ISO_NAME}" \
  iso/ 2>&1 | grep -v "NOTE: The file is larger" || true

# Generate checksum
sha256sum "${ISO_NAME}" > "${ISO_NAME}.sha256"

echo ""
echo "======================================"
echo "  Build Complete!"
echo "======================================"
echo ""
echo "ISO Location: ${BUILD_DIR}/${ISO_NAME}"
echo "ISO Size: $(du -h "${BUILD_DIR}/${ISO_NAME}" | cut -f1)"
echo "Checksum: ${BUILD_DIR}/${ISO_NAME}.sha256"
echo ""
echo "Next steps:"
echo "  1. Test in VM: sudo bash script/test-in-vm.sh"
echo "  2. Write to USB: sudo dd if=${ISO_NAME} of=/dev/sdX bs=4M status=progress"
echo "  3. Boot from USB on real hardware"
echo ""
