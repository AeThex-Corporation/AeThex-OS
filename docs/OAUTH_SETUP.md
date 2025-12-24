# OAuth Provider Setup Guide

## Overview
AeThex OS uses OAuth 2.0 to link external platform identities (Discord, Roblox, GitHub) to user accounts. This guide explains how to configure OAuth applications for each provider.

---

## 🔗 Redirect URIs

### Development Environment
When running locally, use these redirect URIs:

- **Discord:** `http://localhost:5000/api/oauth/callback/discord`
- **Roblox:** `http://localhost:5000/api/oauth/callback/roblox`
- **GitHub:** `http://localhost:5000/api/oauth/callback/github`

### Production Environment
For the live site at `aethex.app`, use:

- **Discord:** `https://aethex.app/api/oauth/callback/discord`
- **Roblox:** `https://aethex.app/api/oauth/callback/roblox`
- **GitHub:** `https://aethex.app/api/oauth/callback/github`

---

## 🎮 Discord OAuth App Setup

### 1. Create OAuth Application
1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application" and name it (e.g., "AeThex OS")
3. Navigate to **OAuth2** in the left sidebar

### 2. Configure Redirects
Add these redirect URIs:
```
http://localhost:5000/api/oauth/callback/discord
https://aethex.app/api/oauth/callback/discord
```

### 3. Configure Scopes
Required OAuth2 scopes:
- `identify` - Access user ID and username
- `email` - Access user email (optional but recommended)

### 4. Get Credentials
Copy from the OAuth2 page:
- **Client ID** → `DISCORD_CLIENT_ID`
- **Client Secret** → `DISCORD_CLIENT_SECRET`

Get from the **General Information** page:
- **Public Key** → `DISCORD_PUBLIC_KEY`

### 5. Bot Token (Optional)
If using Discord bot features, go to **Bot** section:
- **Token** → `DISCORD_BOT_TOKEN`

---

## 🎲 Roblox OAuth App Setup

### 1. Create OAuth Application
1. Go to [Roblox Creator Dashboard](https://create.roblox.com/dashboard/credentials)
2. Create a new **OAuth 2.0** credential
3. Select "Read" access to user profile information

### 2. Configure Redirects
Add these redirect URIs:
```
http://localhost:5000/api/oauth/callback/roblox
https://aethex.app/api/oauth/callback/roblox
```

### 3. Configure Scopes
Required scopes:
- `openid` - OpenID Connect authentication
- `profile` - Access to profile information

### 4. Get Credentials
Copy from credentials page:
- **Client ID** → `ROBLOX_CLIENT_ID`
- **Client Secret** → `ROBLOX_CLIENT_SECRET`

### 5. Open Cloud API Key (Optional)
For server-to-server API calls:
1. Go to [Open Cloud](https://create.roblox.com/dashboard/credentials)
2. Create new API key with required permissions
3. Copy key → `ROBLOX_OPEN_CLOUD_API_KEY`

---

## 🐙 GitHub OAuth App Setup

### 1. Create OAuth Application
1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click **OAuth Apps** → **New OAuth App**
3. Fill in application details:
   - **Application name:** AeThex OS
   - **Homepage URL:** `https://aethex.app`
   - **Authorization callback URL:** (see below)

### 2. Configure Redirect URI
Use ONE of these (GitHub only allows one per app):

**For Development:**
```
http://localhost:5000/api/oauth/callback/github
```

**For Production:**
```
https://aethex.app/api/oauth/callback/github
```

**💡 Best Practice:** Create TWO separate OAuth apps:
- `AeThex OS (Development)` for localhost
- `AeThex OS` for production

### 3. Get Credentials
Copy from OAuth app page:
- **Client ID** → `GITHUB_CLIENT_ID`
- **Client Secret** → `GITHUB_CLIENT_SECRET`

### 4. Personal Access Token (Optional)
For server-to-server API calls:
1. Go to [Personal Access Tokens](https://github.com/settings/tokens)
2. Generate new token (classic)
3. Select required scopes (e.g., `read:user`)
4. Copy token → `GITHUB_PERSONAL_ACCESS_TOKEN`

---

## 💳 Stripe Webhook Setup

### 1. Get API Keys
1. Go to [Stripe Dashboard](https://dashboard.stripe.com/apikeys)
2. Copy keys:
   - **Secret key** → `STRIPE_SECRET_KEY`

### 2. Configure Webhooks
1. Go to **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Set endpoint URL:
   - Dev: `http://localhost:5000/api/webhooks/stripe`
   - Prod: `https://aethex.app/api/webhooks/stripe`
4. Select events to listen for
5. Copy **Signing secret** → `STRIPE_WEBHOOK_SECRET`

---

## 🔐 Environment Variables

Add all credentials to `.env` file:

```bash
# Discord OAuth
DISCORD_CLIENT_ID=your_client_id
DISCORD_CLIENT_SECRET=your_client_secret
DISCORD_PUBLIC_KEY=your_public_key
DISCORD_BOT_TOKEN=your_bot_token

# GitHub OAuth
GITHUB_CLIENT_ID=your_client_id
GITHUB_CLIENT_SECRET=your_client_secret
GITHUB_PERSONAL_ACCESS_TOKEN=your_pat

# Roblox OAuth
ROBLOX_CLIENT_ID=your_client_id
ROBLOX_CLIENT_SECRET=your_client_secret
ROBLOX_OPEN_CLOUD_API_KEY=your_api_key

# Stripe
STRIPE_SECRET_KEY=your_secret_key
STRIPE_WEBHOOK_SECRET=your_webhook_secret
```

---

## ✅ Testing OAuth Flow

### 1. Start Development Server
```bash
npm run dev
```

### 2. Test Identity Linking
1. Log in to AeThex OS
2. Go to **Settings** page
3. Click "Link Discord" (or other provider)
4. Authorize on provider's page
5. Verify redirect back to AeThex OS
6. Check database for new `subject_identities` entry

### 3. Verify Security
- ✅ State parameter validated
- ✅ PKCE challenge verified (Roblox)
- ✅ Identity fetched server-side (not trusted from client)
- ✅ Duplicate identity detection working

---

## 🚨 Security Checklist

- [ ] Redirect URIs match exactly (trailing slash matters!)
- [ ] Client secrets stored in `.env`, never committed to git
- [ ] State tokens expire after 5 minutes
- [ ] HTTPS enforced in production
- [ ] PKCE used for Roblox OAuth
- [ ] Server-side identity verification (no client-provided IDs)
- [ ] Duplicate identity linking prevented
- [ ] Error messages don't leak sensitive info

---

## 🔄 Multi-Environment Strategy

### Option 1: Environment-Specific Apps (Recommended)
Create separate OAuth apps for each environment:
- `AeThex OS Dev` → localhost redirects
- `AeThex OS Staging` → staging.aethex.app redirects  
- `AeThex OS` → aethex.app redirects

Use different `.env` files for each environment.

### Option 2: Multiple Redirect URIs
Register all redirect URIs in a single app:
- Most providers allow multiple redirect URIs
- GitHub only allows one (requires separate apps)
- Use environment variables to select correct URI at runtime

---

## 📞 Support Links

- **Discord Developer Portal:** https://discord.com/developers/applications
- **Roblox Creator Dashboard:** https://create.roblox.com/dashboard/credentials
- **GitHub Developer Settings:** https://github.com/settings/developers
- **Stripe Dashboard:** https://dashboard.stripe.com/

---

## 🐛 Troubleshooting

### "Invalid redirect_uri" error
- Verify URI matches EXACTLY (no trailing slash difference)
- Check environment variable is set correctly
- Ensure OAuth app has URI registered

### "Invalid state" error
- State token expired (5 min limit)
- User started flow in different session
- Clear browser cache and try again

### "Identity already linked" error
- Provider account linked to different AeThex account
- User must unlink from original account first
- Check `subject_identities` table for conflicts

### Token exchange fails
- Verify client secret is correct
- Check provider's API status page
- Ensure code hasn't expired (1-time use, 10 min limit)
