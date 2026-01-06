#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat << 'USAGE'
Usage: ./script/verify-iso.sh -i <path/to.iso> [options]

Options:
  -i <path>        Path to ISO file
  -s <sha256>      Expected SHA256 hash (overrides .sha256 file lookup)
  --mount          Mount ISO to verify contents (requires sudo/root)
  -h, --help       Show this help

Examples:
  ./script/verify-iso.sh -i aethex-linux-build/AeThex-Linux-amd64.iso
  ./script/verify-iso.sh -i AeThex-OS-Full-amd64.iso -s <sha256>
  ./script/verify-iso.sh -i AeThex-Linux-amd64.iso --mount
USAGE
}

ISO=""
EXPECTED_SHA=""
MOUNT_CHECK=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    -i)
      ISO="${2:-}"
      shift 2
      ;;
    -s)
      EXPECTED_SHA="${2:-}"
      shift 2
      ;;
    --mount)
      MOUNT_CHECK=1
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown arg: $1" >&2
      usage >&2
      exit 1
      ;;
  esac
done

if [[ -z "$ISO" ]]; then
  echo "Missing ISO path." >&2
  usage >&2
  exit 1
fi

if [[ ! -f "$ISO" ]]; then
  echo "ISO not found: $ISO" >&2
  exit 1
fi

ISO_DIR=$(cd "$(dirname "$ISO")" && pwd)
ISO_BASE=$(basename "$ISO")

printf "\n[+] Verifying ISO: %s\n" "$ISO"
ls -lh "$ISO"

SHA_CALC=$(sha256sum "$ISO" | awk '{print $1}')
printf "SHA256 (calculated): %s\n" "$SHA_CALC"

if [[ -n "$EXPECTED_SHA" ]]; then
  if [[ "$SHA_CALC" == "$EXPECTED_SHA" ]]; then
    echo "[✓] SHA256 matches provided value."
  else
    echo "[!] SHA256 mismatch. Expected: $EXPECTED_SHA" >&2
    exit 1
  fi
else
  if [[ -f "$ISO_DIR/$ISO_BASE.sha256" ]]; then
    echo "[+] Found checksum file: $ISO_DIR/$ISO_BASE.sha256"
    (cd "$ISO_DIR" && sha256sum -c "$ISO_BASE.sha256")
  elif [[ -f "$ISO_DIR/$ISO_BASE.sha256.txt" ]]; then
    echo "[+] Found checksum file: $ISO_DIR/$ISO_BASE.sha256.txt"
    (cd "$ISO_DIR" && sha256sum -c "$ISO_BASE.sha256.txt")
  else
    echo "[!] No checksum file found; provide one with -s to enforce." >&2
  fi
fi

check_path() {
  local label="$1"
  local needle="$2"

  if command -v xorriso >/dev/null 2>&1; then
    if xorriso -indev "$ISO" -find / -name "$(basename "$needle")" -print 2>/dev/null | grep -q "$needle"; then
      echo "[✓] $label: $needle"
    else
      echo "[!] Missing $label: $needle" >&2
      return 1
    fi
    return 0
  fi

  if command -v isoinfo >/dev/null 2>&1; then
    if isoinfo -i "$ISO" -f 2>/dev/null | grep -q "^$needle$"; then
      echo "[✓] $label: $needle"
    else
      echo "[!] Missing $label: $needle" >&2
      return 1
    fi
    return 0
  fi

  echo "[!] No ISO inspection tool found (xorriso/isoinfo). Skipping: $label" >&2
  return 0
}

FAIL=0
check_path "Kernel" "/casper/vmlinuz" || FAIL=1
check_path "Initrd" "/casper/initrd.img" || FAIL=1
check_path "SquashFS" "/casper/filesystem.squashfs" || FAIL=1
check_path "GRUB config" "/boot/grub/grub.cfg" || FAIL=1
check_path "ISOLINUX config" "/isolinux/isolinux.cfg" || FAIL=1

if [[ "$MOUNT_CHECK" -eq 1 ]]; then
  MOUNT_DIR=$(mktemp -d)
  cleanup() {
    if mountpoint -q "$MOUNT_DIR"; then
      sudo umount "$MOUNT_DIR" || true
    fi
    rmdir "$MOUNT_DIR" || true
  }
  trap cleanup EXIT

  echo "[+] Mounting ISO to $MOUNT_DIR"
  if [[ $EUID -eq 0 ]]; then
    mount -o loop "$ISO" "$MOUNT_DIR"
  else
    sudo mount -o loop "$ISO" "$MOUNT_DIR"
  fi

  for path in \
    "$MOUNT_DIR/boot/grub/grub.cfg" \
    "$MOUNT_DIR/isolinux/isolinux.cfg" \
    "$MOUNT_DIR/casper/filesystem.squashfs"; do
    if [[ -f "$path" ]]; then
      echo "[✓] Mounted file present: $path"
    else
      echo "[!] Missing mounted file: $path" >&2
      FAIL=1
    fi
  done
fi

if [[ "$FAIL" -eq 1 ]]; then
  echo "\n[!] ISO verification failed." >&2
  exit 1
fi

echo "\n[✓] ISO verification complete."
