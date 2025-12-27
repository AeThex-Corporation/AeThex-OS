# Flash AeThex OS ISO to USB

This guide shows how to write the AeThex OS ISO to a USB drive on Linux, macOS, and Windows.

## Linux/macOS (Script)

- Prereqs: `sudo`, optional `pv` for progress.
- File: [script/flash-usb.sh](script/flash-usb.sh)

Commands:

```bash
sudo ./script/flash-usb.sh -i artifacts/AeThex-Linux-amd64.iso
# Or specify the device
sudo ./script/flash-usb.sh -i artifacts/AeThex-Linux-amd64.iso -d /dev/sdX
```

Notes:
- The script lists removable drives and prompts for confirmation.
- It unmounts any partitions and writes the ISO with `dd` (progress shown when `pv` is installed).

## Windows (Rufus)

Windows does not include a native `dd`. Use Rufus:
- Download Rufus: https://rufus.ie
- Insert USB drive.
- Select the ISO: `AeThex-Linux-amd64.iso`.
- Partition scheme: `GPT` for UEFI, `MBR` for BIOS.
- Hit Start and confirm.

Optional PowerShell checks:

```powershell
Get-Disk | Where-Object BusType -eq 'USB'
Get-Volume | Where-Object DriveType -eq 'Removable'
```

## Boot Tips

- Prefer UEFI boot with Secure Boot disabled (or enroll keys if supported).
- If the system does not boot, try toggling CSM/Legacy mode.
- Use `F12/F10/ESC/DEL` (vendor dependent) to open the boot menu.
