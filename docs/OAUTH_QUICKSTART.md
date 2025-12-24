# OAuth Quick Start Guide

## 🚀 Get OAuth Working in 5 Minutes

### Step 1: Register OAuth Apps (5 min per provider)

#### Discord
1. Go to https://discord.com/developers/applications
2. Click "New Application" → Name it "AeThex OS Dev"
3. Go to **OAuth2** → Add redirect URI:
   ```
   http://localhost:5000/api/oauth/callback/discord
   ```
4. Copy **Client ID** and **Client Secret** to `.env`

#### Roblox
1. Go to https://create.roblox.com/dashboard/credentials
2. Create new **OAuth 2.0** credential
3. Add redirect URI:
   ```
   http://localhost:5000/api/oauth/callback/roblox
   ```
4. Select scopes: `openid`, `profile`
5. Copy **Client ID** and **Client Secret** to `.env`

#### GitHub
1. Go to https://github.com/settings/developers
2. Click **OAuth Apps** → **New OAuth App**
3. Fill in:
   - Name: `AeThex OS Dev`
   - Homepage: `http://localhost:5000`
   - Callback URL: `http://localhost:5000/api/oauth/callback/github`
4. Copy **Client ID** and **Client Secret** to `.env`

### Step 2: Verify Environment Variables

Your `.env` should have:
```bash
DISCORD_CLIENT_ID=your_discord_client_id
DISCORD_CLIENT_SECRET=your_discord_client_secret
ROBLOX_CLIENT_ID=your_roblox_client_id
ROBLOX_CLIENT_SECRET=your_roblox_client_secret
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
```

### Step 3: Test the OAuth Flow

```bash
# Start server
npm run dev

# In browser:
# 1. Log in to AeThex OS
# 2. Open browser console
# 3. Run this code:
fetch('/api/oauth/link/discord', { 
  method: 'POST',
  credentials: 'include'
})
  .then(r => r.json())
  .then(data => {
    console.log('Auth URL:', data.authUrl);
    window.location.href = data.authUrl; // Redirects to Discord
  });

# 4. Authorize on Discord
# 5. You'll be redirected back to /settings?oauth=success&provider=discord
```

### Step 4: Verify Database

```sql
-- Check if identity was created
SELECT * FROM aethex_subject_identities 
ORDER BY created_at DESC 
LIMIT 1;
```

---

## 🎯 Next Steps

### Add Frontend UI
Create a button in Settings page:

```tsx
// client/src/pages/settings.tsx
async function linkDiscord() {
  const res = await fetch('/api/oauth/link/discord', {
    method: 'POST',
    credentials: 'include'
  });
  const { authUrl } = await res.json();
  window.location.href = authUrl;
}

// Check for success on page load
useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  if (params.get('oauth') === 'success') {
    toast.success(`${params.get('provider')} account linked!`);
  }
}, []);
```

### For Production (aethex.app)
1. Create production OAuth apps with redirect URI:
   ```
   https://aethex.app/api/oauth/callback/{provider}
   ```
2. Add production credentials to production `.env`
3. Set `NODE_ENV=production`
4. Deploy!

---

## ⚠️ Security Reminders

**Before Production:**
1. ✅ Rotate ALL credentials (see `docs/CREDENTIALS_ROTATION.md`)
2. ✅ Use separate OAuth apps for dev/prod
3. ✅ Ensure `.env` is in `.gitignore`
4. ✅ Enable HTTPS in production
5. ✅ Replace in-memory state storage with Redis

---

## 📞 Need Help?

- **Setup issues:** See `docs/OAUTH_SETUP.md`
- **Security questions:** See `docs/CREDENTIALS_ROTATION.md`
- **Implementation details:** See `docs/OAUTH_IMPLEMENTATION.md`
- **Testing OAuth:** See "Testing Checklist" in implementation doc

---

**Status:** ✅ OAuth handler implemented and ready for testing  
**Build:** ✅ Compiles successfully  
**Next:** Register OAuth apps and test the flow!
