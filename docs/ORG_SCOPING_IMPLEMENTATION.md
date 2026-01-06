# Organization Scoping Security Implementation - Complete

## Overview
All high-risk database queries have been secured with organization-level scoping to prevent cross-org data leakage.

## Changes Implemented

### 1. Helper Layer (`server/org-storage.ts`)
```typescript
- getOrgIdOrThrow(req): Extracts and validates org context
- orgEq(req): Returns { organization_id: orgId } filter
- orgScoped(table, req): Returns scoped Supabase query builder
```

### 2. Middleware Strengthening (`server/org-middleware.ts`)
- ✅ Cache `req.orgMemberId` to avoid repeated DB lookups
- ✅ `requireOrgMember` returns 400 (not 403) when org context missing
- ✅ Clear error message: "Please select an organization (x-org-id header)"

### 3. Route Protection (`server/routes.ts`)

#### Sites (aethex_sites)
- `GET /api/sites`: Scoped by `orgScoped('aethex_sites', req)`
- `POST /api/sites`: Requires `organization_id` in insert
- `PATCH /api/sites/:id`: Validates `.eq('organization_id', orgId)`
- `DELETE /api/sites/:id`: Validates `.eq('organization_id', orgId)`

#### Opportunities (aethex_opportunities)
- `GET /api/opportunities`: Optional `?org_id=` query param for filtering
- `POST /api/opportunities`: Requires `organization_id`
- `PATCH /api/opportunities/:id`: Validates org ownership
- `DELETE /api/opportunities/:id`: Validates org ownership

#### Events (aethex_events)
- `GET /api/events`: Optional `?org_id=` query param
- `POST /api/events`: Requires `organization_id`
- `PATCH /api/events/:id`: Validates org ownership
- `DELETE /api/events/:id`: Validates org ownership

#### Projects (projects)
- Already protected via multi-tenancy implementation
- Uses `assertProjectAccess` for collaborator/owner checks

#### Files (files - in-memory)
- Storage keyed by `${userId}:${orgId}`
- All CRUD operations require org context
- Files can be linked to `project_id` for additional access control

### 4. Project Access Middleware (`requireProjectAccess`)
```typescript
requireProjectAccess(minRole: 'owner' | 'admin' | 'contributor' | 'viewer')
```

Applied to:
- `GET /api/projects/:id` (viewer)
- `GET /api/projects/:id/collaborators` (contributor)
- All project mutation routes via `assertProjectAccess`

Role hierarchy:
- `owner` > `admin` > `contributor` > `viewer`
- Org owners are implicit project owners
- Project collaborators override org role

### 5. WebSocket Updates (`server/websocket.ts`)
- ✅ Join `org:<orgId>` room on auth
- ✅ Join `user:<userId>` room
- ✅ Alerts emitted to org-specific rooms
- ✅ Socket auth accepts `orgId` parameter

### 6. Audit Script (`script/org-scope-audit.ts`)
```bash
npm run audit:org-scope
```
Scans `server/routes.ts` for:
- Supabase `.from(table)` calls
- Missing `.eq('organization_id', ...)` for org-scoped tables
- Exits non-zero if violations found

### 7. Integration Tests (`server/org-scoping.test.ts`)
```bash
npm run test:org-scope
```

Test coverage:
- ✅ User B in orgB cannot list orgA sites
- ✅ User B in orgB cannot update orgA opportunities
- ✅ User B in orgB cannot delete orgA events
- ✅ User A in orgA can access all orgA resources
- ✅ Projects are scoped and isolated

## Middleware Application Pattern

```typescript
// Org-scoped routes
app.get("/api/sites", requireAuth, attachOrgContext, requireOrgMember, handler);
app.post("/api/sites", requireAuth, attachOrgContext, requireOrgMember, handler);

// Project-scoped routes
app.get("/api/projects/:id", requireAuth, requireProjectAccess('viewer'), handler);
app.patch("/api/projects/:id", requireAuth, requireProjectAccess('admin'), handler);

// Public routes (no org required)
app.get("/api/opportunities", handler); // Optional ?org_id= filter
app.get("/api/events", handler);
```

## Exception Routes (No Org Scoping)
- `/api/auth/*` - Authentication endpoints
- `/api/metrics` - Public metrics
- `/api/directory/*` - Public directory
- `/api/me/*` - User-specific resources
- Admin routes - Cross-org access with audit logging

## Verification Checklist
- [x] All 15 high-risk gaps from audit closed
- [x] Sites CRUD protected
- [x] Opportunities CRUD protected
- [x] Events CRUD protected
- [x] Projects protected (via existing multi-tenancy)
- [x] Files protected (org-scoped storage keys)
- [x] WebSocket rooms org-scoped
- [x] Middleware caches membership
- [x] requireOrgMember returns 400 with clear error
- [x] Audit script detects violations
- [x] Integration tests verify isolation

## Next Steps (Blocked Until This Is Complete)
1. ✅ Security gaps closed - **COMPLETE**
2. 🔜 Project Graph canonicalization (projects vs aethex_projects)
3. 🔜 Revenue event primitive
4. 🔜 Labs organization type
5. 🔜 Cross-project identity primitive

## Running Tests

```bash
# Run org-scoping audit
npm run audit:org-scope

# Run integration tests
npm run test:org-scope

# Full type check
npm run check
```

---

**Status:** ✅ All 15 high-risk security gaps closed. Production-ready for org-scoped operations.
