#!/bin/bash
set -e

# AeThex Linux - VM Testing Script
# Automatically creates and launches a VirtualBox VM with the AeThex Linux ISO

VM_NAME="AeThex-Linux-Test"
BUILD_DIR="$HOME/aethex-linux-build"
ISO_PATH="${BUILD_DIR}/AeThex-Linux-1.0.0-alpha-amd64.iso"
MEMORY_MB=4096
VRAM_MB=128
DISK_SIZE_MB=20480  # 20GB

echo "======================================"
echo "  AeThex Linux VM Testing"
echo "======================================"
echo ""

# Check for VirtualBox
if ! command -v VBoxManage &> /dev/null; then
    echo "ERROR: VirtualBox not found"
    echo "Install with: sudo apt install virtualbox"
    exit 1
fi

# Check for ISO
if [ ! -f "${ISO_PATH}" ]; then
    echo "ERROR: ISO not found at ${ISO_PATH}"
    echo "Build it first with: sudo bash script/build-linux-iso.sh"
    exit 1
fi

# Remove existing VM if present
echo "[1/5] Cleaning up existing VM..."
VBoxManage unregistervm "${VM_NAME}" --delete 2>/dev/null || true

# Create new VM
echo "[2/5] Creating virtual machine..."
VBoxManage createvm \
  --name "${VM_NAME}" \
  --ostype "Ubuntu_64" \
  --register

# Configure VM
echo "[3/5] Configuring VM settings..."
VBoxManage modifyvm "${VM_NAME}" \
  --memory ${MEMORY_MB} \
  --vram ${VRAM_MB} \
  --cpus 2 \
  --audio pulse \
  --audiocontroller ac97 \
  --boot1 dvd \
  --boot2 disk \
  --nic1 nat \
  --graphicscontroller vmsvga \
  --accelerate3d on

# Create storage controllers
VBoxManage storagectl "${VM_NAME}" \
  --name "SATA" \
  --add sata \
  --controller IntelAhci

# Create and attach virtual hard disk
echo "[4/5] Creating virtual disk..."
VBoxManage createhd \
  --filename "${HOME}/VirtualBox VMs/${VM_NAME}/${VM_NAME}.vdi" \
  --size ${DISK_SIZE_MB}

VBoxManage storageattach "${VM_NAME}" \
  --storagectl "SATA" \
  --port 0 \
  --device 0 \
  --type hdd \
  --medium "${HOME}/VirtualBox VMs/${VM_NAME}/${VM_NAME}.vdi"

# Attach ISO
VBoxManage storageattach "${VM_NAME}" \
  --storagectl "SATA" \
  --port 1 \
  --device 0 \
  --type dvddrive \
  --medium "${ISO_PATH}"

# Enable EFI (optional, for UEFI boot testing)
# VBoxManage modifyvm "${VM_NAME}" --firmware efi

echo "[5/5] Starting VM..."
VBoxManage startvm "${VM_NAME}" --type gui

echo ""
echo "======================================"
echo "  VM Launched Successfully!"
echo "======================================"
echo ""
echo "Test checklist:"
echo "  [ ] System boots to AeThex desktop"
echo "  [ ] Window manager responds (drag/drop)"
echo "  [ ] Terminal opens and functions"
echo "  [ ] File manager shows directories"
echo "  [ ] Network connectivity works"
echo "  [ ] Applications launch correctly"
echo ""
echo "Login credentials:"
echo "  Username: aethex"
echo "  Password: aethex"
echo ""
echo "To stop VM: VBoxManage controlvm '${VM_NAME}' poweroff"
echo "To delete VM: VBoxManage unregistervm '${VM_NAME}' --delete"
echo ""
