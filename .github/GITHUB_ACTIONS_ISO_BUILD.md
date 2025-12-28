# GitHub Actions - ISO Build Automation

## How It Works

The `build-iso.yml` workflow automatically builds the AeThex Linux ISO whenever you:
1. Push changes to `main` branch (if relevant files changed)
2. Manually trigger it from GitHub Actions tab

## Automatic Triggers

The workflow runs automatically when changes are pushed to:
- `client/**` - React frontend
- `server/**` - Node.js backend
- `shared/**` - Shared schema
- `src-tauri/**` - Tauri desktop app
- `script/build-linux-iso.sh` - Build script itself
- `configs/**` - System configuration
- `.github/workflows/build-iso.yml` - This workflow file

## Manual Trigger

1. Go to **GitHub** → **Actions** tab
2. Select **"Build AeThex Linux ISO"** workflow
3. Click **"Run workflow"** button
4. Optionally check **"Create a GitHub release"** to publish the ISO

## Outputs

### Artifacts
- **ISO file:** Available as artifact for 90 days
- **Checksum:** SHA256 verification file
- Download from: Actions → Workflow run → Artifacts

### Releases (Optional)
If you check "Create a GitHub release":
- Creates a GitHub Release with the ISO
- Makes it publicly downloadable
- Includes SHA256 checksum for verification
- Pre-release tag for testing builds

## Usage Examples

### Download Built ISO

```bash
# Via GitHub Actions artifacts
1. Go to Actions tab
2. Select latest "Build AeThex Linux ISO" run
3. Download "AeThex-Linux-ISO" artifact

# Via GitHub CLI
gh run list --workflow=build-iso.yml --branch=main
gh run download <RUN_ID> -n AeThex-Linux-ISO
```

### Create Bootable USB from Downloaded ISO

```bash
# Verify integrity
sha256sum -c AeThex-Linux-*.sha256

# Write to USB
sudo dd if=AeThex-Linux-*.iso of=/dev/sdX bs=4M status=progress

# Eject
sudo eject /dev/sdX
```

### Automate Releases on Tags

Edit the workflow to release on git tags:

```yaml
on:
  push:
    tags:
      - 'v*'  # Trigger on version tags like v1.0.0
```

Then:
```bash
git tag v1.0.0
git push origin v1.0.0
```

## Build Status Badge

Add to your README:

```markdown
[![Build AeThex Linux ISO](https://github.com/AeThex-Corporation/AeThex-OS/actions/workflows/build-iso.yml/badge.svg)](https://github.com/AeThex-Corporation/AeThex-OS/actions/workflows/build-iso.yml)
```

## Monitoring Builds

### Check Recent Builds
1. **GitHub UI:** Actions tab → Select workflow
2. **GitHub CLI:** 
   ```bash
   gh run list --workflow=build-iso.yml
   gh run view <RUN_ID> --log
   ```
3. **Terminal:**
   ```bash
   gh workflow list
   gh run list -w build-iso.yml -L 5
   ```

### Get Build Logs
```bash
# Download full logs
gh run download <RUN_ID> --dir ./logs

# View in terminal
gh run view <RUN_ID> --log
```

## Customization

### Change Trigger Conditions
Edit `.github/workflows/build-iso.yml`:

```yaml
on:
  push:
    branches:
      - main
      - develop  # Also build on develop branch
    paths:
      - 'src-tauri/**'  # Only rebuild when Tauri changes
```

### Add Slack Notifications
```yaml
- name: Notify Slack
  if: always()
  uses: slackapi/slack-github-action@v1
  with:
    webhook-url: ${{ secrets.SLACK_WEBHOOK }}
    payload: |
      {
        "text": "AeThex Linux ISO Build: ${{ job.status }}"
      }
```

### Upload to S3 or CDN
```yaml
- name: Upload to S3
  uses: jakejarvis/s3-sync-action@master
  with:
    args: --acl public-read
  env:
    AWS_S3_BUCKET: ${{ secrets.AWS_S3_BUCKET }}
    AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
    AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
    AWS_REGION: 'us-east-1'
    SOURCE_DIR: '~/aethex-linux-build'
```

## Troubleshooting

### Build Timeout (60 minutes)
If builds take too long, try:
- Pre-compile dependencies
- Cache Docker layers
- Use GitHub-hosted larger runners (if available)

### Out of Disk Space on Runner
The workflow runs on Ubuntu Latest with ~14GB free (enough for this build).
If it fails:
1. Check workflow logs
2. Remove unnecessary steps
3. Use `disk-usage-cleanup` action

### Artifacts Not Uploading
- Check artifact path is correct
- Verify file was actually created
- Check artifact retention settings

## Security

### Best Practices

1. **Limit artifact access:**
   ```yaml
   permissions:
     contents: read
   ```

2. **Sign releases:**
   ```yaml
   - name: Create signed release
     with:
      gpg_key: ${{ secrets.GPG_KEY }}
   ```

3. **Restrict workflow to trusted users:**
   - Only allow manual runs from specific users
   - Use branch protection rules

## Next Steps

1. **Push changes to trigger build:**
   ```bash
   git add .
   git commit -m "Add AeThex Linux build automation"
   git push origin main
   ```

2. **Monitor first build:**
   - Go to Actions tab
   - Watch build progress
   - Download artifact when complete

3. **Set up releases (optional):**
   - Modify workflow to create releases
   - Distribute ISOs publicly
   - Track versions

4. **Add to README:**
   ```markdown
   ## Download AeThex Linux
   
   Get the latest bootable ISO:
   - [![Build Status](badge-url)](actions-url)
   - Download from [Releases](releases)
   ```

---

**Total build time:** ~30-45 minutes on GitHub Actions runners
**No local storage required:** Building happens in the cloud
