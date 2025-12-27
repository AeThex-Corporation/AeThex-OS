# 🚀 Quick Start - Tauri Desktop App

## Test Your Setup

Run the desktop app in development mode:

```bash
npm run tauri:dev
```

This will:
1. ✅ Build the Rust backend
2. ✅ Start Vite dev server on port 5000
3. ✅ Open AeThex-OS in a native window with hot-reload

## Common Commands

| Command | Description |
|---------|-------------|
| `npm run tauri:dev` | Run desktop app (development) |
| `npm run tauri:build` | Build desktop app for production |
| `npm run dev:client` | Run web version (frontend only) |
| `npm run dev` | Run backend server |

## What Changed?

### New Files
- `src-tauri/` - Tauri Rust application
  - `src/main.rs` - Entry point
  - `src/lib.rs` - Application logic
  - `tauri.conf.json` - Configuration
  - `Cargo.toml` - Rust dependencies
  - `icons/` - Application icons

### Modified Files
- `package.json` - Added Tauri scripts
- Configuration points to your Vite build

## Next Steps

1. **Test the app**: `npm run tauri:dev`
2. **Build for your platform**: `npm run tauri:build`
3. **Customize icons**: Replace files in `src-tauri/icons/`
4. **Add native features**: See [TAURI_SETUP.md](./TAURI_SETUP.md)

## Troubleshooting

### "Rust not found"
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env
```

### "Dependencies missing" (Linux)
```bash
sudo apt install libwebkit2gtk-4.1-dev build-essential
```

### First build is slow
The first `tauri:dev` or `tauri:build` compiles all Rust dependencies. Subsequent builds are much faster.

## Platform-Specific Builds

Build for your current platform:
```bash
npm run tauri:build
```

Outputs:
- **Linux**: `src-tauri/target/release/bundle/deb/` and `.appimage`
- **macOS**: `src-tauri/target/release/bundle/dmg/` and `.app`
- **Windows**: `src-tauri/target/release/bundle/msi/` and `.exe`

---

**Your AeThex-OS is now a desktop app! 🎉**

See [TAURI_SETUP.md](./TAURI_SETUP.md) for detailed documentation.
