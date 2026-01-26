# AeThex OS Documentation

> **Comprehensive documentation for the AeThex OS platform** - a modular web desktop, native applications, and bootable Linux distribution.

---

## 🚀 Quick Start Guides

**New to AeThex OS?** Start here:

| Guide | Description | Time |
|-------|-------------|------|
| [**Linux Quick Start**](linux-quickstart) | Build and boot AeThex Linux ISO | 15 min |
| [**OAuth Quick Start**](oauth-quickstart) | Set up authentication in 5 minutes | 5 min |
| [**Desktop/Mobile Setup**](desktop-mobile-setup) | Configure Tauri and Capacitor apps | 10 min |
| [**Web vs Desktop**](web-vs-desktop) | Understand deployment modes | 5 min |

---

## 📖 Core Documentation

### 🏛️ Architecture & Specifications

| Document | Description |
|----------|-------------|
| [**AeThex OS Specification**](os-specification) | **Official OS architecture document** - kernel, boot, security, roadmap |
| [AeThex Linux Overview](aethex-linux) | Bootable Linux distribution architecture and boot flow |
| [Platform UI Guide](platform-ui-guide) | Adaptive UI design for web, desktop, and mobile |
| [Web vs Desktop Guide](web-vs-desktop) | Architectural differences between deployment modes |

### 🔐 Authentication & Security

| Document | Description |
|----------|-------------|
| [OAuth Quick Start](oauth-quickstart) | 5-minute OAuth setup (Discord, GitHub, Roblox) |
| [OAuth Setup Guide](oauth-setup) | Comprehensive OAuth configuration |
| [OAuth Implementation](oauth-implementation) | Technical implementation details and code examples |
| [Credentials Rotation](credentials-rotation) | Best practices for managing API keys and secrets |
| [Entitlements Quick Start](entitlements-quickstart) | User permissions and access control setup |
| [Security Overview](../SECURITY) | Security policies, vulnerability reporting, and threat model |

### 🛠️ Build & Deployment

| Document | Description |
|----------|-------------|
| [Linux Quick Start](linux-quickstart) | Build AeThex Linux from source (web/desktop/ISO) |
| [ISO Build Guide](iso-build-fixed) | Complete Linux ISO build process with troubleshooting |
| [Desktop/Mobile Setup](desktop-mobile-setup) | Tauri (desktop) and Capacitor (mobile) configuration |
| [Flash USB Guide](flash-usb) | Create bootable USB drives for AeThex Linux |
| [GitLab CI Setup](gitlab-ci-setup) | Automated build pipeline configuration |
| [Tauri Setup](tauri-setup) | Desktop application build and packaging |

### 🎯 Feature Documentation

| Document | Description |
|----------|-------------|
| [Implementation Complete](implementation-complete) | Multi-tenancy and organization scoping implementation |
| [Multi-Tenancy Complete](multi-tenancy-complete) | Organization isolation and data scoping |
| [Mode System Complete](mode-system-complete) | Light/Dark theme system implementation |
| [Mobile Features](mobile-features) | Mobile-specific functionality (Capacitor plugins) |
| [Mobile Build Complete](mobile-build-complete) | Android/iOS build process and status |
| [Mobile Enhancements](mobile-enhancements) | Mobile UI/UX improvements and optimizations |
| [Expansion Complete](expansion-complete) | Platform expansion and new feature rollout |

### 📋 Reference & Checklists

| Document | Description |
|----------|-------------|
| [Quick Reference](quick-reference) | Command cheat sheet and common tasks |
| [Verification Checklist](verification-checklist) | Pre-release testing and QA checklist |
| [Org Scoping Audit](org-scoping-audit) | Organization isolation security audit |
| [Session Summary](session-summary) | Development session notes and decisions |

---

## 🗂️ Documentation by Topic

### For Users
- [Getting Started](linux-quickstart) - Install and use AeThex OS
- [OAuth Setup](oauth-quickstart) - Connect your accounts
- [Platform UI](platform-ui-guide) - Navigate the interface

### For Developers
- [Build from Source](linux-quickstart) - Compile AeThex OS
- [OAuth Implementation](oauth-implementation) - Integrate authentication
- [Desktop/Mobile](desktop-mobile-setup) - Build native apps
- [Contributing Guide](../README.md#-contributing) - Join the project

### For System Integrators
- [**OS Specification**](os-specification) - Architecture and design decisions
- [ISO Build](iso-build-fixed) - Create custom distributions
- [Security Model](os-specification#8-security-model) - Threat model and mitigations

### For DevOps/SRE
- [GitLab CI](gitlab-ci-setup) - Automated builds
- [Credentials Rotation](credentials-rotation) - Secret management
- [Deployment Modes](web-vs-desktop) - Production architecture

---

## 🏗️ Project Organization

```
AeThex-OS/
├── docs/                      # 📚 This documentation
│   ├── index.md              # You are here
│   ├── AETHEX_OS_SPECIFICATION.md  # ⭐ Core OS spec
│   ├── oauth-*.md            # Authentication guides
│   ├── PLATFORM_UI_GUIDE.md  # UI/UX documentation
│   └── ...
├── client/                    # React frontend
├── server/                    # Node.js backend
├── shared/                    # Shared schema (Drizzle ORM)
├── migrations/                # Database migrations
├── os/                        # Linux OS-specific files
├── configs/                   # System configurations (GRUB, systemd)
├── script/                    # Build and deployment scripts
└── README.md                  # Project overview
```

---

## 🎓 Learning Paths

### Path 1: Web Developer → AeThex Platform
1. [OAuth Quick Start](oauth-quickstart) - Set up authentication
2. [Platform UI Guide](platform-ui-guide) - Understand the interface
3. [OAuth Implementation](oauth-implementation) - Deep dive into auth

### Path 2: Systems Engineer → AeThex Linux
1. [**AeThex OS Specification**](os-specification) - **Read this first!**
2. [AeThex Linux Overview](aethex-linux) - Understand the distribution
3. [ISO Build Guide](iso-build-fixed) - Build your first ISO
4. [Flash USB Guide](flash-usb) - Deploy to hardware

### Path 3: Mobile Developer → AeThex Mobile
1. [Desktop/Mobile Setup](desktop-mobile-setup) - Configure Capacitor
2. [Mobile Features](mobile-features) - Explore mobile APIs
3. [Mobile Build Complete](mobile-build-complete) - Build and deploy

### Path 4: DevOps → AeThex Infrastructure
1. [GitLab CI Setup](gitlab-ci-setup) - Automated pipelines
2. [Credentials Rotation](credentials-rotation) - Secret management
3. [Web vs Desktop](web-vs-desktop) - Deployment architectures

---

## 🔍 Quick Search

**Looking for specific topics?**

- **Authentication:** [OAuth Quick Start](oauth-quickstart), [OAuth Setup](oauth-setup), [OAuth Implementation](oauth-implementation)
- **Linux Distribution:** [**OS Specification**](os-specification), [AeThex Linux](aethex-linux), [ISO Build](iso-build-fixed)
- **Desktop App:** [Desktop/Mobile Setup](desktop-mobile-setup), [Tauri Setup](tauri-setup)
- **Mobile App:** [Mobile Features](mobile-features), [Mobile Build](mobile-build-complete)
- **Security:** [Security Policy](../SECURITY), [Credentials Rotation](credentials-rotation), [OS Security Model](os-specification#8-security-model)
- **Building:** [Linux Quick Start](linux-quickstart), [ISO Build](iso-build-fixed), [GitLab CI](gitlab-ci-setup)

---

## 📖 Additional Resources

- **GitHub Repository:** [AeThex-Corporation/AeThex-OS](https://github.com/AeThex-Corporation/AeThex-OS)
- **Issue Tracker:** [GitHub Issues](https://github.com/AeThex-Corporation/AeThex-OS/issues)
- **Main README:** [Project Overview](../README.md)

---

## 🤝 Contributing to Documentation

Found a typo or want to improve the docs?

1. **Edit on GitHub:** Click the "Edit this page" link at the top
2. **Open an Issue:** [Report documentation bugs](https://github.com/AeThex-Corporation/AeThex-OS/issues)
3. **Submit a PR:** Fork, edit, and submit a pull request

**Documentation Standards:**
- Use clear, concise language
- Include code examples where helpful
- Add diagrams for complex architectures
- Keep the OS Specification as the single source of truth for kernel/boot/security decisions

---

## ⭐ Featured Document

### [AeThex OS — Operating System Specification](os-specification)

**The definitive reference for AeThex OS architecture.**

This document defines:
- Kernel strategy and boot process
- Security model and threat assessment
- Hardware support matrix
- Release roadmap (v0.1 → v1.0)
- Build and deployment procedures

**Read this if you're working on:**
- Bootloader or kernel configuration
- Hardware enablement
- Security features
- OS-level system services
- Release engineering

---

*Last updated: January 6, 2026*  
*Documentation version: 0.1.0*
