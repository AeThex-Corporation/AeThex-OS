# AeThex-OS: Complete Flows Inventory

> **Last Updated:** January 4, 2026
> **Purpose:** Track all flows, workflows, and processes in the codebase with completion status

---

## Summary

| Category | Total | Complete | Partial | Not Started |
|----------|-------|----------|---------|-------------|
| CI/CD Workflows | 3 | 2 | 1 | 0 |
| Authentication Flows | 2 | 1 | 1 | 0 |
| API Flows | 3 | 1 | 2 | 0 |
| Sales Funnel Features | 5 | 0 | 1 | 4 |
| Runtime Flows | 2 | 1 | 1 | 0 |
| Deployment Flows | 1 | 0 | 1 | 0 |
| **TOTAL** | **16** | **5** | **7** | **4** |

**Overall Completion: ~50%**

---

## CI/CD Workflows

### 1. GitHub Actions - Build ISO
- **File:** `.github/workflows/build-iso.yml`
- **Status:** ⚠️ PARTIAL
- **Flow Steps:**
  1. ✅ Trigger on manual dispatch or push to main
  2. ✅ Build client (npm run build)
  3. ⚠️ Build ISO (creates placeholder if build script fails)
  4. ✅ Verify ISO artifact
  5. ✅ Upload artifacts (90-day retention)
  6. ✅ Create GitHub Release (optional)
- **Issue:** Creates placeholder artifacts when `script/build-linux-iso.sh` fails (lines 59-61)
- **TODO:** Ensure build script handles all edge cases without placeholders

---

### 2. GitHub Actions - Deploy Docs
- **File:** `.github/workflows/deploy-docs.yml`
- **Status:** ✅ COMPLETE
- **Flow Steps:**
  1. ✅ Trigger on push to main with `docs/**` changes
  2. ✅ Checkout code
  3. ✅ Setup GitHub Pages
  4. ✅ Upload artifact from `docs/` directory
  5. ✅ Deploy to GitHub Pages

---

### 3. GitLab CI/CD Pipeline
- **File:** `.gitlab-ci.yml`
- **Status:** ✅ COMPLETE
- **Stages:**
  - ✅ `build`: Installs dependencies, runs npm build, executes full ISO build
  - ✅ `release`: Creates GitLab releases on tags

---

## Authentication Flows

### 4. Basic Auth Flow
- **File:** `server/routes.ts`
- **Status:** ✅ COMPLETE
- **Endpoints:**
  - ✅ `POST /api/auth/login` - Session creation
  - ✅ `POST /api/auth/signup` - User registration
  - ✅ `GET /api/auth/session` - Verify auth status
  - ✅ `POST /api/auth/logout` - End session

---

### 5. OAuth 2.0 Identity Linking Flow
- **File:** `server/oauth-handlers.ts`, `server/routes.ts`
- **Status:** ⚠️ PARTIAL (Core complete, missing features)
- **Implemented:**
  - ✅ `POST /api/oauth/link/:provider` - Start OAuth flow
  - ✅ `GET /api/oauth/callback/:provider` - OAuth callback handler
  - ✅ State token validation (5-minute TTL)
  - ✅ PKCE support for Roblox OAuth
  - ✅ Duplicate identity detection
- **UNFINISHED (docs/OAUTH_IMPLEMENTATION.md:271-278):**
  - [ ] **HIGH:** Implement unlink endpoint: `DELETE /api/oauth/unlink/:provider`
  - [ ] **HIGH:** Add frontend UI for identity linking (Settings page)
  - [ ] **HIGH:** Redis/database for state storage (replace in-memory Map)
  - [ ] **MEDIUM:** Rate limiting on OAuth endpoints
  - [ ] **MEDIUM:** Logging/monitoring for OAuth events
  - [ ] **LOW:** Refresh token support
  - [ ] **LOW:** Additional providers (Twitter/X, Google, Steam)

---

## API Flows

### 6. Mode Preference Flow
- **File:** `server/routes.ts`
- **Status:** ✅ COMPLETE
- **Endpoints:**
  - ✅ `GET /api/user/mode-preference` - Retrieve user mode
  - ✅ `PUT /api/user/mode-preference` - Update user mode

---

### 7. Code Execution API
- **File:** `api/execute.ts`
- **Status:** ⚠️ PARTIAL
- **Implemented:**
  - ✅ JavaScript execution
  - ✅ TypeScript execution
- **UNFINISHED (lines 25-29):**
  - [ ] Python execution
  - [ ] Go execution
  - [ ] Rust execution
  - [ ] Other languages return placeholder: "Execution not yet supported in cloud environment"

---

### 8. App Registry System
- **File:** `client/src/shared/app-registry.ts`
- **Status:** ⚠️ STUB ONLY
- **Issues:**
  - Line 1: "Minimal app registry stub to satisfy imports and provide types"
  - Line 14: `AppRegistry` is empty `{}`
  - Line 37-40: `canAccessRoute()` always returns `true` (placeholder)
- **UNFINISHED:**
  - [ ] Populate `AppRegistry` with actual app definitions
  - [ ] Implement proper role-based access control in `canAccessRoute()`
  - [ ] Add app capability checks

---

## Sales Funnel Features

> **Reference:** `PROJECT_RUNDOWN.md` lines 99-176

### 9. INTEL Folder
- **Status:** ❌ NOT IMPLEMENTED
- **Purpose:** Weaponize Naavik research report as "secret knowledge"
- **TODO (PROJECT_RUNDOWN.md:184-189):**
  - [ ] Add `INTEL` folder icon to desktop
  - [ ] Create `CROSS_PLATFORM_REPORT.TXT` file app
  - [ ] Write content summarizing Naavik research
  - [ ] Link to analysis

---

### 10. System Upgrade Alert
- **Status:** ❌ NOT IMPLEMENTED
- **Purpose:** Sell Foundry ($500) as OS "permission upgrade"
- **TODO (PROJECT_RUNDOWN.md:190-195):**
  - [ ] Add flashing system tray icon
  - [ ] Create upgrade notification component
  - [ ] Design modal/window with Foundry pitch
  - [ ] Add iFrame or link to `.studio` Foundry page

---

### 11. Network Neighborhood App
- **Status:** ❌ NOT IMPLEMENTED
- **Purpose:** Show user directory, gamify joining
- **TODO (PROJECT_RUNDOWN.md:196-201):**
  - [ ] Create `NETWORK` desktop icon
  - [ ] Build user directory window
  - [ ] Show current members (You, Dylan, Trevor)
  - [ ] Add locked slots with "Requires Architect Access"
  - [ ] Connect to actual user database

---

### 12. My Computer / Drives
- **Status:** ❌ NOT IMPLEMENTED
- **Purpose:** Show value of owning a .aethex domain
- **TODO (PROJECT_RUNDOWN.md:202-208):**
  - [ ] Add `THIS PC` / `MY COMPUTER` icon
  - [ ] Show Drive C (Local) and Drive D (.aethex TLD)
  - [ ] Implement "not mounted" error for TLD drive
  - [ ] Add call-to-action to join Foundry

---

### 13. Enhanced Login Screen
- **Status:** ⚠️ PARTIAL (basic login exists)
- **Purpose:** Dramatize system access with Passport initialization
- **TODO (PROJECT_RUNDOWN.md:209-213):**
  - [ ] Upgrade boot sequence with Passport initialization
  - [ ] Add "Detecting cross-platform identity" animation
  - [ ] Make login feel more like system access

---

## Runtime Flows

### 14. Linux ISO Build Flow
- **File:** `script/build-linux-iso.sh` and variants
- **Status:** ✅ COMPLETE (containerized edition)
- **Flow Steps:**
  1. ✅ Clean build directory
  2. ✅ Check/install dependencies
  3. ✅ Download Ubuntu Mini ISO base
  4. ✅ Build application layer in chroot
  5. ✅ Create AeThex user with auto-login
  6. ✅ Configure LightDM
  7. ✅ Copy application files
  8. ✅ Install Node dependencies
  9. ✅ Create systemd services
  10. ✅ Configure Firefox kiosk mode
  11. ✅ Create SquashFS filesystem
  12. ✅ Setup BIOS/UEFI boot
  13. ✅ Create hybrid ISO

---

### 15. Windows Runtime (Wine Launcher)
- **File:** `os/runtimes/windows/wine-launcher.sh`
- **Status:** ⚠️ PARTIAL
- **Implemented:**
  - ✅ Wine installation check
  - ✅ Wine prefix setup
  - ✅ Attempt to run .exe with Wine
- **UNFINISHED (line 22):**
  ```bash
  # Launch QEMU/KVM Windows VM (TODO: implement)
  notify-send "VM launcher not implemented yet"
  ```
  - [ ] Implement QEMU/KVM Windows VM fallback
  - [ ] VM image management
  - [ ] Hardware passthrough configuration

---

## Deployment Flows

### 16. Railway Deployment
- **File:** `DEPLOYMENT_STATUS.md`
- **Status:** ⚠️ PARTIAL (config ready, not deployed)
- **Completed:**
  - ✅ Railway config created (`railway.json`, `nixpacks.toml`)
  - ✅ Database schema ready
  - ✅ Documentation complete
- **UNFINISHED (DEPLOYMENT_STATUS.md:131-136):**
  - [ ] Deploy to Railway
  - [ ] Configure custom domain
  - [ ] Update Warden bot config
  - [ ] Test end-to-end flow
  - [ ] Monitor logs and metrics

---

## Backend/Multiplayer Features (Future)

> **Reference:** `PROJECT_RUNDOWN.md` lines 214-226

### Planned Features (Not Started)
- [ ] WebSocket presence system
- [ ] Cursor sharing
- [ ] Real-time notifications for multiplayer
- [ ] Discord bridge
- [ ] Track upgrade clicks analytics
- [ ] Log INTEL folder opens

---

## Files Requiring TODO Markers

| File | Line | Issue |
|------|------|-------|
| `os/runtimes/windows/wine-launcher.sh` | 22 | VM launcher not implemented |
| `api/execute.ts` | 25-29 | Non-JS/TS languages unsupported |
| `client/src/shared/app-registry.ts` | 1, 14, 37-40 | Stub implementation only |
| `docs/OAUTH_IMPLEMENTATION.md` | 259 | Unlink endpoint needed |
| `DEPLOYMENT_STATUS.md` | 132-136 | Deployment pending |

---

## Quick Reference: Unfinished Items by Priority

### Critical (Blocking Features)
1. OAuth unlink endpoint
2. App Registry implementation
3. Railway deployment

### High Priority (Sales Funnel)
4. INTEL Folder
5. System Upgrade Alert
6. Network Neighborhood
7. My Computer / Drives

### Medium Priority
8. Code execution for additional languages
9. Windows VM launcher
10. OAuth rate limiting

### Low Priority
11. Enhanced login screen
12. Multiplayer features
13. Additional OAuth providers

---

## How to Use This Document

1. **Before starting work:** Check this document to understand what's complete
2. **After completing a flow:** Update the status and remove from TODO lists
3. **When adding new flows:** Add an entry with status and implementation steps
4. **Regular audits:** Review quarterly to identify stale items

---

*Generated by automated flow analysis. See commit history for updates.*
