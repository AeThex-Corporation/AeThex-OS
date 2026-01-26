import type { Request, Response } from "express";
import { supabase } from "./supabase";

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email?: string;
      };
    }
  }
}

// OAuth State Management (in-memory for now, use Redis in production)
const oauthStates = new Map<string, { 
  userId: string; 
  provider: string; 
  codeVerifier?: string;
  createdAt: number;
}>();

// Clean up expired states (5 min TTL)
setInterval(() => {
  const now = Date.now();
  const keysToDelete: string[] = [];
  
  oauthStates.forEach((data, state) => {
    if (now - data.createdAt > 300000) {
      keysToDelete.push(state);
    }
  });
  
  keysToDelete.forEach(key => oauthStates.delete(key));
}, 60000);

/**
 * Start OAuth linking flow
 * Client calls this to get authorization URL
 */
export async function startOAuthLinking(req: Request, res: Response) {
  const { provider } = req.params;
  const userId = req.session?.userId;

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const validProviders = ["discord", "roblox", "github", "minecraft", "steam", "meta", "twitch", "youtube"];
  if (!validProviders.includes(provider)) {
    return res.status(400).json({ error: "Invalid provider" });
  }

  // Generate state token
  const state = crypto.randomUUID();
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);

  // Store state
  oauthStates.set(state, {
    userId,
    provider,
    codeVerifier,
    createdAt: Date.now()
  });

  // Build authorization URL
  const redirectUri = getRedirectUri(provider);
  const authUrl = buildAuthorizationUrl(provider, state, codeChallenge, redirectUri);

  res.json({ authUrl, state });
}

/**
 * OAuth callback handler
 * Provider redirects here with authorization code
 */
export async function handleOAuthCallback(req: Request, res: Response) {
  const { provider } = req.params;
  const { code, state } = req.query;

  if (!code || !state || typeof state !== "string") {
    return res.status(400).send("Invalid callback parameters");
  }

  // Validate state
  const stateData = oauthStates.get(state);
  if (!stateData || stateData.provider !== provider) {
    return res.status(400).send("Invalid or expired state");
  }

  oauthStates.delete(state);

  try {
    // Exchange code for token
    const tokenData = await exchangeCodeForToken(
      provider,
      code as string,
      getRedirectUri(provider),
      stateData.codeVerifier
    );

    // Fetch user identity from provider
    const identity = await fetchProviderIdentity(provider, tokenData.access_token);

    // Find or create subject
    const { data: existingSubject } = await supabase
      .from("aethex_subjects")
      .select("*")
      .eq("supabase_user_id", stateData.userId)
      .single();

    let subjectId: string;

    if (!existingSubject) {
      const { data: newSubject, error: createError } = await supabase
        .from("aethex_subjects")
        .insert({ supabase_user_id: stateData.userId })
        .select()
        .single();

      if (createError) throw createError;
      subjectId = newSubject.id;
    } else {
      subjectId = existingSubject.id;
    }

    // Check if identity already exists
    const { data: existingIdentity } = await supabase
      .from("aethex_subject_identities")
      .select("*")
      .eq("issuer", provider)
      .eq("external_id", identity.id)
      .single();

    if (existingIdentity && existingIdentity.subject_id !== subjectId) {
      return res.status(409).send(
        `This ${provider} account is already linked to another AeThex account.`
      );
    }

    if (!existingIdentity) {
      // Create new identity link
      await supabase
        .from("aethex_subject_identities")
        .insert({
          subject_id: subjectId,
          issuer: provider,
          external_id: identity.id,
          external_username: identity.username,
          verified: true,
          metadata: identity.metadata
        });
    }

    // Redirect to success page
    res.redirect(`${getAppBaseUrl()}/settings?oauth=success&provider=${provider}`);
  } catch (error) {
    console.error("OAuth callback error:", error);
    res.redirect(`${getAppBaseUrl()}/settings?oauth=error&provider=${provider}`);
  }
}

/**
 * Exchange authorization code for access token
 */
async function exchangeCodeForToken(
  provider: string,
  code: string,
  redirectUri: string,
  codeVerifier?: string
): Promise<{ access_token: string; token_type: string }> {
  const config = getProviderConfig(provider);

  const params = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
    client_id: config.clientId,
    client_secret: config.clientSecret,
  });

  if (codeVerifier && provider === "roblox") {
    params.append("code_verifier", codeVerifier);
  }

  const response = await fetch(config.tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Accept": "application/json"
    },
    body: params
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token exchange failed: ${error}`);
  }

  return response.json();
}

/**
 * Fetch user identity from provider
 */
async function fetchProviderIdentity(
  provider: string,
  accessToken: string
): Promise<{ id: string; username: string; metadata: any }> {
  const config = getProviderConfig(provider);

  const response = await fetch(config.userInfoUrl, {
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Accept": "application/json"
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${provider} user info`);
  }

  const data = await response.json();

  // Map provider-specific response to our format
  switch (provider) {
    case "discord":
      return {
        id: data.id,
        username: `${data.username}#${data.discriminator}`,
        metadata: {
          avatar: data.avatar,
          email: data.email,
          verified: data.verified
        }
      };

    case "roblox":
      return {
        id: data.sub,
        username: data.preferred_username || data.name,
        metadata: {
          profile: data.profile,
          picture: data.picture
        }
      };

    case "github":
      return {
        id: String(data.id),
        username: data.login,
        metadata: {
          name: data.name,
          email: data.email,
          avatar_url: data.avatar_url,
          html_url: data.html_url
        }
      };

    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

/**
 * Build OAuth authorization URL
 */
function buildAuthorizationUrl(
  provider: string,
  state: string,
  codeChallenge: string,
  redirectUri: string
): string {
  const config = getProviderConfig(provider);
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    state,
    scope: config.scope
  });

  if (provider === "roblox") {
    params.append("code_challenge", codeChallenge);
    params.append("code_challenge_method", "S256");
  }

  return `${config.authUrl}?${params}`;
}

/**
 * Get provider configuration
 */
function getProviderConfig(provider: string) {
  const configs = {
    discord: {
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
      authUrl: "https://discord.com/api/oauth2/authorize",
      tokenUrl: "https://discord.com/api/oauth2/token",
      userInfoUrl: "https://discord.com/api/users/@me",
      scope: "identify email"
    },
    roblox: {
      clientId: process.env.ROBLOX_CLIENT_ID!,
      clientSecret: process.env.ROBLOX_CLIENT_SECRET!,
      authUrl: "https://apis.roblox.com/oauth/v1/authorize",
      tokenUrl: "https://apis.roblox.com/oauth/v1/token",
      userInfoUrl: "https://apis.roblox.com/oauth/v1/userinfo",
      scope: "openid profile"
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      authUrl: "https://github.com/login/oauth/authorize",
      tokenUrl: "https://github.com/login/oauth/access_token",
      userInfoUrl: "https://api.github.com/user",
      scope: "read:user user:email"
    },
    minecraft: {
      clientId: process.env.MINECRAFT_CLIENT_ID!,
      clientSecret: process.env.MINECRAFT_CLIENT_SECRET!,
      authUrl: "https://login.microsoftonline.com/consumers/oauth2/v2.0/authorize",
      tokenUrl: "https://login.microsoftonline.com/consumers/oauth2/v2.0/token",
      userInfoUrl: "https://api.minecraftservices.com/minecraft/profile",
      scope: "XboxLive.signin offline_access"
    },
    steam: {
      clientId: process.env.STEAM_API_KEY!,
      clientSecret: process.env.STEAM_API_KEY!,
      authUrl: "https://steamcommunity.com/openid/login",
      tokenUrl: "https://steamcommunity.com/openid/login",
      userInfoUrl: "https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2",
      scope: ""
    },
    meta: {
      clientId: process.env.META_APP_ID!,
      clientSecret: process.env.META_APP_SECRET!,
      authUrl: "https://www.facebook.com/v18.0/dialog/oauth",
      tokenUrl: "https://graph.instagram.com/v18.0/oauth/access_token",
      userInfoUrl: "https://graph.instagram.com/me?fields=id,name,picture,username",
      scope: "user_profile,user_friends"
    },
    twitch: {
      clientId: process.env.TWITCH_CLIENT_ID!,
      clientSecret: process.env.TWITCH_CLIENT_SECRET!,
      authUrl: "https://id.twitch.tv/oauth2/authorize",
      tokenUrl: "https://id.twitch.tv/oauth2/token",
      userInfoUrl: "https://api.twitch.tv/helix/users",
      scope: "user:read:email channel:read:stream_key"
    },
    youtube: {
      clientId: process.env.YOUTUBE_CLIENT_ID!,
      clientSecret: process.env.YOUTUBE_CLIENT_SECRET!,
      authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
      tokenUrl: "https://oauth2.googleapis.com/token",
      userInfoUrl: "https://www.googleapis.com/oauth2/v2/userinfo",
      scope: "https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/youtube"
    }
  };

  return configs[provider as keyof typeof configs];
}

/**
 * Get OAuth redirect URI
 */
function getRedirectUri(provider: string): string {
  const baseUrl = process.env.NODE_ENV === "production"
    ? "https://aethex.app"
    : `http://localhost:${process.env.PORT || 5000}`;

  return `${baseUrl}/api/oauth/callback/${provider}`;
}

/**
 * Get app base URL
 */
function getAppBaseUrl(): string {
  return process.env.NODE_ENV === "production"
    ? "https://aethex.app"
    : `http://localhost:${process.env.PORT || 5000}`;
}

/**
 * PKCE helpers
 */
function generateCodeVerifier(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return base64UrlEncode(array);
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return base64UrlEncode(new Uint8Array(hash));
}

function base64UrlEncode(array: Uint8Array): string {
  return Buffer.from(array)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}
