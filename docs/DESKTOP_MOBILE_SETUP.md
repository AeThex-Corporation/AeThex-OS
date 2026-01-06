# AeThex OS - Desktop & Mobile Apps Setup

## Overview
AeThex OS now supports native desktop and mobile applications:
- **Desktop**: Tauri (Windows, macOS, Linux)
- **Mobile**: Capacitor (iOS, Android)

## 🖥️ Desktop App (Tauri)

### Prerequisites
- [Rust](https://www.rust-lang.org/tools/install) installed
- Windows: Microsoft Visual Studio C++ Build Tools
- macOS: Xcode Command Line Tools
- Linux: webkit2gtk, AppIndicator, etc.

### Development
```bash
# Start desktop app in development mode
npm run dev:tauri
```

This will:
1. Start the Vite dev server on port 5000
2. Launch the Tauri desktop window
3. Enable hot-reload for both frontend and Rust changes

### Building for Windows
```bash
# Build Windows executable
npm run build:tauri
```

Output location: `src-tauri/target/release/`
- `.exe` installer in `src-tauri/target/release/bundle/`

### Configuration
Edit [src-tauri/tauri.conf.json](src-tauri/tauri.conf.json) to customize:
- Window size, title, and behavior
- App identifier and version
- Build targets and icons
- Security policies

## 📱 Mobile Apps (Capacitor)

### Prerequisites

#### For Android:
- [Android Studio](https://developer.android.com/studio)
- Android SDK
- Java Development Kit (JDK) 17+

#### For iOS (macOS only):
- [Xcode](https://developer.apple.com/xcode/)
- Xcode Command Line Tools
- CocoaPods: `sudo gem install cocoapods`

### Initial Setup

1. **Build the web app first:**
```bash
npm run build
```

2. **Add mobile platforms:**
```bash
# Add Android platform
npx cap add android

# Add iOS platform (macOS only)
npx cap add ios
```

### Development Workflow

1. **Make changes to your web app** in `client/src/`

2. **Build and sync to mobile:**
```bash
npm run build:mobile
```
This builds the web app and copies it to native projects.

3. **Open in native IDE:**
```bash
# Open Android Studio
npm run android

# Open Xcode (macOS only)
npm run ios
```

4. **Run on device/emulator** from Android Studio or Xcode

### Live Reload (Optional)
For faster development, configure Capacitor to load from local dev server:

```typescript
// capacitor.config.ts
server: {
  url: 'http://192.168.1.XXX:5000', // Your local IP
  cleartext: true
}
```

Then run `npx cap sync` and use the native IDE to run.

## 🚀 Quick Start Commands

### Desktop Development
```bash
npm run dev:tauri          # Launch desktop app (dev mode)
npm run build:tauri        # Build production desktop app
```

### Mobile Development
```bash
npm run build              # Build web assets
npm run build:mobile       # Build and sync to mobile
npm run android            # Open Android Studio
npm run ios                # Open Xcode (macOS only)
```

## 📦 Project Structure

```
AeThex-OS/
├── src-tauri/              # Tauri desktop app
│   ├── src/
│   │   └── main.rs         # Rust main process
│   ├── tauri.conf.json     # Tauri configuration
│   └── Cargo.toml          # Rust dependencies
├── android/                # Android native project (after cap add)
├── ios/                    # iOS native project (after cap add)
├── capacitor.config.ts     # Capacitor configuration
├── client/                 # React web app (shared by all platforms)
└── dist/client/            # Built web assets
```

## 🔧 Platform-Specific Features

### Tauri (Desktop)
- Native system tray
- File system access
- Custom window controls
- Native menus
- System notifications
- Auto-updates

### Capacitor (Mobile)
- Camera access
- Geolocation
- Push notifications
- Native storage
- Share API
- Haptics

## 🛠️ Troubleshooting

### Tauri won't build
- Ensure Rust is installed: `rustc --version`
- Install C++ build tools on Windows
- Run `cargo clean` in `src-tauri/` directory

### Capacitor sync fails
- Build web app first: `npm run build`
- Check `dist/client/` directory exists
- Verify `capacitor.config.ts` webDir path

### Android Studio errors
- Update Android SDK and build tools
- Sync Gradle files
- Check Java version: `java -version` (needs 17+)

### iOS build fails (macOS)
- Update Xcode to latest version
- Install CocoaPods: `sudo gem install cocoapods`
- Run `npx cap sync ios` and `cd ios/App && pod install`

## 📝 Notes

- Desktop and mobile apps share the same React codebase in `client/src/`
- Server code in `server/` is NOT included in desktop/mobile builds
- For production mobile apps, configure API endpoints in `.env`
- Desktop app uses native webview (not Chromium bundle)
- File size: Tauri ~10-20MB, Capacitor varies by platform

## 🔐 Security

- Desktop: Update `src-tauri/tauri.conf.json` security settings
- Mobile: Configure Content Security Policy in Capacitor config
- Both: Use HTTPS for API connections in production

## 📚 Additional Resources

- [Tauri Documentation](https://tauri.app/v1/guides/)
- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Rust Installation](https://www.rust-lang.org/tools/install)
- [Android Studio Setup](https://developer.android.com/studio/install)
- [Xcode Setup](https://developer.apple.com/xcode/)
