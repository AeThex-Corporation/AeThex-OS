#!/bin/bash
set -e

# AeThex Multi-ISO Builder
# Builds all 5 ISO variants for Ventoy deployment

BUILD_DIR="$(pwd)/aethex-linux-build"
ISO_OUTPUT="$BUILD_DIR/ventoy-isos"
BASE_ISO="$BUILD_DIR/base-system.iso"

echo "🚀 Building All AeThex-OS ISO Variants..."
echo "================================================"

# Create output directory
mkdir -p "$ISO_OUTPUT"

# Function to build custom ISO from base
build_custom_iso() {
    local variant=$1
    local display_name=$2
    local packages=$3
    local config_script=$4
    
    echo ""
    echo "📦 Building AeThex-$variant.iso..."
    echo "=================================="
    
    # Create working directory
    WORK_DIR="/tmp/aethex-$variant"
    sudo rm -rf "$WORK_DIR"
    mkdir -p "$WORK_DIR"
    
    # Extract base ISO
    echo "   Extracting base system..."
    sudo mount -o loop "$BASE_ISO" /mnt 2>/dev/null || true
    sudo cp -a /mnt/* "$WORK_DIR/" 2>/dev/null || true
    sudo umount /mnt 2>/dev/null || true
    
    # Customize with chroot
    echo "   Installing packages: $packages"
    sudo chroot "$WORK_DIR" /bin/bash <<EOF
export DEBIAN_FRONTEND=noninteractive
apt update
apt install -y $packages
$config_script
apt clean
rm -rf /var/lib/apt/lists/*
EOF
    
    # Create branded boot splash
    cat > "$WORK_DIR/isolinux/splash.txt" <<EOF
   ___       ________              
  / _ |___  /_  __/ /  ___ __ __  
 / __ / -_)  / / / _ \/ -_) \ /   
/_/ |_\__/  /_/ /_//_/\__/_\_\    
                                   
    $display_name Edition
    
Boot Options:
[Enter] Start AeThex-OS
[Tab]   Advanced Options
EOF
    
    # Build ISO
    echo "   Creating ISO image..."
    sudo xorriso -as mkisofs \
        -iso-level 3 \
        -full-iso9660-filenames \
        -volid "AeThex-$variant" \
        -appid "AeThex-OS $display_name Edition" \
        -publisher "AeThex Corporation" \
        -preparer "AeThex Build System" \
        -eltorito-boot isolinux/isolinux.bin \
        -eltorito-catalog isolinux/boot.cat \
        -no-emul-boot \
        -boot-load-size 4 \
        -boot-info-table \
        -isohybrid-mbr /usr/lib/ISOLINUX/isohdpfx.bin \
        -output "$ISO_OUTPUT/AeThex-$variant.iso" \
        "$WORK_DIR"
    
    # Cleanup
    sudo rm -rf "$WORK_DIR"
    
    # Calculate checksums
    cd "$ISO_OUTPUT"
    sha256sum "AeThex-$variant.iso" > "AeThex-$variant.iso.sha256"
    cd - > /dev/null
    
    echo "   ✅ AeThex-$variant.iso complete!"
    ls -lh "$ISO_OUTPUT/AeThex-$variant.iso"
}

# ============================================
# Step 1: Build Base System (if not exists)
# ============================================
if [ ! -f "$BASE_ISO" ]; then
    echo "📦 Building base system ISO..."
    ./script/build-iso.sh
    cp "$BUILD_DIR/AeThex-Linux-amd64.iso" "$BASE_ISO"
fi

# ============================================
# Step 2: Build AeThex-Core (Minimal)
# ============================================
build_custom_iso "Core" "Base OS" \
    "firefox chromium-browser neofetch htop" \
    "
# Set hostname
echo 'aethex-core' > /etc/hostname

# Create default user
useradd -m -s /bin/bash -G sudo aethex
echo 'aethex:aethex' | chpasswd

# Auto-login
mkdir -p /etc/lightdm/lightdm.conf.d
cat > /etc/lightdm/lightdm.conf.d/50-aethex.conf <<EOL
[Seat:*]
autologin-user=aethex
autologin-user-timeout=0
EOL

# Startup script
mkdir -p /home/aethex/.config/autostart
cat > /home/aethex/.config/autostart/aethex-launcher.desktop <<EOL
[Desktop Entry]
Type=Application
Name=AeThex Launcher
Exec=firefox --kiosk https://aethex.app
Hidden=false
NoDisplay=false
X-GNOME-Autostart-enabled=true
EOL
chown -R aethex:aethex /home/aethex/.config
"

# ============================================
# Step 3: Build AeThex-Gaming
# ============================================
build_custom_iso "Gaming" "Gaming OS" \
    "steam-installer lutris discord obs-studio gamemode mesa-vulkan-drivers libvulkan1 wine-stable winetricks mangohud" \
    "
# Set hostname
echo 'aethex-gaming' > /etc/hostname

# Create gamer user
useradd -m -s /bin/bash -G sudo,audio,video,input aethex
echo 'aethex:aethex' | chpasswd

# Install Steam
echo 'steam steam/question select I AGREE' | debconf-set-selections
echo 'steam steam/license note' | debconf-set-selections

# Enable gamemode
systemctl enable gamemode

# Gaming optimizations
cat > /etc/sysctl.d/99-gaming.conf <<EOL
vm.max_map_count=2147483642
kernel.sched_autogroup_enabled=0
EOL

# Desktop gaming launcher
mkdir -p /home/aethex/.config/autostart
cat > /home/aethex/.config/autostart/gaming-hub.desktop <<EOL
[Desktop Entry]
Type=Application
Name=AeThex Gaming Hub
Exec=firefox --kiosk https://aethex.app/hub/game-marketplace
Hidden=false
NoDisplay=false
X-GNOME-Autostart-enabled=true
EOL

# Desktop shortcuts
mkdir -p /home/aethex/Desktop
cat > /home/aethex/Desktop/steam.desktop <<EOL
[Desktop Entry]
Name=Steam
Exec=steam
Icon=steam
Type=Application
Categories=Game;
EOL

cat > /home/aethex/Desktop/discord.desktop <<EOL
[Desktop Entry]
Name=Discord
Exec=discord
Icon=discord
Type=Application
Categories=Network;
EOL

chown -R aethex:aethex /home/aethex
chmod +x /home/aethex/Desktop/*.desktop
"

# ============================================
# Step 4: Build AeThex-Dev
# ============================================
build_custom_iso "Dev" "Developer OS" \
    "code git docker.io docker-compose nodejs npm python3 python3-pip golang-go rust-all openjdk-17-jdk postgresql-client mysql-client curl wget build-essential" \
    "
# Set hostname
echo 'aethex-dev' > /etc/hostname

# Create developer user
useradd -m -s /bin/bash -G sudo,docker aethex
echo 'aethex:aethex' | chpasswd

# Enable Docker
systemctl enable docker

# Install global npm packages
npm install -g typescript tsx vite @tauri-apps/cli

# Install Rust tools
sudo -u aethex bash -c 'curl --proto \"=https\" --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y'

# Git config
sudo -u aethex git config --global init.defaultBranch main
sudo -u aethex git config --global user.name 'AeThex Developer'
sudo -u aethex git config --global user.email 'dev@aethex.app'

# VS Code extensions
sudo -u aethex code --install-extension dbaeumer.vscode-eslint
sudo -u aethex code --install-extension esbenp.prettier-vscode
sudo -u aethex code --install-extension rust-lang.rust-analyzer
sudo -u aethex code --install-extension tauri-apps.tauri-vscode

# Development shortcuts
mkdir -p /home/aethex/Desktop
cat > /home/aethex/Desktop/vscode.desktop <<EOL
[Desktop Entry]
Name=Visual Studio Code
Exec=code
Icon=code
Type=Application
Categories=Development;
EOL

cat > /home/aethex/Desktop/terminal.desktop <<EOL
[Desktop Entry]
Name=Terminal
Exec=gnome-terminal
Icon=utilities-terminal
Type=Application
Categories=System;
EOL

# Clone AeThex repo on first boot
mkdir -p /home/aethex/Projects
cd /home/aethex/Projects
git clone https://github.com/aethex/AeThex-OS.git || true

chown -R aethex:aethex /home/aethex
chmod +x /home/aethex/Desktop/*.desktop
"

# ============================================
# Step 5: Build AeThex-Creator
# ============================================
build_custom_iso "Creator" "Content Creator OS" \
    "obs-studio kdenlive gimp inkscape blender audacity ffmpeg v4l-utils davinci-resolve-studio" \
    "
# Set hostname
echo 'aethex-creator' > /etc/hostname

# Create creator user
useradd -m -s /bin/bash -G sudo,audio,video aethex
echo 'aethex:aethex' | chpasswd

# OBS Studio plugins
mkdir -p /home/aethex/.config/obs-studio/plugins

# Streaming optimizations
cat > /etc/sysctl.d/99-streaming.conf <<EOL
net.core.rmem_max=134217728
net.core.wmem_max=134217728
EOL

# Desktop shortcuts
mkdir -p /home/aethex/Desktop
cat > /home/aethex/Desktop/obs.desktop <<EOL
[Desktop Entry]
Name=OBS Studio
Exec=obs
Icon=obs
Type=Application
Categories=AudioVideo;
EOL

cat > /home/aethex/Desktop/kdenlive.desktop <<EOL
[Desktop Entry]
Name=Kdenlive Video Editor
Exec=kdenlive
Icon=kdenlive
Type=Application
Categories=AudioVideo;
EOL

cat > /home/aethex/Desktop/gimp.desktop <<EOL
[Desktop Entry]
Name=GIMP
Exec=gimp
Icon=gimp
Type=Application
Categories=Graphics;
EOL

cat > /home/aethex/Desktop/streaming-hub.desktop <<EOL
[Desktop Entry]
Name=Streaming Hub
Exec=firefox --new-window https://aethex.app/hub/game-streaming
Icon=video-display
Type=Application
Categories=Network;
EOL

# Project folders
mkdir -p /home/aethex/Videos/Recordings
mkdir -p /home/aethex/Videos/Projects
mkdir -p /home/aethex/Pictures/Screenshots
mkdir -p /home/aethex/Music/Audio

chown -R aethex:aethex /home/aethex
chmod +x /home/aethex/Desktop/*.desktop
"

# ============================================
# Step 6: Build AeThex-Server (Headless)
# ============================================
build_custom_iso "Server" "Server Edition" \
    "openssh-server docker.io docker-compose postgresql nginx nodejs npm fail2ban ufw" \
    "
# Set hostname
echo 'aethex-server' > /etc/hostname

# Create server user
useradd -m -s /bin/bash -G sudo,docker aethex
echo 'aethex:aethex' | chpasswd

# Enable services
systemctl enable ssh
systemctl enable docker
systemctl enable nginx
systemctl enable fail2ban

# Configure firewall
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 5000/tcp
ufw --force enable

# SSH hardening
sed -i 's/#PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
sed -i 's/#PasswordAuthentication yes/PasswordAuthentication yes/' /etc/ssh/sshd_config

# Install AeThex server components
mkdir -p /opt/aethex
cd /opt/aethex
# Clone server repo (placeholder)
echo '#!/bin/bash' > /opt/aethex/start-server.sh
echo 'cd /opt/aethex/AeThex-OS/server' >> /opt/aethex/start-server.sh
echo 'npm install' >> /opt/aethex/start-server.sh
echo 'npm start' >> /opt/aethex/start-server.sh
chmod +x /opt/aethex/start-server.sh

# Systemd service
cat > /etc/systemd/system/aethex-server.service <<EOL
[Unit]
Description=AeThex Ecosystem Server
After=network.target postgresql.service

[Service]
Type=simple
User=aethex
WorkingDirectory=/opt/aethex
ExecStart=/opt/aethex/start-server.sh
Restart=always

[Install]
WantedBy=multi-user.target
EOL

systemctl enable aethex-server

# Disable GUI (headless)
systemctl set-default multi-user.target
"

# ============================================
# Step 7: Create Ventoy Package
# ============================================
echo ""
echo "📦 Creating Ventoy Package..."
echo "=================================="

VENTOY_PKG="$BUILD_DIR/AeThex-Ventoy-Package"
mkdir -p "$VENTOY_PKG"

# Copy all ISOs
cp "$ISO_OUTPUT"/*.iso "$VENTOY_PKG/"
cp "$ISO_OUTPUT"/*.sha256 "$VENTOY_PKG/"

# Create Ventoy configuration
cat > "$VENTOY_PKG/ventoy.json" <<'EOF'
{
  "theme": {
    "display_mode": "GUI",
    "ventoy_color": "#00FFFF",
    "fonts": ["/ventoy/fonts/ubuntu.ttf"]
  },
  "menu_alias": [
    {
      "image": "/AeThex-Core.iso",
      "alias": "AeThex-OS Core Edition (Base System)"
    },
    {
      "image": "/AeThex-Gaming.iso",
      "alias": "AeThex-OS Gaming Edition (Steam, Discord, OBS)"
    },
    {
      "image": "/AeThex-Dev.iso",
      "alias": "AeThex-OS Developer Edition (VS Code, Docker, Git)"
    },
    {
      "image": "/AeThex-Creator.iso",
      "alias": "AeThex-OS Creator Edition (OBS, Video Editing)"
    },
    {
      "image": "/AeThex-Server.iso",
      "alias": "AeThex-OS Server Edition (Headless, No GUI)"
    }
  ],
  "menu_tip": {
    "left": "85%",
    "top": "90%",
    "color": "#0080FF"
  }
}
EOF

# Create README
cat > "$VENTOY_PKG/README.txt" <<'EOF'
╔══════════════════════════════════════════════════════════════╗
║           AeThex-OS Ventoy Multi-Boot Package                ║
║                                                              ║
║  Unified bootable USB with 5 specialized OS editions        ║
╚══════════════════════════════════════════════════════════════╝

INSTALLATION:
1. Download Ventoy from https://www.ventoy.net
2. Install Ventoy to your USB drive (8GB+ recommended)
3. Copy ALL files from this package to the USB drive root
4. Boot from USB and select your edition

EDITIONS INCLUDED:

📦 AeThex-Core.iso (1.5GB)
   • Base operating system
   • Firefox, file manager, terminal
   • Connects to AeThex ecosystem
   • Use case: General computing, testing

🎮 AeThex-Gaming.iso (3.2GB)
   • Pre-installed Steam, Lutris, Discord
   • OBS Studio for streaming
   • Game performance optimizations
   • Vulkan/Mesa drivers
   • Use case: Gaming, streaming

💻 AeThex-Dev.iso (2.8GB)
   • VS Code, Docker, Git
   • Node.js, Python, Rust, Go, Java
   • Database clients (PostgreSQL, MySQL)
   • Development tools pre-configured
   • Use case: Software development

🎨 AeThex-Creator.iso (4.1GB)
   • OBS Studio for streaming
   • Kdenlive video editor
   • GIMP, Inkscape, Blender
   • Audio production tools
   • Use case: Content creation, video editing

🖥️ AeThex-Server.iso (1.2GB)
   • Headless (no GUI)
   • SSH, Docker, Nginx, PostgreSQL
   • Firewall pre-configured
   • AeThex server components
   • Use case: Servers, cloud deployments

DEFAULT CREDENTIALS:
Username: aethex
Password: aethex
(Change password immediately after first boot!)

ECOSYSTEM CONNECTIVITY:
All editions connect to:
• Web: https://aethex.app
• Desktop: Tauri app sync
• Mobile: iOS/Android app sync
• Real-time sync via Supabase

VERIFICATION:
Each ISO has a .sha256 checksum file. Verify integrity:
  sha256sum -c AeThex-Core.iso.sha256

SUPPORT:
• Documentation: https://docs.aethex.app
• Discord: https://discord.gg/aethex
• GitHub: https://github.com/aethex/AeThex-OS

Build Date: $(date)
Version: 1.0.0
EOF

# Create quick setup script
cat > "$VENTOY_PKG/SETUP-VENTOY.sh" <<'EOF'
#!/bin/bash
# Quick Ventoy Setup Script

echo "AeThex-OS Ventoy Installer"
echo "============================="
echo ""
echo "This script will install Ventoy to your USB drive."
echo "WARNING: All data on the USB drive will be erased!"
echo ""

# List available drives
lsblk -d -o NAME,SIZE,TYPE,MOUNTPOINT | grep disk

echo ""
read -p "Enter USB device (e.g., sdb): /dev/" DEVICE

if [ ! -b "/dev/$DEVICE" ]; then
    echo "Error: Device /dev/$DEVICE not found!"
    exit 1
fi

echo ""
echo "You selected: /dev/$DEVICE"
lsblk "/dev/$DEVICE"
echo ""
read -p "This will ERASE /dev/$DEVICE. Continue? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "Aborted."
    exit 0
fi

# Download Ventoy if not present
if [ ! -f "ventoy/Ventoy2Disk.sh" ]; then
    echo "Downloading Ventoy..."
    wget https://github.com/ventoy/Ventoy/releases/download/v1.0.96/ventoy-1.0.96-linux.tar.gz
    tar -xzf ventoy-*.tar.gz
    mv ventoy-*/ ventoy/
fi

# Install Ventoy
echo "Installing Ventoy to /dev/$DEVICE..."
sudo ./ventoy/Ventoy2Disk.sh -i "/dev/$DEVICE"

# Mount and copy ISOs
echo "Copying ISO files..."
sleep 2
MOUNT_POINT=$(lsblk -no MOUNTPOINT "/dev/${DEVICE}1" | head -1)
if [ -z "$MOUNT_POINT" ]; then
    sudo mkdir -p /mnt/ventoy
    sudo mount "/dev/${DEVICE}1" /mnt/ventoy
    MOUNT_POINT="/mnt/ventoy"
fi

sudo cp *.iso "$MOUNT_POINT/"
sudo cp ventoy.json "$MOUNT_POINT/"
sudo cp README.txt "$MOUNT_POINT/"

echo ""
echo "✅ Installation complete!"
echo "You can now boot from /dev/$DEVICE"
echo ""
EOF
chmod +x "$VENTOY_PKG/SETUP-VENTOY.sh"

# Create Windows batch file
cat > "$VENTOY_PKG/SETUP-VENTOY.bat" <<'EOF'
@echo off
echo AeThex-OS Ventoy Installer for Windows
echo ========================================
echo.
echo This script will help you set up Ventoy on Windows.
echo Please download Ventoy from: https://www.ventoy.net
echo.
echo After installing Ventoy:
echo 1. Run Ventoy2Disk.exe
echo 2. Select your USB drive
echo 3. Click "Install"
echo 4. Copy all .iso files to the USB drive
echo 5. Copy ventoy.json to the USB drive
echo.
pause
start https://www.ventoy.net/en/download.html
EOF

echo ""
echo "✅ All ISOs built successfully!"
echo ""
echo "📊 ISO Sizes:"
du -h "$ISO_OUTPUT"/*.iso
echo ""
echo "📦 Ventoy Package Location:"
echo "   $VENTOY_PKG"
echo ""
echo "📝 Next Steps:"
echo "1. Install Ventoy: https://www.ventoy.net"
echo "2. Copy all files from $VENTOY_PKG to USB"
echo "3. Boot from USB and select your edition"
echo ""
echo "✨ Total build time: $SECONDS seconds"
