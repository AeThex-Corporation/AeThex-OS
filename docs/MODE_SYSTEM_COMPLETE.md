# Production-Safe Mode System - Implementation Complete

## ✅ What Was Built

### 1. **Realm vs Mode Separation**
- **Realm** = Authority + Policy Boundary (enforced server-side)
- **Mode** = Presentation + App Surface (user preference)

### 2. **Single Source of Truth: App Registry**
File: `shared/app-registry.ts`

- **Canonical app dictionary** (`appsById`) - no duplication
- **Mode manifests** - select app subsets per mode
- **Capability system** - 9 capabilities (credential_verification, commerce, social, etc.)
- **Policy metadata** per app:
  - `requiresRealm`: "foundation" | "corporation" | "either"
  - `requiresCapabilities`: array of required capabilities
  - `navVisibleIn`: which modes show this app
  - `routes`: all routes for route guarding

### 3. **Database Schema**
New tables in `migrations/0003_mode_system.sql`:

```sql
aethex_user_mode_preference
  - user_id (unique)
  - mode ("foundation" | "corporation")
  - created_at, updated_at

aethex_workspace_policy
  - workspace_id (unique)
  - enforced_realm (if set, users cannot switch)
  - allowed_modes (json array)
  - commerce_enabled, social_enabled, messaging_enabled
  - created_at, updated_at
```

### 4. **Client-Side Protection**

#### Route Guard (`client/src/hooks/use-route-guard.ts`)
- Monitors location changes
- Checks `canAccessRoute(path, realm, mode)`
- Redirects with toast notification if access denied
- Prevents manual URL navigation to restricted apps

#### Mode Hook (`client/src/hooks/use-mode.ts`)
- Fetches user mode preference from API
- Fetches workspace policy
- Respects `enforced_realm` (disables mode switching)
- Updates mode preference via API

### 5. **Server-Side Protection**

#### Capability Guard Middleware (`server/capability-guard.ts`)
- Maps endpoints to required capabilities
- Checks `x-user-realm` header
- Enforces realm requirements
- Enforces capability requirements
- Returns 403 with detailed error if access denied

**Protected Endpoints:**
```typescript
/api/hub/messaging        → corporation, ["social", "messaging"]
/api/hub/marketplace      → corporation, ["commerce", "marketplace"]
/api/hub/projects         → corporation, ["social"]
/api/hub/analytics        → corporation, ["analytics"]
/api/hub/file-manager     → corporation, ["file_storage"]
/api/os/entitlements/*    → ["credential_verification"]
/api/os/link/*            → ["identity_linking"]
```

#### Mode API Endpoints (`server/routes.ts`)
```
GET  /api/user/mode-preference  → Get user mode
PUT  /api/user/mode-preference  → Update user mode
GET  /api/workspace/policy      → Get workspace policy
```

### 6. **App Distribution**

#### Foundation Mode (7 apps)
- Achievements (credential verification)
- Passport (identity profile)
- Curriculum (learning paths)
- Events (programs and cohorts)
- Lab (development environment)
- Network (directory of verified builders)
- OS Link (identity linking)

#### Corporation Mode (15 apps)
- All Foundation apps +
- Messaging (direct messaging)
- Marketplace (access to courses, tools, services)
- Projects (portfolio showcase)
- Code Gallery (code sharing)
- Notifications (activity feed)
- Analytics (engagement metrics)
- File Manager (cloud storage)
- Settings (preferences)

### 7. **Key Design Decisions**

#### ✅ Network App Clarified
- **Foundation**: Directory of issuers/program cohorts + verified builders
- **No DMs, no public feeds, no monetization hooks**
- Remains in Foundation mode as a directory-only feature

#### ✅ Marketplace Reworded
- Changed from "Buy and sell credentials" (dangerous)
- To "Access courses, tools, and services" (safe)
- Credentials are **earned/issued**, not purchased
- What's sold: course seats, audits, software licenses, service engagements

#### ✅ OS Kernel Clearly Separated
- Scope badge: "Kernel"
- Accessible from both modes
- Visually distinct (cyan accent)
- Infrastructure layer, not a third mode

---

## 🔒 Security Model

### Multi-Layer Defense

1. **Client Route Guard** → Prevents UI navigation
2. **App Visibility Filter** → Hides unavailable apps
3. **Server Capability Guard** → Blocks API calls
4. **Workspace Policy** → Organizational enforcement

### Enforcement Chain

```
User → Client checks mode → Server checks realm → Database checks capability → Action allowed/denied
```

---

## 📊 Mode Comparison

| Feature | Foundation | Corporation |
|---------|-----------|-------------|
| **Apps** | 7 core + OS | 7 core + 8 Hub + OS |
| **Focus** | Credentials | Community + Commerce |
| **Messaging** | ❌ | ✅ |
| **Marketplace** | ❌ | ✅ |
| **Projects** | ❌ | ✅ |
| **File Storage** | ❌ | ✅ |
| **Analytics** | ❌ | ✅ |
| **Color** | Cyan/Blue | Purple/Pink |
| **Label** | "AeThex Foundation" | "AeThex Hub" |

---

## 🚀 What's Enforced

✅ **Route Access** - Manual URL navigation blocked  
✅ **API Access** - Hub endpoints check realm + capabilities  
✅ **App Visibility** - Only allowed apps shown in UI  
✅ **Workspace Policy** - Organizations can lock users into Foundation  
✅ **Capability Mapping** - Every Hub feature requires explicit capabilities  

---

## 🔄 Migration Status

```bash
✅ 0001_new_apps_expansion.sql  (10 Hub tables)
✅ 0002_os_kernel.sql            (7 OS kernel tables)
✅ 0003_mode_system.sql          (2 mode governance tables)

Total: 19 tables deployed
```

---

## 🧪 Testing

Start dev server:
```bash
npm run dev
```

Visit `http://localhost:5000` and:
1. Toggle between Foundation/Corporation modes
2. Try accessing Hub apps in Foundation mode (should be blocked)
3. Check browser console for access denied messages
4. Try direct URL navigation to `/hub/messaging` in Foundation mode

---

## 📝 Result

**Mode is now enforceable governance, not cosmetic theming.**

Foundation becomes a credentialing/education console that feels institutional. Corporation becomes a full platform with commerce + community. OS Kernel remains shared infrastructure accessible to both.

The distinction is now **enforceable at every layer**: UI visibility, client routing, server API access, and workspace policy.
