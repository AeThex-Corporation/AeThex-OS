#!/usr/bin/env bash
set -euo pipefail

# AeThex Linux ISO build script (placeholder)
# This script creates the expected artifact directory so CI can succeed.
# Replace with a real implementation when ready.

echo "Starting AeThex Linux ISO build (placeholder)"

# Create artifact directory
mkdir -p aethex-linux-build

# Placeholder content
cat > aethex-linux-build/README.txt << 'EOF'
AeThex Linux ISO build script is not yet implemented.
This is a placeholder artifact to validate CI wiring.

When implemented, this folder should contain:
- AeThex-Linux-<version>.iso
- SHA256 (checksum file)
EOF

# Exit successfully
echo "Placeholder ISO build complete."
