# AeThex OS

> A modular web desktop platform and bootable Linux distribution built with TypeScript, React, Vite, Drizzle ORM, and Supabase.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)]()
[![Documentation](https://img.shields.io/badge/docs-GitHub%20Pages-blue.svg)](https://aethex-corporation.github.io/AeThex-OS/)

---

## 🌐 What is AeThex OS?

**AeThex OS** is a multi-deployment platform that works as:
- 🌍 **Web Application** - Browser-based CloudOS hosted on Railway
- 💻 **Desktop Application** - Native Tauri app (Windows/Mac/Linux)
- 📱 **Mobile Application** - Capacitor-based app (Android/iOS)
- 🐧 **Linux Distribution** - Bootable OS replacing traditional operating systems

## 🚀 Quick Start

Choose your deployment mode:

### Web (Browser-Based)
```bash
npm install
npm run dev
# Visit http://localhost:5173
```

### Desktop (Tauri)
```bash
npm install
npm run tauri dev
```

### Mobile (Capacitor)
```bash
npm install
npm run build
npx cap sync android
npx cap open android
```

### Linux OS (Bootable ISO)
```bash
sudo bash script/build-linux-iso.sh
# Flash to USB: sudo dd if=aethex-linux.iso of=/dev/sdX bs=4M
```

## 📚 Documentation

📖 **[Full Documentation on GitHub Pages](https://aethex-corporation.github.io/AeThex-OS/)**

### Quick Links

#### Getting Started
- [Linux Quick Start](https://aethex-corporation.github.io/AeThex-OS/docs/linux-quickstart) - Build and deploy AeThex Linux
- [Desktop/Mobile Setup](https://aethex-corporation.github.io/AeThex-OS/docs/desktop-mobile-setup) - Tauri and Capacitor configuration
- [Web vs Desktop Guide](https://aethex-corporation.github.io/AeThex-OS/docs/web-vs-desktop) - Understanding deployment modes

#### Core Specifications
- [**AeThex OS Specification**](https://aethex-corporation.github.io/AeThex-OS/docs/os-specification) - Official OS architecture and design document
- [AeThex Linux Overview](https://aethex-corporation.github.io/AeThex-OS/docs/aethex-linux) - Bootable Linux distribution details
- [Platform UI Guide](https://aethex-corporation.github.io/AeThex-OS/docs/platform-ui-guide) - Adaptive UI design

#### Authentication & Security
- [OAuth Quick Start](https://aethex-corporation.github.io/AeThex-OS/docs/oauth-quickstart) - 5-minute OAuth setup
- [OAuth Implementation](https://aethex-corporation.github.io/AeThex-OS/docs/oauth-implementation) - Technical details
- [Credentials Rotation](https://aethex-corporation.github.io/AeThex-OS/docs/credentials-rotation) - Security best practices

#### Build & Deploy
- [ISO Build Guide](https://aethex-corporation.github.io/AeThex-OS/docs/iso-build-fixed) - Complete Linux ISO build process
- [GitLab CI Setup](https://aethex-corporation.github.io/AeThex-OS/docs/gitlab-ci-setup) - Automated builds
- [Flash USB Guide](https://aethex-corporation.github.io/AeThex-OS/docs/flash-usb) - Create bootable USB drives

## 🏗️ Architecture

```
┌─────────────────────────────────────────────┐
│        AeThex Platform (Multi-Mode)         │
├─────────────────────────────────────────────┤
│  Web      Desktop     Mobile     Linux OS   │
│  (Vite)   (Tauri)   (Capacitor)  (Ubuntu)   │
└─────────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────┐
│       React + TypeScript Frontend           │
│  • Desktop UI • File Manager • Terminal     │
│  • Apps • Marketplace • Messaging           │
└─────────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────┐
│       Node.js + Express Backend             │
│  • API Routes • WebSocket • Storage         │
└─────────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────┐
│     Supabase (PostgreSQL + Auth)            │
│  • Drizzle ORM • Multi-tenancy • OAuth      │
└─────────────────────────────────────────────┘
```

## 🛠️ Technology Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | React, TypeScript, Vite, TailwindCSS, Shadcn/ui |
| **Backend** | Node.js, Express, WebSocket |
| **Database** | PostgreSQL (Supabase), Drizzle ORM |
| **Authentication** | Supabase Auth, OAuth 2.0 (Discord, GitHub, Roblox) |
| **Desktop** | Tauri (Rust + WebView) |
| **Mobile** | Capacitor, Cordova |
| **Linux OS** | Ubuntu 24.04 LTS, Xfce, systemd |

## 📦 Project Structure

```
AeThex-OS/
├── client/             # React frontend application
├── server/             # Node.js backend API
├── shared/             # Shared schema and types (Drizzle)
├── migrations/         # Database migrations
├── docs/               # Documentation (GitHub Pages)
├── os/                 # Linux OS-specific files
├── configs/            # System configurations (GRUB, systemd)
├── script/             # Build and deployment scripts
├── android/            # Capacitor Android project
├── ios/                # Capacitor iOS project
└── src-tauri/          # Tauri desktop application
```

## 🧪 Development

### Prerequisites
- Node.js 20.x or higher
- npm or yarn
- PostgreSQL (or Supabase account)
- For Linux builds: Ubuntu 24.04 or Docker

### Environment Setup
```bash
# Clone repository
git clone https://github.com/AeThex-Corporation/AeThex-OS.git
cd AeThex-OS

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Configure Supabase credentials in .env
# VITE_SUPABASE_URL=your_supabase_url
# VITE_SUPABASE_ANON_KEY=your_anon_key

# Run database migrations
npm run db:push

# Start development server
npm run dev
```

### Testing
```bash
# Run test suite
./test-implementation.sh

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🎯 Features

### Platform Features
- ✅ Multi-tenant architecture with organization support
- ✅ OAuth authentication (Discord, GitHub, Roblox)
- ✅ Desktop environment with window management
- ✅ File manager with upload/download
- ✅ Terminal emulator (xterm.js)
- ✅ Real-time messaging and chat
- ✅ Application marketplace
- ✅ Achievement system
- ✅ User profiles and settings

### Linux OS Features
- ✅ Live USB boot with persistence
- ✅ Xfce desktop environment
- ✅ Auto-login and kiosk mode
- ✅ Pre-installed AeThex applications
- ✅ NetworkManager for WiFi/Ethernet
- ✅ systemd service management
- 🔄 Secure boot support (planned)
- 🔄 Disk encryption (planned)
- 🔄 OTA updates (planned)

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- **Documentation:** https://aethex-corporation.github.io/AeThex-OS/
- **Repository:** https://github.com/AeThex-Corporation/AeThex-OS
- **Issues:** https://github.com/AeThex-Corporation/AeThex-OS/issues
- **Discord:** [Join our community](#) *(coming soon)*

## 🙏 Acknowledgments

- Built on [Ubuntu 24.04 LTS](https://ubuntu.com/)
- Desktop framework: [Tauri](https://tauri.app/)
- Mobile framework: [Capacitor](https://capacitorjs.com/)
- Database: [Supabase](https://supabase.com/)
- UI Components: [Shadcn/ui](https://ui.shadcn.com/)

---

**AeThex OS** - *Where cloud meets desktop meets operating system*

Made with ❤️ by the AeThex Corporation team
