# Linux Development Runtime

Tools for running Linux development tasks without polluting base OS.

## Components
- Docker CE
- VSCode (or VSCodium)
- Git
- Build tools (gcc, make, cmake)
- Node.js, Python, Rust
- Podman (alternative to Docker)

## Isolation Strategy
Dev workspace runs in containers, pinned to specific Gen-1 version.
Base OS stays clean and stable.
