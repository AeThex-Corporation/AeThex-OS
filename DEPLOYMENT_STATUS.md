# AeThex Infrastructure Deployment Status

## Current Architecture (Post-Railway Migration)

### Auth Service: aethex.tech/api
**Purpose**: User authentication via Passport
- Login/Register endpoints
- Session management
- OAuth flows (Discord, GitHub, Roblox)
- Cookie-based auth

**Status**: ✅ Live (migrated from Replit → Railway)

---

### Services Layer: aethex.cloud/api
**Purpose**: Application services (Sentinel, Bridge, etc.)
- Sentinel monitoring
- Bridge protocol
- Legacy service endpoints

**Status**: ✅ Live (migrated from Replit → Railway)
- Currently returns `"AeThex Animus Protocol: ONLINE"` / `"Bridge V1"`

---

### OS Kernel: [To Be Deployed]
**Purpose**: Identity & Entitlement Management
- Subject identity linking (`/api/os/link/*`)
- Entitlement issuance/verification (`/api/os/entitlements/*`)
- Issuer registry management
- Cross-platform identity resolution

**Status**: 🚧 **Ready for Railway Deployment**
- Code complete in this repo
- Railway config created (`railway.json`, `nixpacks.toml`)
- Database schema in `shared/schema.ts`
- Capability guard enforced

**Target Deployment URL Options**:
1. `https://kernel.aethex.cloud` (recommended - dedicated subdomain)
2. `https://aethex.cloud/kernel` (path-based routing)
3. `https://os.aethex.tech` (alternative domain)

---

## Deployment Workflow

### 1. Deploy OS Kernel to Railway
```bash
# Option A: Railway CLI
railway login
railway init
railway link
railway up

# Option B: GitHub integration (auto-deploy on push)
# Connect repo in Railway dashboard
```

### 2. Configure Environment Variables
Required in Railway dashboard:
```bash
NODE_ENV=production
SESSION_SECRET=<generate-new-secret>
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=<service-role-key>
STRIPE_SECRET_KEY=<optional-for-payments>
```

### 3. Run Database Migrations
```bash
# Before first deploy
npm run db:push
```

### 4. Set Custom Domain
In Railway dashboard:
- Add domain: `kernel.aethex.cloud`
- Update DNS:
  ```
  CNAME kernel <railway-provided-url>
  ```

---

## Integration Updates Required

Once deployed, update these services/bots:

### Warden Bot (Discord/Studio Integration)
Update `AETHEX_API_BASE`:
```bash
# From: http://localhost:5173
# To:   https://kernel.aethex.cloud
```

### Studio/Foundation Websites
OAuth callback redirect:
```bash
# Update link complete callback
https://kernel.aethex.cloud/api/os/link/complete
```

### Entitlement Issuers
Register issuer credentials in `aethex_issuers` table:
```sql
INSERT INTO aethex_issuers (name, issuer_class, scopes, public_key, is_active)
VALUES ('AeThex Studio', 'platform', ARRAY['course', 'project'], '<public-key>', true);
```

---

## Verification Checklist

After deployment:

- [ ] Health check responds: `curl https://kernel.aethex.cloud/health`
- [ ] Root endpoint shows OS Kernel info
- [ ] Link start endpoint works (see curl tests in `RAILWAY_DEPLOYMENT.md`)
- [ ] Entitlement resolve works with test data
- [ ] Capability guard enforces realm restrictions
- [ ] Supabase tables accessible (`aethex_subjects`, `aethex_entitlements`, etc.)
- [ ] Audit logs writing to `aethex_audit_log`
- [ ] WebSocket server running for real-time features

---

## Next Steps

1. ✅ Railway config created
2. ⏳ Deploy to Railway
3. ⏳ Configure custom domain
4. ⏳ Update Warden bot config
5. ⏳ Test end-to-end flow
6. ⏳ Monitor logs and metrics

---

## Support & Documentation

- **Deployment Guide**: [RAILWAY_DEPLOYMENT.md](./RAILWAY_DEPLOYMENT.md)
- **Integration Notes**: See attached document in conversation
- **API Endpoints**: All endpoints in [server/routes.ts](./server/routes.ts) and [server/api/os.ts](./server/api/os.ts)
- **Capability Policies**: [server/capability-guard.ts](./server/capability-guard.ts)
