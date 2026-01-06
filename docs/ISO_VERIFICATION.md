# AeThex OS ISO Verification

Use this guide to verify that a built ISO is real, intact, and contains the expected boot assets.

## Quick Verify (Recommended)

```bash
./script/verify-iso.sh -i aethex-linux-build/AeThex-Linux-amd64.iso
```

What it checks:
- File exists + size
- SHA256 checksum (if `.sha256` or `.sha256.txt` file exists)
- Key boot files inside the ISO

## Enforce a Specific Checksum

```bash
./script/verify-iso.sh -i AeThex-OS-Full-amd64.iso -s <expected_sha256>
```

## Deep Verify (Mounted Contents)

Mount the ISO to confirm file layout directly (requires sudo/root):

```bash
./script/verify-iso.sh -i AeThex-OS-Full-amd64.iso --mount
```

## Expected Success Output

You should see:
- A calculated SHA256
- `SHA256 matches ...` if a checksum is provided or discovered
- `[✓] Kernel`, `[✓] Initrd`, `[✓] SquashFS`, `[✓] GRUB config`, `[✓] ISOLINUX config`
- Final line: `ISO verification complete.`

## Troubleshooting

- **Missing files:** Rebuild the ISO and check `script/build-linux-iso.sh` or `script/build-linux-iso-full.sh`.
- **SHA mismatch:** Re-download the ISO artifact or copy the correct `.sha256` file next to the ISO.
- **No inspection tool:** Install `xorriso` (preferred) or `isoinfo` and re-run.

## Related Docs

- `LINUX_QUICKSTART.md`
- `ISO_BUILD_FIXED.md`
- `docs/FLASH_USB.md`
