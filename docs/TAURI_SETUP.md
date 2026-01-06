# Tauri Desktop App Setup

AeThex-OS has been configured to run as a native desktop application using Tauri (Rust + WebView).

## Prerequisites

### 1. Install Rust
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env
```

### 2. Install System Dependencies

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install -y libwebkit2gtk-4.1-dev \
  build-essential \
  curl \
  wget \
  file \
  libxdo-dev \
  libssl-dev \
  libayatana-appindicator3-dev \
  librsvg2-dev
```

**macOS:**
```bash
# Xcode Command Line Tools should be installed
xcode-select --install
```

**Windows:**
- Install [Microsoft Visual Studio C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/)
- Install [WebView2](https://developer.microsoft.com/en-us/microsoft-edge/webview2/)

## Project Structure

```
AeThex-OS/
├── client/          # React frontend
├── server/          # Node.js backend
├── src-tauri/       # Tauri Rust backend
│   ├── src/        # Rust source code
│   ├── icons/      # App icons
│   ├── Cargo.toml  # Rust dependencies
│   └── tauri.conf.json  # Tauri configuration
└── dist/public/    # Built frontend (used by Tauri)
```

## Development

### Run Desktop App in Development Mode
```bash
npm run tauri:dev
```

This will:
1. Start the Vite dev server (client)
2. Launch the Tauri window with hot-reload

### Run Web Version (Original)
```bash
# Terminal 1: Start backend
npm run dev

# Terminal 2: Start frontend
npm run dev:client
```

## Building

### Build Desktop App
```bash
npm run tauri:build
```

The built app will be in `src-tauri/target/release/bundle/`:
- **Linux**: `.deb`, `.appimage`
- **macOS**: `.dmg`, `.app`
- **Windows**: `.msi`, `.exe`

### Build Web Version
```bash
npm run build
```

## Configuration

### Tauri Configuration (`src-tauri/tauri.conf.json`)

Key settings:
- **Window size**: 1280x800 (configurable)
- **Dev URL**: http://localhost:5000 (Vite dev server)
- **Build output**: `dist/public` (Vite build output)
- **App identifier**: `com.aethex.os`

### Available Scripts

- `npm run tauri:dev` - Run desktop app in dev mode
- `npm run tauri:build` - Build desktop app
- `npm run tauri` - Access Tauri CLI directly

## Features Enabled

✅ Hot Module Replacement (HMR) in dev mode  
✅ System tray support  
✅ Native window controls  
✅ Multi-platform builds  
✅ Auto-updater ready  

## Architecture

### Hybrid Architecture
AeThex-OS uses a **hybrid architecture**:

1. **Frontend (Client)**: React + Vite - runs in the webview
2. **Backend (Server)**: Node.js + Express - can run locally or remotely
3. **Desktop (Tauri)**: Rust - provides native APIs and window management

### Communication Flow

```
User Interface (React)
       ↕
Tauri WebView APIs
       ↕
Rust Backend (Tauri)
       ↕
System APIs (File, Window, etc.)
```

For server communication, the app still uses HTTP/WebSocket to your Node.js backend.

## Adding Tauri Features

### Example: Add File System Access

1. **Enable plugin in Cargo.toml**:
```toml
[dependencies]
tauri-plugin-fs = "2"
```

2. **Register in src-tauri/src/main.rs**:
```rust
fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

3. **Use in frontend**:
```typescript
import { readTextFile } from '@tauri-apps/plugin-fs';

const contents = await readTextFile('file.txt');
```

## Tauri Plugins Available

- `tauri-plugin-fs` - File system access
- `tauri-plugin-shell` - Run shell commands
- `tauri-plugin-dialog` - Native dialogs
- `tauri-plugin-notification` - System notifications
- `tauri-plugin-http` - HTTP client
- `tauri-plugin-sql` - Local database
- `tauri-plugin-store` - Key-value storage

## Security

Tauri apps are more secure than Electron because:
- Uses system webview (smaller bundle)
- Rust backend (memory safe)
- No Node.js in renderer (reduced attack surface)
- CSP policies enforced

## Troubleshooting

### Linux: Missing dependencies
```bash
sudo apt install libwebkit2gtk-4.1-dev
```

### macOS: Code signing issues
```bash
# For development
codesign --force --deep --sign - src-tauri/target/release/bundle/macos/AeThex-OS.app
```

### Windows: WebView2 not found
Download and install from: https://developer.microsoft.com/en-us/microsoft-edge/webview2/

### Port conflicts
Change dev port in `src-tauri/tauri.conf.json`:
```json
"devUrl": "http://localhost:5000"
```

## Distribution

### Linux
- `.deb` - Debian/Ubuntu packages
- `.AppImage` - Universal Linux binary

### macOS
- `.app` - Application bundle
- `.dmg` - Disk image installer

### Windows
- `.msi` - Windows installer
- `.exe` - Portable executable

## Next Steps

1. ✅ Tauri configured
2. 🔄 Test development mode: `npm run tauri:dev`
3. 🔄 Customize app icons in `src-tauri/icons/`
4. 🔄 Build for distribution: `npm run tauri:build`
5. 🔄 Add Tauri-specific features (system tray, notifications, etc.)

## Resources

- [Tauri Documentation](https://tauri.app/)
- [Tauri Plugins](https://tauri.app/plugin/)
- [Tauri API Reference](https://tauri.app/reference/)
- [Tauri Examples](https://github.com/tauri-apps/tauri/tree/dev/examples)
