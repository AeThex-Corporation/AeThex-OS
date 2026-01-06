# AeThex Linux - Bootable OS Distribution

## What Is AeThex Linux?

AeThex Linux is a **custom Linux distribution** that boots directly into the AeThex-OS desktop environment. Instead of accessing your CloudOS through a browser, it becomes the primary operating system interface.

### Three Deployment Modes

| Mode | Description | Use Case |
|------|-------------|----------|
| **Web** | Browser-based, hosted on Railway | Public access, multi-tenant SaaS |
| **Desktop** | Tauri app (Windows/Mac/Linux) | Single-user, native app |
| **Linux Distro** | Bootable OS replacing Windows/Mac | Full system replacement, kiosks, custom hardware |

## Architecture

```
┌─────────────────────────────────────────┐
│         AeThex Linux Boot Flow          │
└─────────────────────────────────────────┘

Hardware Power On
    ↓
BIOS/UEFI Firmware
    ↓
GRUB Bootloader (AeThex branded)
    ↓
Linux Kernel 6.x (Ubuntu 24.04 LTS base)
    ↓
Systemd Init System
    ↓
├─ Network Manager
├─ Audio (PulseAudio/PipeWire)
├─ Display Server (Wayland/X11)
└─ AeThex Session Manager
    ↓
┌──────────────────────────────────────┐
│   AeThex Desktop Environment (DE)     │
├──────────────────────────────────────┤
│  Window Manager    [Your React UI]   │
│  File Manager      [Already built]   │
│  Terminal          [Already built]   │
│  Settings          [Already built]   │
│  Projects App      [Already built]   │
│  Messaging         [Already built]   │
│  Marketplace       [Already built]   │
└──────────────────────────────────────┘
    ↓
Hardware Access (Full system control)
```

## Technical Stack

### Base System
- **Distribution Base:** Ubuntu 24.04 LTS (Noble Numbat)
- **Kernel:** Linux 6.8+ 
- **Init System:** systemd
- **Display Server:** Wayland (primary) / X11 (fallback)
- **Package Manager:** apt + snap (optional)

### Desktop Layer
- **Shell:** Tauri + React (your existing codebase)
- **Window Manager:** Custom (your drag/drop windows)
- **Compositor:** Mutter or custom Wayland compositor
- **File Manager:** Your existing File Manager component
- **Terminal:** Your existing Terminal component

### System Services
```bash
/etc/systemd/system/
├── aethex-desktop.service      # Main DE launcher
├── aethex-kernel.service       # OS Kernel (entitlements)
├── aethex-network.service      # Network/sync
└── aethex-updater.service      # Auto-updates
```

## Build Process

### Phase 1: Base System Setup

1. **Create Build Environment**
```bash
# Install build tools
sudo apt install debootstrap arch-install-scripts squashfs-tools xorriso grub-pc-bin grub-efi-amd64-bin

# Create workspace
mkdir -p ~/aethex-linux-build
cd ~/aethex-linux-build
```

2. **Bootstrap Ubuntu Base**
```bash
# Create minimal Ubuntu system
sudo debootstrap --arch=amd64 noble chroot http://archive.ubuntu.com/ubuntu/

# Chroot into system
sudo chroot chroot /bin/bash
```

3. **Install Core Packages**
```bash
# Inside chroot
apt update
apt install -y \
  linux-image-generic \
  grub-efi-amd64 \
  systemd \
  network-manager \
  pulseaudio \
  wayland-protocols \
  xwayland \
  mesa-utils \
  firmware-linux
```

### Phase 2: AeThex Desktop Integration

4. **Build Tauri Desktop App**
```bash
# From your AeThex-OS repo
cd /workspaces/AeThex-OS
npm run tauri:build

# Copy binary to build system
sudo cp src-tauri/target/release/aethex-os \
  ~/aethex-linux-build/chroot/usr/bin/aethex-desktop

# Make executable
sudo chmod +x ~/aethex-linux-build/chroot/usr/bin/aethex-desktop
```

5. **Create Desktop Session**
```bash
# Create session file
sudo tee ~/aethex-linux-build/chroot/usr/share/xsessions/aethex.desktop << 'EOF'
[Desktop Entry]
Name=AeThex OS
Comment=AeThex Desktop Environment
Exec=/usr/bin/aethex-desktop
Type=Application
DesktopNames=AeThex
X-Ubuntu-Gettext-Domain=aethex-session
EOF
```

6. **Configure Auto-Start**
```bash
# Create systemd service
sudo tee ~/aethex-linux-build/chroot/etc/systemd/system/aethex-desktop.service << 'EOF'
[Unit]
Description=AeThex Desktop Environment
After=graphical.target
Requires=graphical.target

[Service]
Type=simple
User=aethex
Environment=DISPLAY=:0
Environment=WAYLAND_DISPLAY=wayland-0
ExecStart=/usr/bin/aethex-desktop
Restart=on-failure
RestartSec=5

[Install]
WantedBy=graphical.target
EOF

# Enable service
sudo systemctl enable aethex-desktop.service
```

### Phase 3: System Configuration

7. **Create Default User**
```bash
# Inside chroot
useradd -m -s /bin/bash aethex
echo "aethex:aethex" | chpasswd
usermod -aG sudo,audio,video,plugdev aethex
```

8. **Configure Auto-Login**
```bash
# Install display manager
apt install -y lightdm

# Configure auto-login
sudo tee /etc/lightdm/lightdm.conf << 'EOF'
[Seat:*]
autologin-user=aethex
autologin-user-timeout=0
user-session=aethex
EOF
```

9. **Brand Bootloader**
```bash
# Custom GRUB theme
mkdir -p /boot/grub/themes/aethex
# (Add custom logo, colors, fonts)

# Edit /etc/default/grub
GRUB_DISTRIBUTOR="AeThex Linux"
GRUB_CMDLINE_LINUX_DEFAULT="quiet splash"
GRUB_TIMEOUT=3
GRUB_THEME="/boot/grub/themes/aethex/theme.txt"
```

### Phase 4: ISO Creation

10. **Generate ISO**
```bash
# Install Cubic (for advanced ISO building)
sudo apt-add-repository ppa:cubic-wizard/release
sudo apt update
sudo apt install cubic

# Or manual method:
cd ~/aethex-linux-build
sudo mksquashfs chroot filesystem.squashfs -comp xz
sudo mkisofs -r -V "AeThex Linux 1.0" \
  -cache-inodes -J -l \
  -b isolinux/isolinux.bin \
  -c isolinux/boot.cat \
  -no-emul-boot -boot-load-size 4 \
  -boot-info-table \
  -o AeThex-Linux-1.0-amd64.iso \
  iso/
```

## Distribution Files

```
AeThex-Linux-1.0/
├── aethex-linux-1.0-amd64.iso       # Bootable ISO (2-4 GB)
├── aethex-linux-1.0-amd64.iso.sha256  # Checksum
├── INSTALL.md                       # Installation guide
└── LICENSE                          # GPL v3 + Commercial dual-license
```

## Installation Methods

### Method 1: USB Boot (Live System)
```bash
# Create bootable USB
sudo dd if=AeThex-Linux-1.0-amd64.iso of=/dev/sdX bs=4M status=progress
```

### Method 2: Virtual Machine
```bash
# VirtualBox
VBoxManage createvm --name "AeThex Linux" --ostype Ubuntu_64 --register
VBoxManage modifyvm "AeThex Linux" --memory 4096 --vram 128
VBoxManage storagectl "AeThex Linux" --name "SATA" --add sata
VBoxManage storageattach "AeThex Linux" --storagectl "SATA" --port 0 --device 0 --type dvddrive --medium AeThex-Linux-1.0-amd64.iso
```

### Method 3: Dual Boot (Alongside Windows)
1. Create partition (GParted or Windows Disk Manager)
2. Boot from USB
3. Run installer (Ubiquity/Calamares)
4. GRUB automatically detects Windows

### Method 4: Full Installation (Replace OS)
- Boot from USB
- Select "Erase disk and install AeThex Linux"
- Complete installation wizard

## Features Unique to AeThex Linux

### System-Level Integration
```typescript
// Full hardware access (not available in web/desktop modes)
- Direct GPU access for 3D acceleration
- Raw disk I/O for file operations
- Kernel module loading for custom drivers
- System service management (systemctl)
- Network configuration (NetworkManager API)
```

### Offline-First
```typescript
// Works completely offline
- Local database (SQLite instead of Supabase)
- Local authentication (PAM integration)
- Cached assets and apps
- Sync when network available
```

### Performance
```
Metric              | Web    | Desktop | Linux
--------------------|--------|---------|-------
Boot Time           | N/A    | 3-5s    | 10-15s
Memory Usage        | 200MB  | 150MB   | 300MB (full OS)
Disk Space          | 0      | 100MB   | 2-4GB (full system)
Startup App Launch  | 1-2s   | <1s     | <500ms
```

## Customization Options

### Minimal Edition (Kiosk Mode)
- 800MB ISO
- No package manager
- Read-only root filesystem
- Purpose-built for single-use devices

### Developer Edition
- Pre-installed: Node.js, Python, Rust, Docker
- VS Code (or VSCodium)
- Git, build tools
- Full package manager

### Enterprise Edition
- Active Directory integration
- Centralized management (Ansible/Puppet)
- Pre-configured VPN
- Compliance tools (SELinux)

## Maintenance & Updates

### Update Channels
```bash
# Stable (quarterly)
sudo apt update && sudo apt upgrade

# Rolling (weekly)
sudo add-apt-repository ppa:aethex/rolling

# Nightly (for developers)
sudo add-apt-repository ppa:aethex/nightly
```

### Auto-Update Service
```typescript
// /usr/bin/aethex-updater
- Check for updates daily
- Download in background
- Prompt user for installation
- Rollback on failure
```

## Security Model

### Sandboxing
- Snap/Flatpak for untrusted apps
- AppArmor profiles for system services
- SELinux (optional, enterprise)

### Authentication
- PAM integration for system login
- Biometric support (fingerprint/face)
- Hardware keys (YubiKey, FIDO2)
- Dual-mode: local + cloud sync

## Build Scripts

Ready to generate build automation scripts? I can create:

1. **`script/build-linux-iso.sh`** - Full automated ISO builder
2. **`script/test-in-vm.sh`** - Automated VM testing
3. **`docs/LINUX_BUILD_GUIDE.md`** - Step-by-step instructions
4. **`configs/branding/`** - GRUB theme, plymouth splash, wallpapers

## Next Steps

Choose your path:

### Path A: Proof of Concept (1 day)
- Basic Ubuntu + Tauri app
- Manual boot to desktop
- VM testing only

### Path B: Distributable ISO (1 week)
- Automated build scripts
- Branded installer
- Basic hardware support

### Path C: Full Distribution (1-3 months)
- Custom repositories
- Update infrastructure
- Hardware certification
- Community/documentation

**Which path interests you?**
