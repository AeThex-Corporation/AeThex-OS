# AeThex Linux - Quick Start Guide

## Build and Test AeThex Linux (Proof of Concept)

This guide will help you build a bootable ISO and test it in a VM within 30 minutes.

### Prerequisites

**System Requirements:**
- Ubuntu 22.04+ or Debian-based Linux
- 20GB free disk space
- 8GB RAM (4GB for build, 4GB for VM)
- Root access (sudo)

**Required Tools:**
```bash
# Install all dependencies
sudo apt update
sudo apt install -y \
  build-essential \
  curl \
  git \
  nodejs \
  npm \
  debootstrap \
  squashfs-tools \
  xorriso \
  grub-pc-bin \
  grub-efi-amd64-bin \
  virtualbox
```

**Rust (for Tauri build):**
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env
```

### Step 1: Build the ISO

```bash
# Navigate to project directory
cd /workspaces/AeThex-OS

# Make scripts executable
chmod +x script/*.sh

# Build ISO (takes 10-15 minutes)
sudo bash script/build-linux-iso.sh
```

**What this does:**
1. Bootstraps Ubuntu 24.04 base system
2. Installs required packages (X server, desktop manager)
3. Builds your Tauri desktop app
4. Configures auto-login and system services
5. Creates bootable ISO image

**Output:**
- ISO: `~/aethex-linux-build/AeThex-Linux-1.0.0-alpha-amd64.iso`
- Size: ~2-4GB
- Checksum: `~/aethex-linux-build/AeThex-Linux-1.0.0-alpha-amd64.iso.sha256`

### Step 2: Test in Virtual Machine

```bash
# Launch VirtualBox VM with the ISO
sudo bash script/test-in-vm.sh
```

**What this does:**
1. Creates new VirtualBox VM (4GB RAM, 20GB disk)
2. Attaches the AeThex Linux ISO
3. Boots the VM
4. Auto-logs in to AeThex Desktop

**VM Login:**
- Username: `aethex`
- Password: `aethex`

**Test Checklist:**
- [ ] System boots to desktop (no errors)
- [ ] Window manager works (drag windows)
- [ ] Terminal opens (`Ctrl+Alt+T`)
- [ ] File manager shows directories
- [ ] Applications menu appears
- [ ] Network connects automatically

### Step 3: Create Bootable USB (Optional)

```bash
# Check available USB drives
lsblk

# Write ISO to USB (replace /dev/sdX with your device)
sudo bash script/create-usb.sh /dev/sdX
```

⚠️ **WARNING:** This erases all data on the USB drive!

### Step 4: Boot on Real Hardware

1. Insert USB drive
2. Restart computer
3. Press `F12`, `F2`, or `Del` (depending on manufacturer) to access boot menu
4. Select USB drive
5. AeThex Linux will boot directly to desktop

## Configuration Files

All configuration files are in `configs/`:

```
configs/
├── grub/                      # Bootloader configuration
│   ├── grub.cfg              # Boot menu
│   └── themes/aethex/        # Visual theme
├── lightdm/                  # Display manager
│   └── lightdm.conf          # Auto-login config
├── systemd/                  # System services
│   ├── aethex-desktop.service    # Main desktop
│   └── aethex-kernel.service     # OS Kernel API
└── xsession/                 # Desktop session
    └── aethex.desktop        # Session definition
```

## Troubleshooting

### Build fails at Tauri step
```bash
# Install Rust dependencies for your distro
# Ubuntu/Debian:
sudo apt install libwebkit2gtk-4.1-dev libssl-dev libayatana-appindicator3-dev librsvg2-dev

# Then retry build
cd /workspaces/AeThex-OS
npm run tauri:build
```

### VM won't boot
```bash
# Check if ISO was created successfully
ls -lh ~/aethex-linux-build/*.iso

# Verify checksum
sha256sum -c ~/aethex-linux-build/*.sha256

# Try rebuilding with clean slate
sudo rm -rf ~/aethex-linux-build
sudo bash script/build-linux-iso.sh
```

### Desktop doesn't auto-login
- Default credentials: `aethex` / `aethex`
- Check `/etc/lightdm/lightdm.conf` for auto-login settings
- Verify service is enabled: `systemctl status lightdm`

### Black screen after boot
- Add `nomodeset` to boot parameters (press 'e' in GRUB menu)
- Or try: `quiet splash nomodeset`

## Customization

### Change Default User
Edit in `script/build-linux-iso.sh`:
```bash
# Replace 'aethex' with your username
useradd -m -s /bin/bash YOUR_USERNAME
echo 'YOUR_USERNAME:YOUR_PASSWORD' | chpasswd
```

### Add Pre-installed Software
Add to package list in `script/build-linux-iso.sh`:
```bash
apt-get install -y \
  # ... existing packages ...
  firefox \
  gimp \
  vlc
```

### Change Branding
- Logo: Replace `configs/grub/themes/aethex/logo.png`
- Colors: Edit `configs/grub/themes/aethex/theme.txt`
- Boot text: Edit `configs/grub/grub.cfg`

## Next Steps

### Distribution (Public Release)
1. Host ISO on CDN or GitHub Releases
2. Create installation documentation
3. Set up update repository (apt/PPA)
4. Add installer wizard (Calamares)

### Production Hardening
- [ ] Enable secure boot signing
- [ ] Add encrypted home directory option
- [ ] Configure firewall rules
- [ ] Set up automatic security updates
- [ ] Add AppArmor/SELinux profiles

### Advanced Features
- [ ] Live USB persistence (save data between boots)
- [ ] Network install option (PXE boot)
- [ ] Multi-language support
- [ ] Custom kernel with optimizations
- [ ] Hardware driver auto-detection

## Resources

- Full documentation: [AETHEX_LINUX.md](AETHEX_LINUX.md)
- Tauri setup: [TAURI_SETUP.md](TAURI_SETUP.md)
- Project overview: [README.md](README.md)

## Support

For issues or questions:
1. Check existing documentation
2. Review system logs: `journalctl -xe`
3. Test in VM before real hardware
4. File issue on GitHub repository

---

**Total Time to Bootable ISO:** ~30-45 minutes
**ISO Size:** 2-4 GB
**Minimum RAM:** 2GB (4GB recommended)
**Minimum Disk:** 10GB (20GB recommended)
