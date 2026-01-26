# AeThex-OS Game Dev API Integration Guide

**Comprehensive game development and metaverse platform toolkit with support for all major gaming platforms, engines, and services.**

## Overview

AeThex-OS now includes **18+ integrated game development APIs**, enabling seamless integration with:
- **Gaming Platforms**: Minecraft, Roblox, Steam, Meta Horizon, Twitch, YouTube
- **Backend Services**: Epic Online Services (EOS), PlayFab, AWS GameLift
- **Game Engines**: Unity Cloud, Unreal Engine
- **AI/Analytics**: Anthropic Claude, Firebase, Segment
- **Payments**: Stripe, PayPal, Apple App Store, Google Play
- **3D Assets**: Sketchfab, Poly Haven, TurboSquid
- **CDN/Storage**: AWS S3

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│         AeThex-OS Game Dev Toolkit                      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────────┐  ┌──────────────────────────┐   │
│  │ Game Platforms   │  │ Backend Services         │   │
│  ├──────────────────┤  ├──────────────────────────┤   │
│  │ • Minecraft      │  │ • Epic Online Services   │   │
│  │ • Roblox         │  │ • PlayFab               │   │
│  │ • Steam          │  │ • AWS GameLift          │   │
│  │ • Meta Horizon   │  │ • Matchmaking           │   │
│  │ • Twitch         │  │ • Lobbies               │   │
│  │ • YouTube        │  │ • Leaderboards          │   │
│  └──────────────────┘  └──────────────────────────┘   │
│                                                         │
│  ┌──────────────────┐  ┌──────────────────────────┐   │
│  │ Game Engines     │  │ AI & Analytics           │   │
│  ├──────────────────┤  ├──────────────────────────┤   │
│  │ • Unity Cloud    │  │ • Anthropic Claude      │   │
│  │ • Unreal Engine  │  │ • Firebase              │   │
│  │ • Pixel Stream   │  │ • Segment.io            │   │
│  │ • Build tools    │  │ • Custom events         │   │
│  └──────────────────┘  └──────────────────────────┘   │
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Supabase + Postgres Database                     │  │
│  │ (game_accounts, game_profiles, game_sessions)    │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Quick Start

### 1. Install Dependencies

```bash
npm install game-dev-apis

# For specific services:
npm install @anthropic-ai/sdk @segment/analytics-next aws-sdk google-auth-library
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and fill in all API keys:

```bash
cp .env.example .env

# Edit .env with your credentials
nano .env
```

See `.env.example` for complete list of ~40+ required environment variables.

### 3. Initialize Game Dev APIs

```typescript
import { GameDevAPIs } from '@/server/game-dev-apis';

// Access any API:
const minecraftProfile = await GameDevAPIs.minecraft.getPlayerProfile(accessToken);
const steamAchievements = await GameDevAPIs.steam.getGameAchievements(appId, steamId);
const eosSessions = await GameDevAPIs.eos.createLobby(lobbyDetails);
```

## API Reference

### Gaming Platforms

#### Minecraft
```typescript
const minecraft = GameDevAPIs.minecraft;

// Get player profile
const profile = await minecraft.getPlayerProfile(accessToken);

// Get player skins
const skins = await minecraft.getPlayerSkins(uuid);

// Get friends
const friends = await minecraft.getFriendsList(accessToken);

// Verify security location
const verified = await minecraft.verifySecurityLocation(accessToken, ipAddress);
```

#### Roblox (via OAuth)
- Full OAuth2 integration via oauth-handlers.ts
- Sync user profile, avatar, game data
- Reputation scoring support

#### Steam
```typescript
const steam = GameDevAPIs.steam;

// Get player summaries
const summaries = await steam.getPlayerSummaries(steamIds);

// Get game achievements
const achievements = await steam.getGameAchievements(appId, steamId);

// Get player stats
const stats = await steam.getGameStats(appId, steamId);

// Get owned games
const games = await steam.getOwnedGames(steamId);

// Publish score to leaderboard
await steam.publishGameScore(appId, leaderboardId, score, steamId);
```

#### Meta Horizon Worlds
```typescript
const meta = GameDevAPIs.metaHorizon;

// Get world info
const world = await meta.getWorldInfo(worldId, accessToken);

// Get user profile
const profile = await meta.getUserProfile(userId, accessToken);

// Get avatar assets
const assets = await meta.getAvatarAssets(userId, accessToken);

// Create world event
await meta.createWorldEvent(worldId, eventData, accessToken);
```

#### Twitch
```typescript
const twitch = GameDevAPIs.twitch;

// Get active stream
const stream = await twitch.getStream(broadcasterId);

// Update stream
await twitch.updateStream(broadcasterId, title, gameId);

// Create clip
const clip = await twitch.createClip(broadcasterId);

// Get followers
const followers = await twitch.getFollowers(broadcasterId);
```

### Backend Services

#### Epic Online Services (Multiplayer)
```typescript
const eos = GameDevAPIs.eos;

// Create lobby
const lobby = await eos.createLobby({
  maxMembers: 64,
  isPublic: true,
  permissionLevel: "publicAdvertised"
});

// Join lobby
await eos.joinLobby(lobbyId, playerId);

// Start matchmaking
const match = await eos.startMatchmaking(queueName, playerIds);
```

#### PlayFab (Player Data & Backend)
```typescript
const playFab = GameDevAPIs.playFab;

// Get player profile
const profile = await playFab.getPlayerProfile(playerId);

// Update player stats
await playFab.updatePlayerStatistics(playerId, {
  level: 42,
  experience: 50000,
  wins: 100
});

// Grant items
await playFab.grantInventoryItems(playerId, ["item1", "item2"]);

// Execute cloud script
const result = await playFab.executeCloudScript(
  playerId,
  "MyFunction",
  { param1: "value1" }
);
```

#### AWS GameLift (Server Hosting)
```typescript
const gameLift = GameDevAPIs.gameLift;

// Request game session
const session = await gameLift.requestGameSession(playerId, {
  difficulty: "hard",
  region: "us-east-1"
});

// Get session details
const details = await gameLift.getGameSessionDetails(gameSessionId);

// Scale fleet
await gameLift.scaleFleet(20); // 20 instances
```

### Game Engines

#### Unity Cloud
```typescript
const unity = GameDevAPIs.unity;

// Build game
const build = await unity.buildGame({
  platform: "windows",
  buildName: "MyGame-v1.0",
  sceneList: ["Assets/Scenes/MainMenu", "Assets/Scenes/GamePlay"]
});

// Get build status
const status = await unity.getBuildStatus(buildId);

// Download artifacts
const artifacts = await unity.downloadBuildArtifacts(buildId);
```

#### Unreal Engine
```typescript
const unreal = GameDevAPIs.unreal;

// Start Pixel Streaming instance
const instance = await unreal.startPixelStreamInstance(appId);

// Get streaming status
const status = await unreal.getPixelStreamingStatus(sessionId);

// Send input
await unreal.sendPixelStreamingInput(sessionId, inputData);
```

### AI & Analytics

#### Anthropic Claude
```typescript
const claude = GameDevAPIs.claude;

// Chat with AI
const response = await claude.chat([
  { role: "user", content: "Analyze this gameplay session..." }
]);

// Analyze gameplay
const analysis = await claude.analyzeGameplay(gameplayDescription);
```

#### Firebase
```typescript
const firebase = GameDevAPIs.firebase;

// Track event
await firebase.trackEvent(userId, "level_completed", {
  level: 5,
  time: 120,
  difficulty: "hard"
});

// Log crash
await firebase.logCrash(userId, errorMessage, stackTrace);
```

#### Segment Analytics
```typescript
const segment = GameDevAPIs.segment;

// Track user action
await segment.track(userId, "game_purchased", {
  gameId: "game123",
  price: 29.99,
  platform: "steam"
});

// Identify user
await segment.identify(userId, {
  email: "user@example.com",
  level: 42,
  joinedAt: new Date()
});
```

### Storage & Assets

#### AWS S3
```typescript
const s3 = GameDevAPIs.s3;

// Upload game asset
await s3.uploadGameAsset("game/models/player.glb", buffer, "model/gltf-binary");

// Get asset URL
const url = await s3.getAssetUrl("game/models/player.glb");

// List assets
const assets = await s3.listGameAssets("game/models/");
```

#### 3D Asset Services
```typescript
const assets = GameDevAPIs.assets;

// Search Sketchfab
const sketchfabModels = await assets.searchSketchfab("character rigged");

// Search Poly Haven
const phTextures = await assets.searchPolyHaven("textures", "wood");

// Search TurboSquid
const tsAssets = await assets.getTurboSquidAssets("sci-fi spaceship");
```

### Payments

#### PayPal
```typescript
const paypal = GameDevAPIs.paypal;

// Create order
const order = await paypal.createOrder([
  { name: "Game Bundle", quantity: 1, price: "29.99" }
]);

// Capture payment
const payment = await paypal.capturePayment(orderId);
```

#### Apple App Store
```typescript
const appStore = GameDevAPIs.appStore;

// Validate receipt
const receipt = await appStore.validateReceipt(transactionId);

// Get transaction history
const history = await appStore.getTransactionHistory(originalTransactionId);
```

#### Google Play
```typescript
const googlePlay = GameDevAPIs.googlePlay;

// Validate purchase
const validation = await googlePlay.validatePurchaseToken(productId, token);
```

## Database Schema

### Game Accounts
Link user account to external game platforms (Minecraft, Steam, etc.)

```sql
table game_accounts {
  id uuid primary key
  user_id uuid
  platform text (minecraft, roblox, steam, meta, etc)
  account_id text
  username text
  verified boolean
  metadata jsonb
  access_token text (encrypted)
  connected_at timestamp
}
```

### Game Profiles
Player statistics and platform-specific data

```sql
table game_profiles {
  id uuid primary key
  user_id uuid
  minecraft_uuid text
  steam_level integer
  roblox_level integer
  total_playtime integer
  last_played timestamp
}
```

### Game Sessions
Track multiplayer game sessions

```sql
table game_sessions {
  id uuid primary key
  server_id uuid
  session_code text
  game_mode text
  players text array
  state text (waiting, active, finished)
}
```

### Game Events
Analytics and telemetry

```sql
table game_events {
  id uuid primary key
  user_id uuid
  session_id uuid
  event_type text
  event_data jsonb
  created_at timestamp
}
```

### Game Items
In-game inventory and marketplace

```sql
table game_items {
  id uuid primary key
  project_id uuid
  item_name text
  rarity text
  price integer
  owned_by uuid
  tradeable boolean
  listed_at timestamp
}
```

### Game Wallets
User balance and payment methods

```sql
table game_wallets {
  id uuid primary key
  user_id uuid
  balance integer (in-game currency)
  real_balance text (USD)
  paypal_email text
  stripe_customer_id text
}
```

## OAuth Integration

All platforms support OAuth2 with platform detection:

```typescript
// Start OAuth flow
POST /api/oauth/link/{provider}

// Callback handler
GET /api/oauth/callback/{provider}?code=...&state=...

// Supported providers:
// - discord, roblox, github (existing)
// - minecraft, steam, meta, twitch, youtube (new)
```

## Event Tracking

Automatic event tracking via Segment + Firebase:

```typescript
// Automatically tracked:
- Player joined session
- Player left session
- Achievement unlocked
- Item purchased
- Match completed
- Score submitted
- Friend added
- World created
```

## Monitoring & Debugging

### Enable debug logging:

```typescript
import { GameDevAPIs } from '@/server/game-dev-apis';

// All API calls logged to console
process.env.DEBUG_GAME_APIS = 'true';
```

### Health check endpoints:

```
GET /api/health/game-apis
GET /api/health/game-apis/:service
```

## Best Practices

### 1. Token Management
- Refresh tokens automatically before expiry
- Store encrypted in database
- Never expose in client code

### 2. Rate Limiting
- Implement per-service rate limits
- Cache responses when possible
- Use exponential backoff for retries

### 3. Error Handling
```typescript
try {
  await GameDevAPIs.minecraft.getPlayerProfile(token);
} catch (error) {
  if (error.code === 'UNAUTHORIZED') {
    // Refresh token
  } else if (error.code === 'RATE_LIMIT') {
    // Wait and retry
  }
}
```

### 4. Security
- Validate all inputs
- Use HTTPS only
- Implement CORS properly
- Rotate API keys regularly
- Use environment variables for secrets

## Troubleshooting

### "Invalid provider" error
- Check `oauth-handlers.ts` for provider configuration
- Ensure environment variables are set
- Verify provider OAuth app registration

### "Rate limit exceeded"
- Implement exponential backoff
- Cache responses
- Contact provider for quota increase

### "Token expired"
- Automatic refresh via `refreshToken` field
- Check token expiration time
- Re-authenticate if needed

### "Connection refused"
- Verify API endpoint URLs
- Check network connectivity
- Review provider API status page

## Support & Resources

- **Minecraft**: https://learn.microsoft.com/en-us/gaming/
- **Roblox**: https://create.roblox.com/docs/
- **Steam**: https://partner.steamgames.com/doc/
- **Meta Horizon**: https://developers.meta.com/docs/horizon/
- **Epic Online Services**: https://dev.epicgames.com/docs/
- **PlayFab**: https://learn.microsoft.com/en-us/gaming/playfab/
- **Firebase**: https://firebase.google.com/docs
- **AWS GameLift**: https://docs.aws.amazon.com/gamelift/

## Next Steps

1. **Set up environment variables** - Copy `.env.example` and fill in credentials
2. **Run migrations** - Update database with new game schema tables
3. **Test OAuth flows** - Verify each platform authentication
4. **Build first integration** - Start with your primary game platform
5. **Monitor events** - Track player activity via analytics

---

**AeThex-OS Game Dev Toolkit v1.0** - Empowering the next generation of game developers
