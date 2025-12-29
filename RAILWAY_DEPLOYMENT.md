# Railway Deployment Guide - AeThex OS Kernel

## Architecture Overview

- **aethex.tech/api** - Auth service (Passport endpoints)
- **aethex.cloud/api** - Services (Sentinel & others)
- **THIS REPO** - OS Kernel (Identity linking, Entitlements, Subjects)

## Pre-Deployment Checklist

### 1. Environment Variables (Required)
```bash
# Core Config
NODE_ENV=production
PORT=3000  # Railway auto-assigns

# Security
SESSION_SECRET=<generate-strong-secret>

# Supabase (OS Database)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=<service-role-key>

# Stripe (for payments)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PRICE_ID=price_...  # Optional
STRIPE_SUCCESS_URL=https://aethex.tech/upgrade/success
STRIPE_CANCEL_URL=https://aethex.tech/upgrade/cancel

# OpenAI (if using AI features)
OPENAI_API_KEY=sk-proj-...
```

### 2. Database Setup
Run migrations before deploying:
```bash
npm install
npm run db:push
```

### 3. Railway Project Setup

#### Option A: New Railway Project
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Link to this repo
railway link

# Set environment variables
railway variables set SESSION_SECRET=<secret>
railway variables set SUPABASE_URL=<url>
railway variables set SUPABASE_SERVICE_KEY=<key>

# Deploy
railway up
```

#### Option B: Deploy from GitHub
1. Go to [railway.app](https://railway.app/new)
2. Select "Deploy from GitHub repo"
3. Choose `AeThex-Corporation/AeThex-OS`
4. Railway auto-detects `railway.json` and `nixpacks.toml`
5. Set environment variables in Railway dashboard
6. Deploy automatically triggers

### 4. Custom Domain Setup

#### For aethex.tech/api/os/* (Auth domain)
1. In Railway dashboard → Settings → Domains
2. Add custom domain: `aethex.tech`
3. Update DNS:
   ```
   CNAME api railway.app (or provided value)
   ```
4. Configure path routing in Railway or reverse proxy

#### For aethex.cloud/api/os/* (Services domain)
1. Same process with `aethex.cloud`
2. Use Railway's path-based routing or Cloudflare Workers

## Deployment Commands

### Build locally
```bash
npm run build
```

### Test production build
```bash
NODE_ENV=production npm start
```

### Deploy to Railway
```bash
railway up
# or
git push  # if GitHub integration enabled
```

## Post-Deployment Verification

### 1. Health Check
```bash
curl https://your-app.railway.app
# Expected: {"status":"AeThex OS Kernel: ONLINE"}
```

### 2. Test OS Kernel Endpoints
```bash
# Link Start
curl -X POST https://your-app.railway.app/api/os/link/start \
  -H 'Content-Type: application/json' \
  -H 'x-user-id: test-user' \
  -d '{"provider":"studio"}'

# Resolve Entitlements
curl 'https://your-app.railway.app/api/os/entitlements/resolve?platform=discord&id=12345'
```

### 3. Check Logs
```bash
railway logs
```

## Troubleshooting

### Build Fails
- Verify `npm run build` succeeds locally
- Check Railway build logs for missing dependencies

### Database Connection Issues
- Ensure Supabase service key has correct permissions
- Check Supabase project isn't paused
- Verify database tables exist (run `npm run db:push`)

### Session/Cookie Issues
- Set `SESSION_SECRET` in Railway
- Verify `trust proxy` is enabled (it is)

### CORS Issues
- Check if frontend domain is whitelisted
- Railway auto-adds CORS headers for Railway subdomains

## Migration Strategy

### From Replit → Railway

1. **Export Data** (if needed)
   ```bash
   # Backup Supabase tables
   npx supabase db dump --db-url "$SUPABASE_URL"
   ```

2. **Update DNS**
   - Keep Replit running
   - Point Railway custom domain
   - Test Railway deployment
   - Switch DNS to Railway
   - Decommission Replit

3. **Zero-Downtime Migration**
   - Use Railway preview deploys first
   - Test all endpoints
   - Switch production traffic gradually

## Monitoring

### Railway Dashboard
- View metrics: CPU, Memory, Network
- Check deployment status
- Review logs in real-time

### External Monitoring
```bash
# Setup health check cron (every 5 min)
*/5 * * * * curl -f https://your-app.railway.app/health || echo "OS Kernel down"
```

## Cost Optimization

- Railway Hobby: $5/month (500h compute)
- Railway Pro: $20/month + usage
- Optimize by:
  - Using Railway sleep feature for non-prod
  - Caching Supabase queries
  - CDN for static assets (if serving frontend)

## Security Notes

- Railway auto-provisions TLS certificates
- Use Railway secrets for sensitive env vars
- Rotate `SESSION_SECRET` periodically
- Monitor Supabase auth logs
- Review audit logs (`aethex_audit_log` table)

## Support

- Railway Docs: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
- AeThex Kernel Issues: Create GitHub issue in this repo
