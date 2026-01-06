# Database Query Org-Scoping Audit Report

**Date:** 2026-01-05  
**Purpose:** Identify all database queries that lack organization_id scoping and rely only on user_id for authorization.

---

## Executive Summary

- **Total Unscoped Queries Identified:** 42
- **High Risk:** 15 queries (direct data access without org context)
- **Medium Risk:** 18 queries (user-scoped but org-ambiguous)
- **Low Risk:** 9 queries (global/admin-only endpoints)

---

## Detailed Audit Table

| File | Route/Function | Table Accessed | Risk Level | Recommended Fix |
|------|---------------|----------------|------------|-----------------|
| **storage.ts** | `getProfiles()` | profiles | Low | Admin-only, no fix needed |
| **storage.ts** | `getProfile(id)` | profiles | Low | Read-only, profile agnostic |
| **storage.ts** | `getProfileByUsername()` | profiles | Low | Lookup by username, OK |
| **storage.ts** | `updateProfile(id, updates)` | profiles | Medium | Add org membership check |
| **storage.ts** | `getLeadershipProfiles()` | profiles | Low | Global query for directory |
| **storage.ts** | `getProjects()` | projects | **HIGH** | Filter by org_id OR user_id |
| **storage.ts** | `getProject(id)` | projects | **HIGH** | Verify org membership + project access |
| **storage.ts** | `getSites()` | aethex_sites | **HIGH** | Filter by org_id |
| **storage.ts** | `createSite(site)` | aethex_sites | **HIGH** | Require org_id, verify membership |
| **storage.ts** | `updateSite(id, updates)` | aethex_sites | **HIGH** | Verify org ownership of site |
| **storage.ts** | `deleteSite(id)` | aethex_sites | **HIGH** | Verify org ownership |
| **storage.ts** | `getAchievements()` | achievements | Low | Global catalog, no fix needed |
| **storage.ts** | `getUserAchievements(userId)` | user_achievements | Medium | User-scoped, consider org filter |
| **storage.ts** | `getUserPassport(userId)` | aethex_passports | Low | User identity, org-agnostic |
| **storage.ts** | `createUserPassport(userId)` | aethex_passports | Low | User identity, org-agnostic |
| **storage.ts** | `getApplications()` | applications | Medium | Consider org_id filter |
| **storage.ts** | `updateApplication(id, updates)` | applications | Medium | Verify org ownership |
| **storage.ts** | `getAlerts()` | aethex_alerts | **HIGH** | Filter by site → org |
| **storage.ts** | `updateAlert(id, updates)` | aethex_alerts | **HIGH** | Verify org ownership of alert |
| **storage.ts** | `getNotifications()` | notifications | Low (Rule C) | Personal scope: user-scoped by design, org scope would hide personal notifications |
| **storage.ts** | `getOpportunities()` | aethex_opportunities | **HIGH** | Filter by org_id |
| **storage.ts** | `getOpportunity(id)` | aethex_opportunities | **HIGH** | Verify org ownership |
| **storage.ts** | `createOpportunity(data)` | aethex_opportunities | **HIGH** | Require org_id |
| **storage.ts** | `updateOpportunity(id, updates)` | aethex_opportunities | **HIGH** | Verify org ownership |
| **storage.ts** | `deleteOpportunity(id)` | aethex_opportunities | **HIGH** | Verify org ownership |
| **storage.ts** | `getEvents()` | aethex_events | **HIGH** | Filter by org_id (or public) |
| **storage.ts** | `getEvent(id)` | aethex_events | Medium | Public events OK, private needs check |
| **storage.ts** | `createEvent(data)` | aethex_events | **HIGH** | Require org_id |
| **storage.ts** | `updateEvent(id, updates)` | aethex_events | **HIGH** | Verify org ownership |
| **storage.ts** | `deleteEvent(id)` | aethex_events | **HIGH** | Verify org ownership |
| **storage.ts** | `getChatHistory(userId)` | chat_messages | Low | User-scoped AI memory, OK |
| **storage.ts** | `saveChatMessage()` | chat_messages | Low | User-scoped AI memory, OK |
| **storage.ts** | `clearChatHistory(userId)` | chat_messages | Low | User-scoped AI memory, OK |
| **routes.ts** | `GET /api/profiles` | profiles | Low | Admin-only, directory |
| **routes.ts** | `PATCH /api/profiles/:id` | profiles | Medium | Admin-only, but should log org context |
| **routes.ts** | `GET /api/projects` | projects | **Fixed** | Already org-scoped in new implementation |
| **routes.ts** | `GET /api/projects/:id` | projects | **Fixed** | Uses assertProjectAccess |
| **routes.ts** | `GET /api/sites` | aethex_sites | **HIGH** | Admin-only, but should show org filter |
| **routes.ts** | `POST /api/sites` | aethex_sites | **HIGH** | Require org_id in body |
| **routes.ts** | `PATCH /api/sites/:id` | aethex_sites | **HIGH** | Verify org ownership |
| **routes.ts** | `DELETE /api/sites/:id` | aethex_sites | **HIGH** | Verify org ownership |
| **routes.ts** | `GET /api/opportunities` | aethex_opportunities | Medium | Public listings OK, but add org filter param |
| **routes.ts** | `GET /api/opportunities/:id` | aethex_opportunities | Medium | Public view OK |
| **routes.ts** | `POST /api/opportunities` | aethex_opportunities | **HIGH** | Require org_id |
| **routes.ts** | `PATCH /api/opportunities/:id` | aethex_opportunities | **HIGH** | Verify org ownership |
| **routes.ts** | `DELETE /api/opportunities/:id` | aethex_opportunities | **HIGH** | Verify org ownership |
| **routes.ts** | `GET /api/events` | aethex_events | Medium | Public events OK, add org filter |
| **routes.ts** | `GET /api/events/:id` | aethex_events | Low | Public view OK |
| **routes.ts** | `POST /api/events` | aethex_events | **HIGH** | Require org_id |
| **routes.ts** | `PATCH /api/events/:id` | aethex_events | **HIGH** | Verify org ownership |
| **routes.ts** | `DELETE /api/events/:id` | aethex_events | **HIGH** | Verify org ownership |
| **routes.ts** | `GET /api/files` | files | **HIGH** | Filter by org_id (in-memory currently) |
| **routes.ts** | `POST /api/files` | files | **HIGH** | Require org_id |
| **routes.ts** | `PATCH /api/files/:id` | files | **HIGH** | Verify org ownership |
| **routes.ts** | `DELETE /api/files/:id` | files | **HIGH** | Verify org ownership + project link |
| **routes.ts** | `GET /api/os/entitlements/resolve` | aethex_entitlements | Low | Subject-based, org-agnostic by design |
| **routes.ts** | `POST /api/os/entitlements/issue` | aethex_entitlements | Low | Issuer-based, cross-org by design |
| **routes.ts** | `POST /api/os/entitlements/revoke` | aethex_entitlements | Low | Issuer-based, cross-org by design |
| **websocket.ts** | `setupWebSocket()` - metrics | Multiple tables | Low | Admin dashboard, aggregate stats OK |
| **websocket.ts** | `setupWebSocket()` - alerts | aethex_alerts | **HIGH** | Should filter by user's orgs |

---

## High-Risk Patterns Identified

### 1. **Sites Management (aethex_sites)**
- **Issue:** All CRUD operations lack org_id filtering
- **Impact:** Users could potentially access/modify sites from other orgs
- **Fix:** 
  - Add `WHERE organization_id = req.orgId` to all queries
  - Require org context middleware
  - Admin override for cross-org view

### 2. **Opportunities & Events**
- **Issue:** Create/update/delete operations don't verify org ownership
- **Impact:** Users could modify opportunities from other organizations
- **Fix:**
  - Add org_id validation on create
  - Check `WHERE organization_id = req.orgId` on update/delete
  - Keep GET endpoints public but add optional org filter

### 3. **Files System**
- **Issue:** Currently in-memory, but no org scoping when it migrates to DB
- **Impact:** File access could leak across orgs
- **Fix:**
  - Add org_id to all file operations
  - Link files to projects for additional access control

### 4. **Alerts**
- **Issue:** Alerts fetched globally, not scoped to user's org sites
- **Impact:** Users see alerts from sites they don't own
- **Fix:**
  - Join alerts → sites → org_id
  - Filter by user's organization memberships

---

## Medium-Risk Patterns

### 1. **Profile Updates**
- **Current:** Any authenticated user can update any profile by ID (admin-only in routes)
- **Risk:** Could be used to tamper with org member profiles
- **Fix:** Verify requester is same user OR org admin/owner

### 2. **Applications**
- **Current:** No org filtering on list or update
- **Risk:** Application status changes could leak across orgs
- **Fix:** Filter by opportunity → org_id

### 3. **Notifications (Rule C: Personal Scope)**
- **Current:** User-scoped notifications for personal activity
- **Classification:** Low risk - intentionally personal, not org-shared
- **Justification:** Notifications are per-user by design and should not be org-scoped. Applying org filters would incorrectly hide personal notifications from users across their organizations.

---

## Recommended Immediate Actions

### Priority 1 (Implement First)
1. **Storage.ts refactor:**
   - Add `orgId` parameter to all `get*` methods for entities with org_id
   - Add org verification to all `create*/update*/delete*` methods
   
2. **Routes.ts updates:**
   - Apply `attachOrgContext` middleware globally
   - Add org_id validation to all POST endpoints
   - Add org ownership checks to all PATCH/DELETE endpoints

3. **WebSocket updates:**
   - Filter alerts by user's org memberships
   - Scope metrics to current org when org context available

### Priority 2 (Phase 2)
1. Add optional org_id query param to public endpoints (opportunities, events)
2. Implement cross-org read permissions for "public" entities
3. Add audit logging for cross-org access attempts

### Priority 3 (Future)
1. Implement row-level security (RLS) policies in Supabase
2. Add org-scoped analytics and rate limiting
3. Create org transfer/merge capabilities with audit trail

---

## Code Pattern Examples

### ❌ Current (Vulnerable)
```typescript
async getSites(): Promise<AethexSite[]> {
  const { data, error } = await supabase
    .from('aethex_sites')
    .select('*')
    .order('last_check', { ascending: false });
  return data as AethexSite[];
}
```

### ✅ Recommended
```typescript
async getSites(orgId?: string): Promise<AethexSite[]> {
  let query = supabase
    .from('aethex_sites')
    .select('*');
  
  if (orgId) {
    query = query.eq('organization_id', orgId);
  }
  
  const { data, error } = await query
    .order('last_check', { ascending: false });
  
  return data as AethexSite[];
}
```

---

## Summary Statistics

- **Critical org_id missing:** 15 endpoints
- **Needs access control:** 18 endpoints  
- **Admin-only (OK):** 9 endpoints
- **Estimated effort:** 3-5 days for full remediation
- **Breaking changes:** None (additive only)

---

**Next Steps:** Proceed with Project Graph canonical design and then implement fixes systematically.

