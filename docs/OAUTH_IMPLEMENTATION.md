# OAuth Implementation Summary

## ✅ What Was Implemented

### 1. Server-Side OAuth Handler (`server/oauth-handlers.ts`)
- **Purpose:** Secure OAuth 2.0 identity linking for Discord, Roblox, and GitHub
- **Security:** Server-side identity verification prevents client-side spoofing
- **Features:**
  - State token validation (5-minute TTL)
  - PKCE support for Roblox OAuth
  - Automatic subject/identity creation
  - Duplicate identity detection
  - Provider-specific identity mapping

### 2. OAuth Routes (`server/routes.ts`)
Added two new endpoints:
- `POST /api/oauth/link/:provider` - Start OAuth flow (get authorization URL)
- `GET /api/oauth/callback/:provider` - OAuth callback handler

### 3. Documentation
- **OAuth Setup Guide** (`docs/OAUTH_SETUP.md`)
  - Provider registration instructions
  - Redirect URI configuration
  - Environment variable setup
  - Testing procedures
  
- **Credentials Rotation Guide** (`docs/CREDENTIALS_ROTATION.md`)
  - Emergency response procedures
  - Provider-specific rotation steps
  - Security best practices
  - Automated rotation schedules

---

## 🔒 Security Improvements

### Before (Vulnerable)
```typescript
// Client submits external_id - easily spoofed!
POST /api/link { provider: "discord", external_id: "123" }
```

### After (Secure)
```typescript
// 1. Client requests authorization URL
POST /api/oauth/link/discord
→ Returns: { authUrl: "https://discord.com/...", state: "..." }

// 2. User authorizes on Discord
→ Redirects to callback with code

// 3. Server exchanges code for token
GET /api/oauth/callback/discord?code=abc&state=xyz
→ Server calls Discord API to get real user ID
→ Creates identity link with verified ID
```

**Key Security Features:**
- ✅ Server fetches identity from provider (can't be faked)
- ✅ State tokens prevent CSRF attacks
- ✅ PKCE prevents authorization code interception (Roblox)
- ✅ Duplicate identity detection (one provider account = one AeThex account)
- ✅ In-memory state storage with automatic cleanup

---

## 🚀 How to Use

### For Users (Frontend Integration)

```typescript
// 1. Start linking flow
const response = await fetch(`/api/oauth/link/discord`, {
  method: 'POST',
  credentials: 'include' // Include session cookie
});

const { authUrl, state } = await response.json();

// 2. Redirect user to provider
window.location.href = authUrl;

// 3. User returns to /settings?oauth=success&provider=discord
// Check query params to show success message
```

### For Developers

#### Testing Locally
1. Register OAuth apps with localhost redirect URIs:
   - Discord: `http://localhost:5000/api/oauth/callback/discord`
   - Roblox: `http://localhost:5000/api/oauth/callback/roblox`
   - GitHub: `http://localhost:5000/api/oauth/callback/github`

2. Add credentials to `.env`:
   ```bash
   DISCORD_CLIENT_ID=...
   DISCORD_CLIENT_SECRET=...
   ROBLOX_CLIENT_ID=...
   ROBLOX_CLIENT_SECRET=...
   GITHUB_CLIENT_ID=...
   GITHUB_CLIENT_SECRET=...
   ```

3. Start dev server:
   ```bash
   npm run dev
   ```

4. Test flow:
   - Log in to AeThex OS
   - Go to Settings page
   - Click "Link Discord" button
   - Authorize on Discord
   - Verify redirect back with success message
   - Check database for new `aethex_subject_identities` row

---

## 📊 Database Changes

### New Records Created

When a user links Discord account:

**aethex_subjects** (if first identity):
```sql
INSERT INTO aethex_subjects (supabase_user_id)
VALUES ('uuid-of-supabase-user');
```

**aethex_subject_identities**:
```sql
INSERT INTO aethex_subject_identities (
  subject_id,
  issuer,
  external_id,
  external_username,
  verified,
  metadata
) VALUES (
  'uuid-of-subject',
  'discord',
  '123456789',
  'username#1234',
  true,
  '{"avatar": "...", "email": "...", "verified": true}'
);
```

### Querying Linked Identities

```sql
-- Get all identities for a user
SELECT si.*
FROM aethex_subject_identities si
JOIN aethex_subjects s ON s.id = si.subject_id
WHERE s.supabase_user_id = 'user-uuid';

-- Check if Discord account already linked
SELECT s.supabase_user_id
FROM aethex_subject_identities si
JOIN aethex_subjects s ON s.id = si.subject_id
WHERE si.issuer = 'discord'
  AND si.external_id = '123456789';
```

---

## 🔧 Configuration

### Environment Variables Required

```bash
# Development
NODE_ENV=development
PORT=5000

# Discord OAuth
DISCORD_CLIENT_ID=your_dev_client_id
DISCORD_CLIENT_SECRET=your_dev_client_secret

# Roblox OAuth
ROBLOX_CLIENT_ID=your_dev_client_id
ROBLOX_CLIENT_SECRET=your_dev_client_secret

# GitHub OAuth
GITHUB_CLIENT_ID=your_dev_client_id
GITHUB_CLIENT_SECRET=your_dev_client_secret

# Production
NODE_ENV=production
# ... same variables with production credentials
```

### Redirect URI Logic

The handler automatically determines the correct redirect URI based on `NODE_ENV`:

```typescript
function getRedirectUri(provider: string): string {
  const baseUrl = process.env.NODE_ENV === "production"
    ? "https://aethex.app"
    : `http://localhost:${process.env.PORT || 5000}`;

  return `${baseUrl}/api/oauth/callback/${provider}`;
}
```

---

## 🧪 Testing Checklist

### Manual Testing
- [ ] Start OAuth flow for each provider
- [ ] Complete authorization on provider site
- [ ] Verify redirect back to AeThex OS
- [ ] Check database for new identity record
- [ ] Try linking same provider account twice (should succeed, no duplicate)
- [ ] Try linking already-linked account to different AeThex user (should fail with 409)
- [ ] Test expired state token (wait 5+ minutes before callback)
- [ ] Test invalid state parameter (manually edit callback URL)

### Security Testing
- [ ] Cannot link identity without being logged in
- [ ] Cannot reuse authorization code (one-time use)
- [ ] State token validated and deleted after use
- [ ] Provider account can't be linked to multiple AeThex accounts
- [ ] Server fetches identity (client can't spoof external_id)

### Edge Cases
- [ ] User closes browser during OAuth flow
- [ ] Network error during token exchange
- [ ] Provider API returns invalid response
- [ ] User denies authorization on provider site

---

## 🐛 Troubleshooting

### "Invalid redirect_uri"
**Cause:** OAuth app redirect URI doesn't match exactly
**Fix:** 
1. Check `.env` has correct `NODE_ENV` value
2. Verify OAuth app has correct URI registered
3. Ensure no trailing slash differences

### "Invalid state"
**Cause:** State token expired (5 min) or browser started new session
**Fix:**
1. Start OAuth flow again
2. Complete within 5 minutes
3. Don't open multiple OAuth flows in parallel

### "Identity already linked"
**Cause:** Provider account linked to different AeThex account
**Fix:**
1. User must log in to original AeThex account
2. Unlink identity from settings (TODO: implement unlink endpoint)
3. Try linking again from new account

### Build errors
**Cause:** Missing type declarations or import paths
**Fix:**
1. Run `npm install` to ensure all dependencies installed
2. Check TypeScript errors: `npx tsc --noEmit`
3. Verify import paths use relative paths (not `@/` aliases in server)

---

## 🚧 TODO / Future Improvements (UNFINISHED FLOWS)

> **Note:** These items are tracked in `/FLOWS.md` - update both documents when completing items.

### High Priority
- [ ] **[UNFINISHED]** Implement unlink endpoint: `DELETE /api/oauth/unlink/:provider`
- [ ] Add frontend UI for identity linking (Settings page)
- [ ] Redis/database for state storage (replace in-memory Map)
- [ ] Rate limiting on OAuth endpoints
- [ ] Logging/monitoring for OAuth events

### Medium Priority
- [ ] Refresh token support (for long-lived access)
- [ ] Scope customization per provider
- [ ] Additional providers (Twitter/X, Google, Steam)
- [ ] Admin panel to view linked identities
- [ ] Webhook for identity verification events

### Low Priority
- [ ] OAuth 2.1 compatibility
- [ ] Multiple identities per provider (e.g., 2 Discord accounts)
- [ ] Identity verification challenges
- [ ] Automated credential rotation reminders

---

## 📚 References

- [Discord OAuth2 Docs](https://discord.com/developers/docs/topics/oauth2)
- [Roblox OAuth 2.0 Guide](https://create.roblox.com/docs/cloud/open-cloud/oauth2-overview)
- [GitHub OAuth Apps](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps)
- [OAuth 2.0 RFC 6749](https://datatracker.ietf.org/doc/html/rfc6749)
- [PKCE RFC 7636](https://datatracker.ietf.org/doc/html/rfc7636)

---

**Implemented:** December 24, 2025  
**Domain:** aethex.app  
**Status:** ✅ Ready for testing (requires OAuth app registration)
