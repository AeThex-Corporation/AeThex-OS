# GitLab CI Setup for AeThex-OS ISO Building

## Step 1: Create a GitLab Account (if you don't have one)
1. Go to https://gitlab.com
2. Sign up (free)

## Step 2: Create a GitLab Project
1. Click **New Project**
2. Choose **Import project**
3. Select **GitHub** 
4. Authorize and select `AeThex-Corporation/AeThex-OS`
5. Click **Create project**

**GitLab will now mirror your GitHub repo automatically!**

## Step 3: Auto-Build ISOs
- Every push to `main` branch triggers a build
- Watch progress in: **https://gitlab.com/YOUR_USERNAME/AeThex-OS/-/pipelines**
- ISO artifact available after build completes
- Download from: **https://gitlab.com/YOUR_USERNAME/AeThex-OS/-/jobs**

## Step 4: Push Back to GitHub (Optional)
To automatically upload ISOs to GitHub Releases:

1. Create GitHub token: https://github.com/settings/tokens
   - Scopes: `repo`, `write:packages`
   - Copy the token

2. In GitLab project: **Settings → CI/CD → Variables**
   - Add variable: `GITHUB_TOKEN` = `your_token`

3. Builds will now auto-upload ISOs to GitHub Releases ✅

## What Happens Now

```
GitHub (you push)
      ↓
GitLab (auto-synced) 
      ↓
.gitlab-ci.yml triggers
      ↓
Build runs (400GB storage available!)
      ↓
ISO created
      ↓
Artifact saved (90 days)
```

## Access Your GitLab Project
```
https://gitlab.com/YOUR_GITLAB_USERNAME/AeThex-OS
```

## Monitor Builds
1. Go to your GitLab project
2. Click **CI/CD → Pipelines**
3. Click running pipeline to see logs in real-time

## Download ISO
1. In **CI/CD → Pipelines**, click the passed pipeline
2. Click **Job artifacts → Download**
3. ISO is in `aethex-linux-build/`

---

**That's it! GitLab now builds your ISO automatically every time you push to GitHub.**
