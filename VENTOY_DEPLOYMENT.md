# AeThex-OS Ventoy Multi-Boot Deployment Guide

## 🎯 Overview

Ventoy allows you to create a **single bootable USB drive** containing **all 5 AeThex-OS editions**. No re-flashing needed - just copy ISOs to the USB and boot.

## 📦 What You Get

### 5 ISO Editions on One USB:

| Edition | Size | Pre-Installed Software | Use Case |
|---------|------|------------------------|----------|
| **Core** | 1.5GB | Firefox, file manager, terminal | General computing, testing |
| **Gaming** | 3.2GB | Steam, Lutris, Discord, OBS, game optimizations | Gaming, streaming, esports |
| **Dev** | 2.8GB | VS Code, Docker, Git, Node.js, Python, Rust, Go | Software development |
| **Creator** | 4.1GB | OBS, Kdenlive, GIMP, Inkscape, Blender, Audacity | Content creation, video editing |
| **Server** | 1.2GB | SSH, Docker, Nginx, PostgreSQL (headless, no GUI) | Servers, cloud deployments |

**Total Size:** ~12GB  
**Recommended USB:** 16GB or larger

## 🔧 Quick Setup (Windows)

### Option 1: Automated Script (Easiest)

```powershell
# Run as Administrator
cd C:\Users\PCOEM\AeThexOS\AeThex-OS
.\script\setup-ventoy-windows.ps1 -DownloadVentoy
```

The script will:
1. ✅ Download Ventoy automatically
2. ✅ Detect your USB drives
3. ✅ Install Ventoy to selected USB
4. ✅ Copy all 5 ISOs
5. ✅ Configure boot menu

### Option 2: Manual Setup

1. **Download Ventoy**
   ```
   https://www.ventoy.net/en/download.html
   Download: ventoy-1.0.96-windows.zip
   ```

2. **Install Ventoy to USB**
   - Extract ventoy ZIP
   - Run `Ventoy2Disk.exe` as Administrator
   - Select your USB drive
   - Click "Install"
   - ⚠️ This will **erase** the USB!

3. **Copy ISOs**
   ```powershell
   # Copy all AeThex ISOs to USB root
   Copy-Item "aethex-linux-build\AeThex-Ventoy-Package\*.iso" -Destination "E:\"
   Copy-Item "aethex-linux-build\AeThex-Ventoy-Package\ventoy.json" -Destination "E:\"
   ```

## 🐧 Quick Setup (Linux/Mac)

### Automated Script

```bash
cd ~/AeThex-OS
chmod +x script/build-all-isos.sh
sudo ./script/build-all-isos.sh

# Then follow instructions to copy to USB
cd aethex-linux-build/AeThex-Ventoy-Package
sudo ./SETUP-VENTOY.sh
```

### Manual Setup

```bash
# 1. Download Ventoy
wget https://github.com/ventoy/Ventoy/releases/download/v1.0.96/ventoy-1.0.96-linux.tar.gz
tar -xzf ventoy-*.tar.gz

# 2. Install to USB (replace /dev/sdX with your USB device)
sudo ./ventoy-*/Ventoy2Disk.sh -i /dev/sdX

# 3. Mount and copy ISOs
sudo mount /dev/sdX1 /mnt
sudo cp aethex-linux-build/AeThex-Ventoy-Package/*.iso /mnt/
sudo cp aethex-linux-build/AeThex-Ventoy-Package/ventoy.json /mnt/
sudo umount /mnt
```

## 🚀 Building the ISOs

If you need to build the ISOs from source:

```bash
cd ~/AeThex-OS

# Build all 5 editions
chmod +x script/build-all-isos.sh
sudo ./script/build-all-isos.sh

# Wait 20-40 minutes for all ISOs to build
# Output: aethex-linux-build/ventoy-isos/
```

## 🎮 Booting from USB

### Step 1: Insert USB and Restart

1. Insert USB drive
2. Restart computer
3. Press boot menu key:
   - **Dell/HP/Lenovo:** F12
   - **ASUS:** ESC or F8
   - **Acer:** F12 or F9
   - **Mac:** Hold Option/Alt
   - **Generic:** F2, F10, DEL

### Step 2: Select Ventoy Boot

You'll see:
```
╔══════════════════════════════════════╗
║       Ventoy Boot Menu               ║
╠══════════════════════════════════════╣
║ ► AeThex-Core.iso                    ║
║   AeThex-Gaming.iso                  ║
║   AeThex-Dev.iso                     ║
║   AeThex-Creator.iso                 ║
║   AeThex-Server.iso                  ║
╚══════════════════════════════════════╝
```

Use arrow keys to select, press Enter to boot.

### Step 3: First Login

**Default Credentials:**
- Username: `aethex`
- Password: `aethex`

⚠️ **Change password immediately after first login!**

```bash
passwd
# Enter new password twice
```

## 🌐 Ecosystem Connectivity

All editions automatically connect to the AeThex ecosystem:

- **Web:** https://aethex.app
- **Desktop:** Syncs with Tauri app
- **Mobile:** Syncs with iOS/Android apps
- **Real-time:** Via Supabase websockets

### First Boot Checklist

1. ✅ Change default password
2. ✅ Connect to WiFi/Ethernet
3. ✅ Login to AeThex account at https://aethex.app
4. ✅ Verify ecosystem sync (check for other devices)
5. ✅ Install additional software (optional)

## 🔧 Edition-Specific Features

### 🎮 Gaming Edition

**Pre-installed:**
- Steam (download games from library)
- Discord (voice/text chat)
- OBS Studio (stream to Twitch/YouTube)
- Lutris (non-Steam games)
- Wine/Proton (Windows game compatibility)

**Desktop Shortcuts:**
- Steam → Launch game client
- Discord → Launch chat
- Gaming Hub → https://aethex.app/hub/game-marketplace

**Performance:**
- GameMode enabled (automatic boost)
- Vulkan drivers configured
- 144Hz/240Hz monitor support

### 💻 Developer Edition

**Pre-installed:**
- VS Code (code editor)
- Docker (containerization)
- Git (version control)
- Node.js, npm, TypeScript
- Python 3, pip
- Rust, Cargo
- Go
- Java 17
- PostgreSQL client
- MySQL client

**Desktop Shortcuts:**
- VS Code → Open editor
- Terminal → Open shell
- Docker Desktop → Manage containers

**Pre-configured:**
- Git defaults (username: AeThex Developer)
- Rust installed via rustup
- Global npm packages (vite, tsx, @tauri-apps/cli)
- VS Code extensions (ESLint, Prettier, Rust Analyzer)

**Cloned Repo:**
```bash
~/Projects/AeThex-OS/  # Pre-cloned AeThex repo
```

### 🎨 Creator Edition

**Pre-installed:**
- OBS Studio (streaming/recording)
- Kdenlive (video editing)
- GIMP (image editing)
- Inkscape (vector graphics)
- Blender (3D modeling/animation)
- Audacity (audio editing)
- FFmpeg (video conversion)

**Desktop Shortcuts:**
- OBS Studio → Start streaming
- Kdenlive → Edit videos
- GIMP → Edit images
- Streaming Hub → https://aethex.app/hub/game-streaming

**Project Folders:**
```
~/Videos/Recordings/  # OBS recordings
~/Videos/Projects/    # Video editing projects
~/Pictures/Screenshots/
~/Music/Audio/
```

### 🖥️ Server Edition (Headless)

**No GUI** - SSH access only

**Pre-installed:**
- SSH server (enabled on boot)
- Docker + Docker Compose
- Nginx (web server)
- PostgreSQL (database)
- Node.js (runtime)
- Fail2Ban (security)
- UFW firewall (enabled)

**Open Ports:**
- 22 (SSH)
- 80 (HTTP)
- 443 (HTTPS)
- 5000 (AeThex server)

**SSH Access:**
```bash
# From another machine:
ssh aethex@<server-ip>
# Password: aethex (change immediately!)
```

**Services:**
```bash
# Check AeThex server status
sudo systemctl status aethex-server

# View logs
sudo journalctl -u aethex-server -f
```

## 🛠️ Customization

### Adding More ISOs

Ventoy supports **any** bootable ISO:

```bash
# Just copy more ISOs to USB root
cp ubuntu-24.04.iso /media/ventoy/
cp windows-11.iso /media/ventoy/
cp kali-linux.iso /media/ventoy/

# They'll all appear in boot menu
```

### Custom Boot Menu

Edit `ventoy.json` on USB:

```json
{
  "theme": {
    "display_mode": "GUI",
    "ventoy_color": "#00FFFF"
  },
  "menu_alias": [
    {
      "image": "/AeThex-Core.iso",
      "alias": "🌐 AeThex Core - Base System"
    },
    {
      "image": "/windows-11.iso",
      "alias": "🪟 Windows 11"
    }
  ]
}
```

### Persistence (Save Data)

Ventoy supports **persistence** to save changes:

```bash
# Create persistence file on USB (4GB example)
dd if=/dev/zero of=/media/ventoy/persistence.dat bs=1M count=4096
mkfs.ext4 /media/ventoy/persistence.dat

# Add to ventoy.json:
{
  "persistence": [
    {
      "image": "/AeThex-Core.iso",
      "backend": "/persistence.dat"
    }
  ]
}
```

Now changes persist across reboots!

## 📊 Verification

### Check ISO Integrity

```bash
# Windows
CertUtil -hashfile AeThex-Core.iso SHA256
# Compare with .sha256 file

# Linux/Mac
sha256sum -c AeThex-Core.iso.sha256
```

### Test in Virtual Machine

Before deploying, test ISOs in VirtualBox/VMware:

```bash
# Create VM with:
# - 4GB RAM (minimum)
# - 2 CPU cores
# - 20GB disk
# - Boot from ISO
```

## 🐛 Troubleshooting

### USB Not Booting

**Problem:** Computer doesn't detect USB  
**Solution:**
- Disable Secure Boot in BIOS
- Enable Legacy Boot / CSM
- Try different USB port (USB 2.0 ports work better)

### Ventoy Menu Not Showing

**Problem:** Boots to grub or blank screen  
**Solution:**
```bash
# Re-install Ventoy in MBR+GPT mode
sudo ./Ventoy2Disk.sh -i -g /dev/sdX
```

### ISO Won't Boot

**Problem:** Selected ISO shows error  
**Solution:**
- Verify ISO integrity (sha256sum)
- Re-download ISO
- Check USB for errors: `sudo badblocks /dev/sdX`

### Performance Issues

**Problem:** Slow/laggy interface  
**Solution:**
- Use USB 3.0 port (blue port)
- Enable DMA in BIOS
- Close background apps during boot

## 📚 Additional Resources

- **Ventoy Documentation:** https://www.ventoy.net/en/doc_start.html
- **AeThex Docs:** https://docs.aethex.app
- **Discord Support:** https://discord.gg/aethex
- **GitHub Issues:** https://github.com/aethex/AeThex-OS/issues

## 🎯 Use Cases

### 1. Conference/Demo USB

Carry all AeThex editions to showcase different features:
- **Core** for general demo
- **Gaming** for performance demo
- **Dev** for coding workshops
- **Creator** for content creation demo

### 2. Personal Multi-Tool

One USB for all scenarios:
- Gaming at friend's house
- Development at work
- Content creation at home
- Server deployment at office

### 3. Tech Support

Boot any machine to diagnose/repair:
- Boot to Developer edition → access tools
- Boot to Core → browser-based fixes
- Boot to Server → network diagnostics

### 4. Education

Students/teachers can:
- Boot school computers to Dev edition
- No installation needed
- Personal environment everywhere
- Assignments saved to USB persistence

## 🚀 Future Editions (Planned)

- **AeThex-Medical.iso** - Healthcare tools (HIPAA compliant)
- **AeThex-Education.iso** - Educational software for schools
- **AeThex-Finance.iso** - Secure banking/trading environment
- **AeThex-Crypto.iso** - Blockchain development tools

All will work with same Ventoy USB!

---

**Built with ❤️ by the AeThex Team**  
*Version 1.0.0 - January 2026*
