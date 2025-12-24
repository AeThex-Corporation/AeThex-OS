# Credentials Rotation Guide

## 🚨 Security Incident Response

**If credentials are compromised (e.g., accidentally committed to git or shared publicly), follow this guide IMMEDIATELY.**

---

## 🔄 Rotation Priority Order

### 🔴 CRITICAL (Rotate Immediately)
1. **Discord Bot Token** - Full bot control
2. **Stripe Secret Key** - Payment processing access
3. **GitHub Personal Access Token** - Repository access

### 🟡 HIGH (Rotate Before Production)
4. **Discord Client Secret** - OAuth access
5. **Roblox Client Secret** - OAuth access
6. **Roblox Open Cloud API Key** - API access
7. **Stripe Webhook Secret** - Webhook validation

### 🟢 MEDIUM (Rotate When Convenient)
8. **Discord Public Key** - Webhook signature verification
9. **GitHub Client ID/Secret** - OAuth (once registered)

---

## 🎮 Discord Credentials Rotation

### 1. Bot Token
**Why:** Full control over bot actions, can read/send messages, access servers

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Select your application
3. Navigate to **Bot** section
4. Click **Reset Token**
5. Copy new token to `.env`:
   ```bash
   DISCORD_BOT_TOKEN=NEW_TOKEN_HERE
   ```
6. Restart your application

### 2. Client Secret
**Why:** Used for OAuth token exchange

1. In Discord Developer Portal, go to **OAuth2** section
2. Click **Reset Secret**
3. Copy new secret to `.env`:
   ```bash
   DISCORD_CLIENT_SECRET=NEW_SECRET_HERE
   ```
4. Restart your application

### 3. Public Key
**Why:** Used to verify webhook signatures (less critical but good practice)

1. In **General Information** section
2. Click **Regenerate** next to Public Key
3. Update `.env`:
   ```bash
   DISCORD_PUBLIC_KEY=NEW_KEY_HERE
   ```

---

## 🎲 Roblox Credentials Rotation

### 1. Client Secret
**Why:** Used for OAuth token exchange

1. Go to [Roblox Creator Dashboard](https://create.roblox.com/dashboard/credentials)
2. Find your OAuth 2.0 credential
3. Click **Regenerate Secret**
4. Copy new secret to `.env`:
   ```bash
   ROBLOX_CLIENT_SECRET=NEW_SECRET_HERE
   ```
5. Restart your application

### 2. Open Cloud API Key
**Why:** Server-to-server API access

1. In Creator Dashboard, go to **API Keys**
2. Find the compromised key
3. Click **Delete** to revoke it
4. Create new API key with same permissions
5. Copy to `.env`:
   ```bash
   ROBLOX_OPEN_CLOUD_API_KEY=NEW_KEY_HERE
   ```
6. Restart your application

**Note:** Old API key stops working immediately upon deletion.

---

## 🐙 GitHub Credentials Rotation

### 1. Personal Access Token
**Why:** Repository and API access

1. Go to [GitHub Personal Access Tokens](https://github.com/settings/tokens)
2. Find the compromised token
3. Click **Delete** to revoke it
4. Generate new token:
   - Click **Generate new token (classic)**
   - Select same scopes as before
   - Set expiration (recommend 90 days)
5. Copy to `.env`:
   ```bash
   GITHUB_PERSONAL_ACCESS_TOKEN=NEW_TOKEN_HERE
   ```
6. Restart your application

**Note:** Old token stops working immediately upon deletion.

### 2. OAuth Client Secret
**When you register OAuth app:**

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Select your OAuth app
3. Click **Generate a new client secret**
4. Copy to `.env`:
   ```bash
   GITHUB_CLIENT_SECRET=NEW_SECRET_HERE
   ```

---

## 💳 Stripe Credentials Rotation

### 1. Secret Key
**Why:** Full payment processing access - HIGHEST RISK

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/apikeys)
2. Click **Reveal test key** or **Reveal live key**
3. Click **Roll secret key**
4. Confirm the rollover
5. Copy new key to `.env`:
   ```bash
   STRIPE_SECRET_KEY=NEW_KEY_HERE
   ```
6. **Deploy immediately** - old key has grace period

**⚠️ Important:** 
- Old key works for 24-48 hours (grace period)
- Deploy new key ASAP to avoid disruption
- Test payments after deployment

### 2. Webhook Secret
**Why:** Validates webhook authenticity

1. Go to **Developers** → **Webhooks**
2. Click your webhook endpoint
3. Click **Roll secret**
4. Copy new secret to `.env`:
   ```bash
   STRIPE_WEBHOOK_SECRET=NEW_SECRET_HERE
   ```
5. Restart your application

**Note:** Old webhooks will fail signature validation immediately.

---

## 🔐 Supabase Credentials (If Needed)

### Anon Key
**Lower risk** - designed to be public, but rotation doesn't hurt

1. Go to [Supabase Dashboard](https://supabase.com/dashboard/project/_/settings/api)
2. Navigate to **Settings** → **API**
3. Click **Generate new anon key** (if available)
4. Update `.env`:
   ```bash
   SUPABASE_ANON_KEY=NEW_KEY_HERE
   VITE_SUPABASE_ANON_KEY=NEW_KEY_HERE
   ```

### Service Role Key
**CRITICAL** - full database access

1. In Supabase Dashboard, go to **Settings** → **API**
2. Click **Rotate service_role key**
3. Update server-side env (never expose to client)
4. Restart all server instances

---

## ✅ Post-Rotation Checklist

After rotating credentials:

### 1. Environment Variables
- [ ] Updated `.env` file with all new credentials
- [ ] Verified no typos in new keys
- [ ] Confirmed `.env` is in `.gitignore`
- [ ] Deleted old `.env` backups

### 2. Application Deployment
- [ ] Restarted local development server
- [ ] Tested OAuth flows with new credentials
- [ ] Verified webhook signatures validate
- [ ] Tested API calls work correctly

### 3. Production Deployment (When Ready)
- [ ] Updated production environment variables
- [ ] Deployed application with zero downtime
- [ ] Monitored logs for authentication errors
- [ ] Verified no legacy credential usage

### 4. Documentation
- [ ] Updated internal team docs with new setup
- [ ] Documented rotation date in security log
- [ ] Set calendar reminder for next rotation (90 days)

### 5. Access Control
- [ ] Removed compromised credentials from all locations:
  - [ ] Chat logs (can't delete, but rotate makes them useless)
  - [ ] Clipboard history
  - [ ] Shell history (`history -c`)
  - [ ] Git reflog (if accidentally committed)

---

## 🗓️ Rotation Schedule

### Recommended Rotation Frequency

| Credential | Frequency | Priority |
|------------|-----------|----------|
| Stripe Secret Key | Every 90 days | 🔴 Critical |
| Bot Tokens | Every 90 days | 🔴 Critical |
| Personal Access Tokens | Every 90 days | 🟡 High |
| OAuth Client Secrets | Every 180 days | 🟡 High |
| API Keys | Every 180 days | 🟡 High |
| Webhook Secrets | Every 180 days | 🟢 Medium |
| Public Keys | Annually | 🟢 Medium |

### Set Reminders
```bash
# Add to calendar or use cron job:
0 0 1 */3 * * echo "Rotate Stripe/Discord credentials" | mail admin@aethex.app
```

---

## 🚨 Git History Cleanup (If Committed)

**If credentials were accidentally committed to git:**

### Option 1: BFG Repo-Cleaner (Recommended)
```bash
# Install BFG
brew install bfg  # or download from https://rtyley.github.io/bfg-repo-cleaner/

# Clone a fresh copy
git clone --mirror https://github.com/AeThex-Corporation/AeThex-OS.git

# Remove .env files from history
bfg --delete-files .env AeThex-OS.git

# Clean up
cd AeThex-OS.git
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# Force push (⚠️ DESTRUCTIVE)
git push --force
```

### Option 2: git-filter-repo
```bash
# Install git-filter-repo
pip install git-filter-repo

# Remove .env from history
git filter-repo --path .env --invert-paths

# Force push
git push origin --force --all
```

**⚠️ Warning:** Force pushing rewrites history. Coordinate with team!

---

## 📞 Emergency Contacts

If credentials are actively being abused:

### Discord
- **Report abuse:** https://dis.gd/report
- **Developer support:** https://discord.com/developers/docs

### Stripe
- **Emergency contact:** https://support.stripe.com/
- **Phone support:** Available for paid plans

### GitHub
- **Security incidents:** security@github.com
- **Support:** https://support.github.com/

### Roblox
- **Security:** security@roblox.com
- **Support:** https://www.roblox.com/support

---

## 🧪 Testing After Rotation

Run these commands to verify new credentials work:

```bash
# Test Discord OAuth
curl "https://discord.com/api/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&redirect_uri=http://localhost:5000/api/oauth/callback/discord&response_type=code&scope=identify"

# Test Stripe API
curl https://api.stripe.com/v1/balance \
  -u ${STRIPE_SECRET_KEY}:

# Test GitHub API
curl -H "Authorization: token ${GITHUB_PERSONAL_ACCESS_TOKEN}" \
  https://api.github.com/user

# Test Roblox Open Cloud
curl -H "x-api-key: ${ROBLOX_OPEN_CLOUD_API_KEY}" \
  https://apis.roblox.com/cloud/v2/users/${USER_ID}
```

---

## 📝 Security Best Practices

### Prevention
1. **Never commit credentials** - Use `.env` and add to `.gitignore`
2. **Use environment-specific credentials** - Separate dev/staging/prod
3. **Rotate proactively** - Don't wait for incidents
4. **Monitor usage** - Watch API logs for suspicious activity
5. **Least privilege** - Grant minimum permissions needed

### Detection
1. **Enable webhook alerts** - Get notified of unusual API usage
2. **Monitor git commits** - Use pre-commit hooks to scan for secrets
3. **Audit logs** - Review provider dashboards regularly
4. **Automated scanning** - Use tools like `git-secrets` or `trufflehog`

### Response
1. **Have this document ready** - Don't scramble during incidents
2. **Test rotation process** - Practice on dev environment first
3. **Document incidents** - Learn from mistakes
4. **Automate where possible** - Use secret management tools

---

**Last Updated:** December 24, 2025  
**Next Review:** March 24, 2026
