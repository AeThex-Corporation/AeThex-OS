# GitHub Pages Setup Guide

This document explains how to enable and use GitHub Pages for the AeThex OS documentation.

## 🚀 Quick Setup (5 Minutes)

### Step 1: Enable GitHub Pages

1. Go to your repository: https://github.com/AeThex-Corporation/AeThex-OS
2. Click **Settings** (top right)
3. Scroll down to **Pages** (left sidebar)
4. Under **Source**, select:
   - Source: **GitHub Actions**
   - Branch: (not needed for Actions)
5. Click **Save**

### Step 2: Push to Main Branch

The GitHub Actions workflow (`.github/workflows/pages.yml`) will automatically:
- Build the Jekyll site
- Deploy to GitHub Pages
- Make it available at: `https://aethex-corporation.github.io/AeThex-OS/`

### Step 3: Verify Deployment

1. Go to **Actions** tab in your repository
2. Watch the "Deploy GitHub Pages" workflow run
3. Once complete (green checkmark), visit your site:
   ```
   https://aethex-corporation.github.io/AeThex-OS/
   ```

## 📁 Documentation Structure

```
AeThex-OS/
├── _config.yml                    # Jekyll configuration
├── README.md                      # Homepage (auto-displayed)
├── .github/workflows/pages.yml    # Deployment workflow
├── docs/
│   ├── index.md                   # Documentation hub
│   ├── AETHEX_OS_SPECIFICATION.md # ⭐ Core OS spec
│   ├── OAUTH_QUICKSTART.md
│   ├── OAUTH_SETUP.md
│   ├── OAUTH_IMPLEMENTATION.md
│   ├── CREDENTIALS_ROTATION.md
│   ├── ENTITLEMENTS_QUICKSTART.md
│   ├── PLATFORM_UI_GUIDE.md
│   ├── FLASH_USB.md
│   └── [redirect files].md        # URL-friendly slugs
└── [root markdown files].md        # Additional docs
```

## 🎨 Theme Customization

### Current Theme: Cayman

The site uses the **Cayman** theme (dark header, clean design). To change:

**Edit `_config.yml`:**
```yaml
theme: jekyll-theme-cayman
```

**Available themes:**
- `jekyll-theme-cayman` (current)
- `jekyll-theme-slate` (dark, code-focused)
- `jekyll-theme-architect` (clean, professional)
- `minima` (minimal, blog-style)
- `just-the-docs` (documentation-focused, requires Gemfile)

### Custom Styling

Create `assets/css/style.scss`:
```scss
---
---

@import "{{ site.theme }}";

/* Custom styles */
.main-content {
  max-width: 1200px;
}
```

## 📄 Adding New Documentation

### Method 1: Direct Documentation (Preferred)

Add markdown files directly to `docs/`:

```bash
# Create new doc
echo "# My Feature\n\nContent here" > docs/MY_FEATURE.md

# Commit and push
git add docs/MY_FEATURE.md
git commit -m "docs: Add feature documentation"
git push
```

Will be available at: `https://aethex-corporation.github.io/AeThex-OS/docs/MY_FEATURE`

### Method 2: URL-Friendly Redirects

For better URLs, create redirect files:

**Create `docs/my-feature.md`:**
```markdown
---
layout: default
title: My Feature
permalink: /docs/my-feature
nav_order: 50
parent: Documentation
---

→ [View My Feature Documentation](MY_FEATURE)
```

Now accessible at: `https://aethex-corporation.github.io/AeThex-OS/docs/my-feature`

## 🔗 URL Structure

| File | URL |
|------|-----|
| `README.md` | `/AeThex-OS/` (homepage) |
| `docs/index.md` | `/AeThex-OS/docs/` (documentation hub) |
| `docs/AETHEX_OS_SPECIFICATION.md` | `/AeThex-OS/docs/AETHEX_OS_SPECIFICATION` |
| `docs/os-specification.md` (redirect) | `/AeThex-OS/docs/os-specification` |
| `LINUX_QUICKSTART.md` | `/AeThex-OS/LINUX_QUICKSTART` |
| `docs/linux-quickstart.md` (redirect) | `/AeThex-OS/docs/linux-quickstart` |

## 🛠️ Local Testing

### Option 1: Using Jekyll Locally

**Install Jekyll:**
```bash
# Ubuntu/Debian
sudo apt install ruby-full build-essential zlib1g-dev
gem install jekyll bundler

# macOS (via Homebrew)
brew install ruby
gem install jekyll bundler
```

**Serve locally:**
```bash
cd /workspaces/AeThex-OS
jekyll serve --baseurl "/AeThex-OS"

# Visit: http://localhost:4000/AeThex-OS/
```

### Option 2: Using Docker

```bash
docker run --rm -v "$PWD":/usr/src/app -p 4000:4000 \
  starefossen/github-pages \
  jekyll serve --host 0.0.0.0 --baseurl "/AeThex-OS"
```

## 📊 Advanced Configuration

### Custom Domain (Optional)

**To use `docs.aethex.com` instead of GitHub Pages URL:**

1. Create `docs/CNAME` file:
   ```
   docs.aethex.com
   ```

2. Configure DNS:
   ```
   CNAME docs -> aethex-corporation.github.io
   ```

3. Update `_config.yml`:
   ```yaml
   url: "https://docs.aethex.com"
   baseurl: ""
   ```

### Navigation Menu (For compatible themes)

**Edit `_config.yml`:**
```yaml
navigation:
  - title: Home
    url: /
  - title: Documentation
    url: /docs/
  - title: OS Specification
    url: /docs/os-specification
  - title: GitHub
    url: https://github.com/AeThex-Corporation/AeThex-OS
```

### Search (Requires Gemfile setup)

**For `just-the-docs` theme:**

1. Create `Gemfile`:
   ```ruby
   source "https://rubygems.org"
   gem "github-pages", group: :jekyll_plugins
   gem "just-the-docs"
   ```

2. Update `_config.yml`:
   ```yaml
   theme: just-the-docs
   search_enabled: true
   ```

## 🎯 Best Practices

### 1. Keep OS Specification as Single Source of Truth
- `docs/AETHEX_OS_SPECIFICATION.md` is the authoritative OS document
- Link to it from other docs, don't duplicate content

### 2. Use Descriptive Filenames
- ✅ Good: `OAUTH_QUICKSTART.md`, `ISO_BUILD_FIXED.md`
- ❌ Avoid: `doc1.md`, `temp.md`

### 3. Organize by Topic
```
docs/
├── index.md              # Hub page
├── auth/                 # Authentication docs
├── build/                # Build guides
├── deployment/           # Deployment docs
└── reference/            # API references
```

### 4. Link Between Docs
Use relative links:
```markdown
See the [OS Specification](AETHEX_OS_SPECIFICATION) for details.
```

### 5. Keep Front Matter Consistent
```yaml
---
layout: default
title: Document Title
permalink: /docs/url-slug
nav_order: 10
parent: Documentation
---
```

## 🐛 Troubleshooting

### Issue: "404 Not Found" after deployment

**Solution:** Check GitHub Actions logs:
1. Go to **Actions** tab
2. Click latest workflow run
3. Check for build errors

### Issue: CSS not loading

**Solution:** Verify `baseurl` in `_config.yml`:
```yaml
baseurl: "/AeThex-OS"  # Must match repo name
```

### Issue: Links broken

**Solution:** Use absolute paths from root:
```markdown
[Link](/AeThex-OS/docs/page)  # ✅ Correct
[Link](docs/page)              # ❌ May break
```

### Issue: Workflow not running

**Solution:** Ensure workflow has permissions:
1. **Settings** → **Actions** → **General**
2. Set **Workflow permissions** to: "Read and write permissions"

## 📚 Resources

- **Jekyll Documentation:** https://jekyllrb.com/docs/
- **GitHub Pages Docs:** https://docs.github.com/pages
- **Supported Themes:** https://pages.github.com/themes/
- **Jekyll Themes:** http://jekyllthemes.org/

## ✅ Post-Setup Checklist

After enabling GitHub Pages:

- [ ] Workflow runs successfully (green checkmark)
- [ ] Site accessible at: `https://aethex-corporation.github.io/AeThex-OS/`
- [ ] Homepage (README.md) displays correctly
- [ ] Documentation index (`/docs/`) loads
- [ ] OS Specification link works
- [ ] OAuth guides accessible
- [ ] All links navigate correctly
- [ ] Update README.md with GitHub Pages URL
- [ ] Announce documentation site to team

## 🚀 Next Steps

1. **Review and test all documentation links**
2. **Add search functionality** (requires theme upgrade)
3. **Create API documentation** (if needed)
4. **Set up custom domain** (optional)
5. **Add Google Analytics** (optional):
   ```yaml
   # _config.yml
   google_analytics: UA-XXXXXXXX-X
   ```

---

**Your documentation is now live at:**
🌐 https://aethex-corporation.github.io/AeThex-OS/

**Documentation Hub:**
📚 https://aethex-corporation.github.io/AeThex-OS/docs/

**OS Specification (Featured):**
⭐ https://aethex-corporation.github.io/AeThex-OS/docs/os-specification
