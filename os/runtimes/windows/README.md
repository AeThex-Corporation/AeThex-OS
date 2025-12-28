# Windows Runtime

Compatibility layer for running Windows .exe applications.

## Components
- Wine 9.0+ (stable)
- Proton (for games)
- DXVK (DirectX to Vulkan)
- Windows fonts (Arial, Times New Roman, etc.)

## Execution Policy
1. Try Wine (fast, no Windows license)
2. Fall back to VM if needed (QEMU/KVM)
3. Remote host as last resort

## File Associations
.exe, .msi, .bat → wine-launcher
