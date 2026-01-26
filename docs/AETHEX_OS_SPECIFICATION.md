# AeThex OS — Operating System Specification (Device Layer)

*A bootable Linux-based operating system for AeThex hardware and developer devices. This document defines scope, architecture, security posture, release process, and supported targets.*

---

## 0. Document Control

| Property | Value |
|----------|-------|
| **Owner** | AeThex Corporation - Platform Engineering |
| **Status** | Draft |
| **Version** | 0.1.0 |
| **Last Updated** | January 6, 2026 |
| **Repository** | [AeThex-Corporation/AeThex-OS](https://github.com/AeThex-Corporation/AeThex-OS) |

### Changelog

| Date | Version | Changes |
|------|---------|---------|
| 2026-01-06 | 0.1.0 | Initial specification document created |

---

## 1. Definition and Scope

**AeThex OS is a bootable operating system for AeThex devices and developer hardware.** It is a device-layer system responsible for boot, drivers, security posture, persistence, and local execution.

**AeThex OS is not AeThex Platform.** Platform refers to AeThex services, APIs, identity systems, and applications that can run on multiple operating systems (including AeThex OS).

**AeThex OS is not AeThex Ecosystem.** Ecosystem refers to the organizational, community, and product universe surrounding AeThex.

**Scope of this document:** kernel/boot, installation, persistence, base distro strategy, default stack, security model, build/release.

### What AeThex OS Is

- **A complete bootable Linux distribution** based on Ubuntu LTS
- **Device-layer operating system** managing boot, drivers, security, and local execution
- **Hardware abstraction layer** providing consistent platform for AeThex applications
- **Foundation for kiosk, embedded, and specialized device deployments**
- **Reference implementation** for AeThex Platform integration at OS level

### What AeThex OS Is Not

- ❌ Not a web service or cloud platform
- ❌ Not AeThex Platform (services, APIs, identity)
- ❌ Not AeThex Ecosystem (organization, governance, community)
- ❌ Not an application framework or development SDK
- ❌ Not responsible for multi-tenant SaaS operations

### Relationship to Other Layers

```
┌─────────────────────────────────────────────┐
│        AeThex Ecosystem (Organization)       │
│  Governance • Community • Business Model     │
└─────────────────────────────────────────────┘
                     ↑
┌─────────────────────────────────────────────┐
│       AeThex Platform (Services Layer)       │
│  APIs • Identity • Applications • Marketplace│
└─────────────────────────────────────────────┘
                     ↑
┌─────────────────────────────────────────────┐
│     AeThex OS (Device/Operating System)      │ ← THIS DOCUMENT
│  Kernel • Boot • Drivers • Security • Local  │
└─────────────────────────────────────────────┘
                     ↑
┌─────────────────────────────────────────────┐
│              Hardware Layer                  │
│  PC • Handheld • Embedded • Dev Devices      │
└─────────────────────────────────────────────┘
```

---

## 2. Product Intent

### Target Users (Personas)

1. **System Integrator**
   - Deploys AeThex OS on custom hardware
   - Needs reliable, reproducible boot process
   - Values hardware compatibility matrix

2. **Kiosk/Embedded Developer**
   - Runs single-purpose AeThex applications
   - Needs locked-down, auto-booting system
   - Values persistence and recovery options

3. **Internal Developer**
   - Tests AeThex Platform integration
   - Needs quick iteration on OS features
   - Values live boot with persistence

4. **Power User**
   - Wants full AeThex experience on dedicated hardware
   - Needs dual-boot or full installation
   - Values performance and customization

### Primary Use Cases

- ✅ **Kiosk Mode**: Auto-boot to AeThex application in fullscreen
- ✅ **Development Device**: Live USB with persistent storage for testing
- ✅ **Embedded Hardware**: Custom device running AeThex OS as primary OS
- ✅ **Demo/Trade Show**: Portable live system showcasing AeThex Platform

### Non-Goals

- ❌ General-purpose desktop OS competing with Ubuntu/Fedora
- ❌ Server OS for cloud deployment (use containerized Platform instead)
- ❌ Mobile phone OS (see separate mobile builds)
- ❌ Real-time OS or mission-critical industrial control

### Design Principles

1. **Stability over bleeding-edge**: LTS base, conservative updates
2. **Minimal by design**: Only OS essentials, Platform apps separate
3. **Reproducible builds**: ISO builds identical given same inputs
4. **Security-first**: Encryption defaults, secure boot ready
5. **Hardware compatibility**: Broad x86_64 and ARM64 support

---

## 3. Supported Targets

### Hardware Classes

| Class | Description | Status |
|-------|-------------|--------|
| **PC (x86_64)** | Standard desktop/laptop hardware | ✅ Stable |
| **Handheld (x86_64)** | Steam Deck, AYANEO, GPD devices | 🔄 Testing |
| **ARM64 SBC** | Raspberry Pi 4/5, other dev boards | 🔄 Planned |
| **Embedded x86** | Intel NUC, Mini-ITX kiosk systems | ✅ Stable |
| **Development Phone** | Prototype via Capacitor/Tauri | 🔄 Testing |

### CPU Architectures

| Architecture | Support Level | Notes |
|--------------|---------------|-------|
| `x86_64` (amd64) | ✅ Tier 1 | Primary target, fully tested |
| `arm64` (aarch64) | 🔄 Tier 2 | Planned for Pi and handheld devices |
| `armhf` | ❌ Not supported | Legacy 32-bit ARM |
| `i386` | ❌ Not supported | Legacy 32-bit x86 |

### GPU/Display Expectations

- **Minimum**: VESA/framebuffer console (text mode)
- **Recommended**: OpenGL 3.3+ or Vulkan 1.1+ for desktop UI
- **Tested**: Intel integrated, AMD, NVIDIA (nouveau/proprietary)
- **Wayland**: Preferred, X11 fallback available

### Minimum Specifications

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| **CPU** | 2 cores, 1.5 GHz | 4 cores, 2.5 GHz+ |
| **RAM** | 2 GB | 4 GB+ |
| **Storage** | 16 GB | 32 GB+ (SSD preferred) |
| **Network** | None (offline mode) | Ethernet or WiFi |
| **Display** | 1024×768 | 1920×1080+ |

---

## 4. Base Distribution Strategy

### Upstream Base

**Ubuntu 24.04 LTS (Noble Numbat)**

**Rationale:**
- 5-year support cycle (until April 2029)
- Large hardware compatibility database
- Well-documented debootstrap process
- Familiar to developers
- Strong security update process

**Alternative Evaluated:**
- Debian Stable: Longer support, but slower hardware enablement
- Arch: Rolling release incompatible with stability goals
- Fedora: Too short support cycle (13 months)

### Release Channel Model

| Channel | Base | Update Frequency | Stability | Audience |
|---------|------|------------------|-----------|----------|
| **Stable** | Ubuntu LTS | Security only | Highest | Production deployments |
| **Beta** | Ubuntu LTS + backports | Monthly | Medium | Early adopters, testing |
| **Nightly** | Rolling from main branch | Daily | Lowest | Developers only |

### Update Mechanism

**Current (v0.1):** Manual ISO re-flash
- Simple, deterministic
- No state corruption risk
- Good for embedded/kiosk

**Planned (v0.5):** Image-based updates
- OSTree or similar atomic update system
- Rollback on failure
- OTA updates for connected devices

**Not Planned:** Traditional package-based updates (apt)
- Too complex for managed appliance model
- State drift over time
- Harder to reproduce issues

---

## 5. Boot and Installation

### Bootloaders

**GRUB 2 (UEFI mode)**
- EFI boot for modern systems
- Secure Boot ready (signature pending)
- Branded boot menu with AeThex theme

**ISOLINUX (Legacy/ISO boot)**
- BIOS boot compatibility
- Used for live USB creation
- Fallback for older hardware

**Current Status:** Both bootloaders configured and working (see Appendix A)

### Boot Modes

```
┌─────────────────────────────────────────┐
│          AeThex OS Boot Flow            │
└─────────────────────────────────────────┘

Power On
    ↓
BIOS/UEFI Firmware
    ↓
Bootloader (GRUB/ISOLINUX)
    ↓
┌─────────────────┬─────────────────┬──────────────┐
│   Live Mode     │  Installed Mode │  Safe Mode   │
│  (read-only)    │  (read-write)   │ (nomodeset)  │
└─────────────────┴─────────────────┴──────────────┘
```

### Live Boot

**Technology:** Casper-style live boot (Ubuntu standard)
- Boots from ISO/USB without installation
- SquashFS compressed root filesystem
- Optional persistence overlay (see Persistence Model)
- RAM-based temporary filesystem changes

**Use Cases:**
- Demo systems
- Development/testing
- Hardware compatibility testing
- Recovery environment

### Persistence Model

**Casper Persistent Mode** (v0.1 implementation)
- Creates `casper-rw` file on USB boot media
- Stores user changes across reboots
- Configurable size (default: 4 GB)
- Lives alongside live ISO

**Limitations:**
- File-based, can corrupt on unclean shutdown
- Limited to FAT32 size constraints (4 GB max file)
- Not suitable for production use

**Future: OverlayFS Persistent** (v0.5 planned)
- Dedicated partition for persistence
- More robust, no file size limits
- Better performance

**Full Installation** (v1.0 planned)
- Traditional partitioned install to disk
- Full read-write system
- Standard Linux filesystem layout

### Installation Modes

| Mode | Status | Description |
|------|--------|-------------|
| **Live Only** | ✅ v0.1 | No installation, run from USB |
| **Live + Persistence** | ✅ v0.1 | Save changes to USB |
| **Automated Install** | 🔄 v0.5 | One-click install to disk |
| **Manual Install** | 🔄 v1.0 | Partition control, dual-boot |

### Recovery Mode

**Safe Mode (nomodeset)**
- Disables GPU acceleration
- Uses VESA framebuffer
- For hardware compatibility issues
- Accessible from boot menu

**Future Recovery Shell:**
- Minimal busybox environment
- Filesystem repair tools
- Backup/restore utilities

---

## 6. Filesystem and Persistence

### Partition Layout (Full Install, v1.0)

```
/dev/sda1   512 MB   EFI System Partition (FAT32)
/dev/sda2    32 GB   Root filesystem (ext4, read-only)
/dev/sda3     8 GB   /home (ext4, encrypted)
/dev/sda4   <rest>   /data (ext4, encrypted, user data)
```

**Rationale:**
- Separate `/home` allows root OS updates without data loss
- `/data` for AeThex Platform application data
- Read-only root prevents accidental system corruption

### Encryption Policy

| Partition | Encryption | Key Management |
|-----------|------------|----------------|
| EFI | ❌ None | Required by spec |
| Root | ❌ None | Integrity via dm-verity (future) |
| /home | ✅ LUKS2 | User password |
| /data | ✅ LUKS2 | TPM 2.0 + recovery key |

### Backup/Restore Strategy

**v0.1 (Live Mode):**
- Manual file copy from persistence overlay
- No automatic backup

**v0.5 (Installed Mode):**
- `/home` and `/data` snapshot via Btrfs subvolumes
- Daily incremental backups
- User-initiated full backup to external media

**v1.0:**
- Optional cloud sync integration (via AeThex Platform)
- Encrypted backup archives

### User State Portability

**Goal:** User can move AeThex OS installation between devices

**Implementation (v1.0):**
- User profile stored in `/home/aethex/.aethex-profile`
- Configuration synced via AeThex Platform (optional)
- Device-agnostic settings (no hardware-specific config in user dir)

---

## 7. System Architecture

### Kernel Strategy

**Base:** Ubuntu mainline kernel (6.8+ for 24.04 LTS)

**Customization Level:** Minimal
- Use Ubuntu kernel configs
- Add kernel modules for specific hardware as needed
- No custom patches (upstream everything)

**Update Policy:**
- Follow Ubuntu kernel updates for LTS (HWE stack)
- Security updates within 48 hours
- Major version bumps only with LTS point releases

### Init System

**systemd** (Ubuntu default)
- Standard for modern Linux distributions
- Well-documented, widely supported
- Integrated with security features (systemd-homed, etc.)

### Services Layout

```
systemd
├── multi-user.target (default)
│   ├── NetworkManager.service
│   ├── systemd-resolved.service
│   ├── aethex-session-manager.service (custom)
│   └── dbus.service
│
├── graphical.target
│   ├── lightdm.service (display manager)
│   └── aethex-desktop.service (custom)
│
└── emergency.target (recovery)
```

**Custom Services:**
- `aethex-session-manager.service`: Manages AeThex Platform connection
- `aethex-desktop.service`: Launches AeThex desktop environment
- `aethex-mobile-server.service`: Mobile app server (if applicable)

### Hardware Abstraction Plan

**Current:** Linux kernel + standard drivers
- udev for device management
- Mesa for GPU (open-source)
- PipeWire for audio
- NetworkManager for networking

**Future (v1.0):** AeThex HAL (Hardware Abstraction Layer)
- Unified API for sensor access (for handheld devices)
- Battery/power management hooks
- Device-specific calibration (controllers, displays)

### Logging/Telemetry Approach

**Logging:**
- systemd journal (local only)
- Rotated daily, 7-day retention
- No external shipping by default

**Telemetry (opt-in, v1.0):**
- Anonymous hardware compatibility reports
- Crash dumps (with user consent)
- Sent to AeThex Platform telemetry endpoint
- Full transparency: user can inspect before sending

**Privacy:**
- No telemetry in live mode
- Installed mode: opt-in during setup
- User can disable anytime
- No personal data collected

---

## 8. Security Model

### Threat Model

**What we defend against:**
- ✅ Unauthorized local access (disk encryption)
- ✅ Network-based attacks (firewall, minimal services)
- ✅ Malicious applications (sandboxing, future)
- ✅ Boot-time tampering (secure boot, future)

**What we do NOT defend against:**
- ❌ State-level adversaries (not a hardened OS)
- ❌ Physical access with unlimited time (evil maid attacks)
- ❌ Side-channel attacks (Spectre/Meltdown mitigations via kernel)

**Risk Tolerance:** Standard consumer/developer device security

### Secure Boot Posture

**Current (v0.1):** Not enabled
- GRUB unsigned, boots on any UEFI system
- Development phase, signing infrastructure not ready

**Planned (v0.5):**
- Sign GRUB bootloader with AeThex key
- Sign kernel with Ubuntu key (already done)
- Enroll AeThex key in UEFI (user action required)

**Challenge:** Balance security with user control (no Microsoft-style lockdown)

### Encryption Defaults

| Data Type | Default | Rationale |
|-----------|---------|-----------|
| Live mode | ❌ None | Temporary, no persistent data |
| /home | ✅ LUKS2 | User documents, SSH keys, etc. |
| /data | ✅ LUKS2 | AeThex app data, sensitive |
| Root | ❌ None | Public OS files, verified via checksum |

**Key Derivation:** Argon2id (LUKS2 default)

### App Sandboxing Model

**Current (v0.1):** None
- Applications run as user, standard Linux permissions
- No mandatory access control (AppArmor disabled for simplicity)

**Planned (v0.5):**
- Flatpak for third-party apps (sandboxed by default)
- AppArmor profiles for AeThex system services
- Restrict network access per-app

**v1.0:**
- Wayland isolates GUI apps (no X11 keylogging)
- Seccomp filters for system calls
- Landlock LSM for filesystem isolation

### Secrets Management

**User Secrets:**
- SSH keys: `~/.ssh/` (encrypted via /home)
- GPG keys: `~/.gnupg/` (encrypted via /home)
- Browser passwords: Firefox/Chrome stores (encrypted via /home)

**System Secrets:**
- No hardcoded API keys in OS image
- AeThex Platform credentials: stored in `/data/aethex-platform/` (encrypted)
- TPM 2.0 for sealing disk encryption keys (v1.0)

### Patch Management SLAs

| Severity | SLA | Delivery |
|----------|-----|----------|
| **Critical** (RCE, privilege escalation) | 24 hours | Nightly + Beta + Stable |
| **High** (DoS, info leak) | 7 days | Beta + Stable |
| **Medium** | 30 days | Beta (next cycle) |
| **Low** | Best-effort | Nightly only |

**Process:**
1. Ubuntu security team publishes advisory
2. AeThex validates patch (automated tests)
3. Publish updated ISO + OTA (v0.5+)
4. Notify users via AeThex Platform (if connected)

---

## 9. Networking and Identity (OS Layer)

### Network Manager Standard

**NetworkManager** (Ubuntu default)
- GUI: `nm-applet` (system tray)
- CLI: `nmcli`, `nmtui`
- Supports: Ethernet, WiFi, VPN, mobile broadband

**Configuration:**
- System connections: `/etc/NetworkManager/system-connections/`
- User connections: stored per-user in encrypted /home
- Default: DHCP for Ethernet/WiFi

### VPN Support

**Built-in:**
- OpenVPN (via `network-manager-openvpn`)
- WireGuard (via `network-manager-wireguard`)
- IPSec (via `network-manager-strongswan`)

**AeThex-Specific (v1.0):**
- Optional AeThex VPN integration (if Platform provides VPN)
- Zero-config connection to AeThex network
- Requires user opt-in

### Optional AeThex Identity Hooks (Strict Boundary)

**Design Principle:** OS does NOT require AeThex Platform

**Optional Integration:**
- User can link OS installation to AeThex Passport (identity)
- Benefits:
  - Cloud sync of settings/preferences
  - Remote device management (wipe, lock)
  - Marketplace app delivery
- Mechanism:
  - Separate `aethex-platform-agent` package (not installed by default)
  - User installs and authenticates via browser OAuth flow

**Boundary:**
- OS boots and functions fully offline
- No telemetry without opt-in
- No "phone home" by default

### Device Enrollment Concept (If Any)

**v1.0 (Optional):**
- Organizational device enrollment (for enterprise)
- MDM-style management via AeThex Platform
- Policies:
  - Force encryption
  - Require VPN for network access
  - Push applications
  - Remote wipe
- User-owned devices: enrollment optional
- Organization-owned devices: enrollment enforced via setup wizard

---

## 10. Default Software Stack (OS Only)

### Desktop Environment (or Headless)

**Current (v0.1):**
- **Xfce 4.18** (lightweight, stable)
- **LightDM** (display manager, auto-login)
- **Firefox** (kiosk mode for AeThex Platform access)

**Rationale:**
- Xfce: Low resource usage, works on old hardware
- Not GNOME: Too heavy, complex dependencies
- Not KDE Plasma: Also heavy, overkill for kiosk use

**Future (v1.0):**
- Custom AeThex DE based on React (similar to Tauri app)
- Wayland compositor (wlroots-based)
- Minimal window management, focuses on AeThex apps

### Core Utilities

| Category | Package | Purpose |
|----------|---------|---------|
| **File Manager** | Thunar (Xfce default) | Browse /home, /data |
| **Terminal** | xfce4-terminal | CLI access |
| **Text Editor** | Mousepad | Quick edits, logs |
| **Archive Manager** | file-roller | .zip, .tar.gz |
| **Image Viewer** | ristretto | PNG/JPEG preview |
| **PDF Viewer** | evince | Documentation |
| **Network Tools** | NetworkManager, nmcli | WiFi setup |

**Not Included:**
- ❌ LibreOffice (too heavy, use web apps)
- ❌ Email client (use webmail)
- ❌ Media players (use web-based)

### Developer Tooling Baseline

**Included by default:**
- `git` (version control)
- `curl`, `wget` (API testing)
- `nodejs` 20.x, `npm` (for AeThex Platform apps)
- `python3` (system tools, scripting)
- `vim` / `nano` (CLI editing)
- `ssh`, `scp` (remote access)

**Not Included (user installs):**
- Compilers (gcc, rust, go)
- IDEs (VSCode, etc.)
- Docker/Podman (use AeThex Platform containers)

### Drivers and Firmware Approach

**Strategy:** Use Ubuntu's hardware enablement
- `linux-firmware` package (comprehensive)
- Automatic driver detection via `ubuntu-drivers`
- Proprietary drivers opt-in (NVIDIA, WiFi)

**Custom Additions (v1.0):**
- Handheld device drivers (Steam Deck controls, etc.)
- AeThex-specific hardware support (if custom devices)

---

## 11. AeThex OS UX/Branding

### Boot Branding

**GRUB Theme:**
- Location: `/boot/grub/themes/aethex/`
- Colors: Dark background, AeThex cyan/green accents
- Logo: AeThex logo (PNG, 256×256)
- See: [configs/grub/grub.cfg](../configs/grub/grub.cfg)

**ISOLINUX (Live Boot):**
- Text-mode menu
- AeThex ASCII art header
- Cyan text on black background

### Login/Lock Screen

**LightDM Theme (v0.1):**
- Default Ubuntu theme (temporary)
- Auto-login to `aethex` user (kiosk mode)

**Custom Theme (v0.5):**
- Full-screen AeThex branding
- Minimal login form
- Optional: QR code for mobile authentication

### Default Wallpaper/Theme Constraints

**Wallpaper:**
- Dark theme (black or dark gray)
- Subtle AeThex logo in corner
- No distracting imagery (focus on apps)

**GTK/Qt Theme:**
- Dark mode preferred
- Accent color: AeThex cyan (`#00FFCC`)
- System fonts: Ubuntu Sans / Roboto

### Device Naming Conventions

**Hostname Pattern:**
```
aethex-<type>-<random>
```

Examples:
- `aethex-desktop-a3f9`
- `aethex-kiosk-7b21`
- `aethex-dev-c4d8`

**Benefits:**
- Easily identify AeThex devices on network
- Random suffix prevents enumeration
- Type prefix for troubleshooting

---

## 12. Build System and Release Engineering

### Build Pipeline (CI)

**Current:** GitLab CI (`.gitlab-ci.yml`)

**Stages:**
1. **Validate:** Check dependencies, lint scripts
2. **Build Client:** `npm run build` (Vite)
3. **Build ISO:** `script/build-linux-iso.sh` (requires root, Docker)
4. **Test ISO:** Boot in QEMU, smoke tests
5. **Publish Artifacts:** Upload ISO to GitLab releases

**Build Environment:**
- Docker image: `ubuntu:24.04`
- Build time: ~60-90 minutes
- Disk usage: ~10 GB

**Security:**
- Build server: trusted GitLab runners only
- No third-party code execution
- Reproducible builds (same input = same output)

### Artifact Outputs

| Artifact | Format | Use Case |
|----------|--------|----------|
| **Live ISO** | `.iso` (hybrid) | USB flash, CD/DVD, VM |
| **IMG (future)** | `.img` (raw disk) | Direct dd to device |
| **OTA (future)** | `.ostree` or `.delta` | Incremental updates |

### Signing Keys + Key Custody

**Current (v0.1):** No signing
- ISOs are unsigned
- No chain of trust

**Planned (v0.5):**
- **Code Signing Key:** RSA 4096-bit, ECDSA P-384 backup
- **Usage:** Sign GRUB, kernel modules, ISOs
- **Custody:**
  - Master key: Hardware security module (HSM) or YubiKey
  - Build key: Derived, stored in CI secrets
  - Revocation: Published to AeThex Platform
- **Verification:** Users can check ISO signature with public key

### Versioning Scheme

**Format:** `MAJOR.MINOR.PATCH-TAG`

Examples:
- `0.1.0-dev` (initial dev preview)
- `0.5.0-beta` (beta testing)
- `1.0.0` (stable release)
- `1.0.1` (security patch)

**Semantic Versioning:**
- MAJOR: Breaking changes (new install required)
- MINOR: New features (backward compatible)
- PATCH: Bug fixes, security updates
- TAG: `dev`, `beta`, `rc1`, (none for stable)

### Release Checklist

**Before Release:**
- [ ] All CI tests pass
- [ ] Manual boot test on 3+ hardware types
- [ ] Security audit (no hardcoded secrets)
- [ ] Changelog updated
- [ ] Version bumped in all configs
- [ ] ISO signed (v0.5+)

**Release Day:**
- [ ] Tag Git commit: `git tag v1.0.0`
- [ ] Trigger CI build
- [ ] Download artifacts, verify signature
- [ ] Upload to CDN / release page
- [ ] Announce on AeThex Platform / Discord
- [ ] Update documentation

**Post-Release:**
- [ ] Monitor for critical bugs
- [ ] Prepare hotfix process
- [ ] Collect user feedback

---

## 13. Testing and QA

### Hardware Test Matrix

**Tier 1 (Must Pass):**
- [ ] Generic x86_64 PC (Intel CPU, integrated graphics)
- [ ] AMD CPU + AMD GPU
- [ ] NVIDIA GPU (nouveau driver)

**Tier 2 (Should Pass):**
- [ ] Steam Deck (handheld)
- [ ] Raspberry Pi 4 (ARM64)
- [ ] UEFI only (no BIOS)

**Tier 3 (Nice to Have):**
- [ ] Legacy BIOS only
- [ ] High-DPI display (4K)
- [ ] Multi-monitor setup

### Automated Tests

**Boot Tests (QEMU):**
- Boot to login screen (30s timeout)
- Auto-login to desktop (60s timeout)
- Network connectivity (ping 1.1.1.1)
- AeThex service running (check systemd status)

**Unit Tests:**
- Build scripts: syntax validation
- Config files: schema validation
- Systemd units: `systemd-analyze verify`

**Integration Tests (v0.5):**
- Install to disk (automated Ansible)
- Reboot, verify persistence
- Apply updates, verify rollback

### Smoke Test Procedure

**Manual Checklist (15 minutes):**
1. [ ] Boot from USB
2. [ ] Select "AeThex Linux" from menu
3. [ ] Desktop loads within 60 seconds
4. [ ] WiFi connects to known network
5. [ ] Firefox launches AeThex Platform
6. [ ] Terminal opens, `uname -a` works
7. [ ] File manager browses /home
8. [ ] Audio plays (speaker-test)
9. [ ] Reboot, persistence works (created file survives)
10. [ ] Shutdown completes cleanly

### Regression Policy

**Definition:** Any test that passed in previous release

**Process:**
1. All Tier 1 hardware must pass smoke tests
2. Any regression blocks release
3. If unfixable, document as known issue
4. Known issues printed during boot (motd)

**Escape Hatch:**
- Critical security fix: release with known regression
- Document workaround
- Fix in next patch release (within 7 days)

---

## 14. Governance and Contribution (OS Repo)

### Repository Structure

```
AeThex-OS/
├── client/                 # Web UI (React/Vite)
├── server/                 # Backend (Node.js)
├── shared/                 # DB schema (Drizzle)
├── migrations/             # DB migrations
├── os/                     # OS-specific files
│   ├── base/               # Base system configs
│   ├── runtimes/           # Language runtimes
│   └── shell/              # Default shell configs
├── configs/                # Bootloader, systemd
│   ├── grub/
│   ├── systemd/
│   └── lightdm/
├── script/                 # Build scripts
│   └── build-linux-iso.sh
├── docs/                   # Documentation
│   └── AETHEX_OS_SPECIFICATION.md  # ← This doc
└── .gitlab-ci.yml          # CI/CD
```

### Branch Policy

| Branch | Purpose | Protected | CI |
|--------|---------|-----------|-----|
| `main` | Stable, releasable | ✅ Yes | Full tests |
| `develop` | Integration branch | ✅ Yes | Full tests |
| `feature/*` | New features | ❌ No | Basic tests |
| `hotfix/*` | Security fixes | ❌ No | Full tests |

**Rules:**
- `main`: Require 1 approver, all tests pass
- No force-push to `main` or `develop`
- Hotfixes: can merge to `main` with post-review

### PR Standards

**Required:**
- [ ] Descriptive title (50 chars max)
- [ ] Linked issue or rationale
- [ ] Tests pass (CI green)
- [ ] No merge conflicts
- [ ] Signed commits (v0.5+)

**Review Criteria:**
- Security: No hardcoded secrets
- Style: Follow existing conventions
- Docs: Update if changing behavior
- Breaking changes: Require version bump

### Security Reporting

**Private Disclosure:**
- Email: `security@aethex.com` (create this!)
- GPG key: Published on website
- Response SLA: 48 hours

**Process:**
1. Researcher reports vuln privately
2. AeThex confirms and triages (24h)
3. Fix developed in private branch
4. Coordinated disclosure (usually 90 days)
5. Credit to researcher in changelog

### Licensing

**AeThex OS Codebase:**
- License: **MIT** (permissive)
- Rationale: Allow commercial use, forks, modifications

**Third-Party Components:**
- Ubuntu: Various (GPL, LGPL, MIT)
- Kernel: GPL-2.0
- Systemd: LGPL-2.1+
- Xfce: GPL-2.0+

**Compliance:**
- All licenses compatible with MIT
- No "copyleft" requirement for AeThex OS itself
- Redistributors must comply with upstream licenses

---

## 15. Roadmap

### v0.1 — Dev Preview (Current)

**Status:** ✅ Complete (January 2026)

**Features:**
- [x] Live USB boot (x86_64)
- [x] Casper persistence
- [x] Xfce desktop environment
- [x] Firefox kiosk mode
- [x] AeThex mobile server integration
- [x] GitLab CI build pipeline
- [x] GRUB and ISOLINUX configs

**Known Limitations:**
- No installation to disk
- No secure boot
- No encryption
- Manual flash only (no OTA)

### v0.5 — Pilot (Q2 2026)

**Goal:** Production-ready for kiosk/embedded use

**Features:**
- [ ] Automated install to disk
- [ ] LUKS2 encryption (/home, /data)
- [ ] Signed bootloader (code signing)
- [ ] OTA updates (OSTree or similar)
- [ ] Custom AeThex DE (React-based)
- [ ] ARM64 support (Raspberry Pi)
- [ ] Handheld device support (Steam Deck)
- [ ] Improved boot time (<20s to desktop)

**Testing:**
- 10+ pilot deployments
- 3+ hardware types
- 30-day stability target

### v1.0 — Stable (Q4 2026)

**Goal:** General availability for all use cases

**Features:**
- [ ] Dual-boot support (Windows/Mac alongside)
- [ ] Full installer UI (graphical)
- [ ] AeThex Platform agent (opt-in)
- [ ] Device enrollment (MDM for enterprise)
- [ ] TPM 2.0 integration (disk encryption keys)
- [ ] AppArmor + Flatpak sandboxing
- [ ] Custom hardware HAL (for AeThex devices)
- [ ] Wayland compositor (AeThex DE)
- [ ] Multi-user support (currently single-user)

**Success Criteria:**
- 100+ active installations
- <5 critical bugs in 90 days
- 5-year support commitment

### Stretch Goals (v2.0+)

**Advanced Features:**
- [ ] Immutable root filesystem (dm-verity)
- [ ] A/B partition updates (Android-style)
- [ ] Remote attestation (prove OS integrity)
- [ ] Containerized apps only (no native packages)
- [ ] Zero-trust network access (BeyondCorp model)
- [ ] Offline AI assistant (local LLM)

---

## Appendix A: Current Boot Menu Configs (Known Working)

### GRUB Configuration

**File:** `configs/grub/grub.cfg`

```bash
# GRUB Customization Configuration
# AeThex Linux Bootloader Theme

# Menu colors (terminal format)
set menu_color_normal=white/black
set menu_color_highlight=black/light-gray

# Timeout in seconds
set timeout=5
set timeout_style=menu

# Default boot option
set default=0

# Display settings
set gfxmode=auto
set gfxpayload=keep
terminal_output gfxterm

# Load video modules
insmod all_video
insmod gfxterm
insmod png
insmod jpeg

# Load theme if available
if [ -f /boot/grub/themes/aethex/theme.txt ]; then
  set theme=/boot/grub/themes/aethex/theme.txt
fi

# Boot menu entries
menuentry "AeThex Linux" {
    set gfxpayload=keep
    linux /boot/vmlinuz root=UUID=ROOTFS_UUID ro quiet splash
    initrd /boot/initrd.img
}

menuentry "AeThex Linux (Recovery Mode)" {
    linux /boot/vmlinuz root=UUID=ROOTFS_UUID ro recovery nomodeset
    initrd /boot/initrd.img
}

menuentry "Memory Test (memtest86+)" {
    linux16 /boot/memtest86+.bin
}

menuentry "Reboot" {
    reboot
}

menuentry "Shutdown" {
    halt
}
```

**Notes:**
- `ROOTFS_UUID` replaced during build with actual partition UUID
- `quiet splash` hides boot messages (remove for debugging)
- `nomodeset` in recovery mode disables GPU acceleration

### ISOLINUX Configuration

**File:** `configs/isolinux/isolinux.cfg` (to be created)

```ini
DEFAULT vesamenu.c32
TIMEOUT 50
PROMPT 0

MENU TITLE AeThex OS Boot Menu
MENU BACKGROUND splash.png
MENU COLOR screen 37;40 #80ffffff #00000000 std
MENU COLOR border 30;44 #ffffffff #00000000 std
MENU COLOR title 1;36;44 #ff00ffcc #00000000 std
MENU COLOR sel 7;37;40 #ff000000 #ff00ffcc all
MENU COLOR unsel 37;44 #ffffffff #00000000 std

LABEL live
    MENU LABEL AeThex OS (Live Mode)
    KERNEL /casper/vmlinuz
    APPEND initrd=/casper/initrd boot=casper quiet splash ---

LABEL persistent
    MENU LABEL AeThex OS (Persistent Mode)
    KERNEL /casper/vmlinuz
    APPEND initrd=/casper/initrd boot=casper persistent quiet splash ---

LABEL safe
    MENU LABEL AeThex OS (Safe Mode - nomodeset)
    KERNEL /casper/vmlinuz
    APPEND initrd=/casper/initrd boot=casper nomodeset ---

LABEL memtest
    MENU LABEL Memory Test (memtest86+)
    KERNEL /boot/memtest86+.bin

LABEL hd
    MENU LABEL Boot from Hard Disk
    LOCALBOOT 0x80
```

**Notes:**
- `vesamenu.c32` provides graphical menu
- `TIMEOUT 50` = 5 seconds (deciseconds)
- `splash.png` should be 640×480, 256 colors
- `persistent` option creates `casper-rw` file on USB

---

## Appendix B: Glossary

| Term | Definition |
|------|------------|
| **AeThex OS** | Device-layer operating system (kernel, boot, drivers) |
| **AeThex Platform** | Services layer (APIs, identity, applications) |
| **AeThex Ecosystem** | Organizational universe (governance, community, business) |
| **AeThex Passport** | User identity system (part of Platform, not OS) |
| **Casper** | Ubuntu's live boot technology (SquashFS + overlay) |
| **Live Mode** | Boot from USB without installation |
| **Persistence** | Saving changes across reboots in live mode |
| **ISO** | Disk image format (bootable CD/DVD/USB) |
| **GRUB** | Bootloader for UEFI systems |
| **ISOLINUX** | Bootloader for BIOS/legacy systems |
| **LUKS** | Linux Unified Key Setup (disk encryption) |
| **systemd** | Init system and service manager |
| **Xfce** | Lightweight desktop environment |
| **LightDM** | Display manager (login screen) |
| **debootstrap** | Tool to create minimal Debian/Ubuntu system |
| **SquashFS** | Compressed read-only filesystem (for live boot) |
| **OTA** | Over-the-air updates (remote software updates) |
| **HAL** | Hardware Abstraction Layer |
| **TPM** | Trusted Platform Module (hardware security chip) |
| **Secure Boot** | UEFI feature to verify bootloader signatures |
| **MDM** | Mobile Device Management (enterprise device control) |

---

## Appendix C: Related Documents

| Document | Purpose | Location |
|----------|---------|----------|
| **Platform Specification** | AeThex Platform APIs, services | `docs/AETHEX_PLATFORM_SPEC.md` |
| **Ecosystem Overview** | Org structure, governance, ethics | `docs/AETHEX_ECOSYSTEM_OVERVIEW.md` |
| **Linux Quickstart** | How to build/test AeThex OS | `LINUX_QUICKSTART.md` |
| **ISO Build Guide** | Detailed build instructions | `ISO_BUILD_FIXED.md` |
| **Desktop/Mobile Setup** | Tauri and Capacitor builds | `DESKTOP_MOBILE_SETUP.md` |

---

## Document Maintenance

**Review Cycle:** Quarterly (every 3 months)

**Next Review:** April 6, 2026

**Maintainers:**
- Lead: Platform Engineering Team
- Contributors: Open to community PRs

**Feedback:**
- GitHub Issues: Technical questions
- Discord: `#aethex-os-dev` channel
- Email: `os-team@aethex.com`

---

**Document Version:** 0.1.0  
**Last Updated:** January 6, 2026  
**Status:** Draft — Ready for Team Review  
**Next Action:** Pilot deployment planning (v0.5 roadmap)

---

*This document is the single source of truth for AeThex OS (device layer). For Platform or Ecosystem questions, see related documents in Appendix C.*
