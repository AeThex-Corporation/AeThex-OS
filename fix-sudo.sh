#!/bin/bash
sudo bash -c 'echo "mrpiglr ALL=(ALL) NOPASSWD: ALL" > /etc/sudoers.d/mrpiglr'
sudo chmod 440 /etc/sudoers.d/mrpiglr
echo "Sudoers configured"

# Now build
cd ~/aethex-build
rm -rf aethex-linux-build
sudo bash script/build-linux-iso.sh
