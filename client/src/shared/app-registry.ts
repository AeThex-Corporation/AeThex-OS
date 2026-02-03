// App Registry - Central registry for all AeThex OS applications
// Implements role-based access control and app capability management

export type AppId = string;

export interface AppDefinition {
  id: AppId;
  name: string;
  route?: string;
  icon?: string;
  roles?: string[];
  capabilities?: string[];
  hidden?: boolean;
  category?: string;
  description?: string;
}

// App Categories
export const AppCategories = {
  SYSTEM: "system",
  PRODUCTIVITY: "productivity",
  SOCIAL: "social",
  GAMES: "games",
  MEDIA: "media",
  DEVELOPER: "developer",
  FINANCE: "finance",
} as const;

// Mode determines the platform context
export enum Mode {
  Web = "web",
  Desktop = "desktop",
  Mobile = "mobile"
}

// Realm determines the access level
export enum Realm {
  Foundation = "foundation",   // Free tier - basic access
  Studio = "studio",           // Creator tier - full access  
  Network = "network"          // Enterprise tier - admin access
}

// App Registry - Core apps available in AeThex OS
export const AppRegistry: Record<AppId, AppDefinition> = {
  // System Apps
  terminal: {
    id: "terminal",
    name: "Terminal",
    icon: "Terminal",
    category: AppCategories.SYSTEM,
    roles: ["user", "admin"],
    capabilities: ["execute_commands"],
    description: "Command line interface"
  },
  settings: {
    id: "settings",
    name: "Settings",
    icon: "Settings",
    category: AppCategories.SYSTEM,
    roles: ["user", "admin"],
    description: "System preferences"
  },
  files: {
    id: "files",
    name: "Files",
    icon: "FolderOpen",
    category: AppCategories.SYSTEM,
    roles: ["user", "admin"],
    description: "File manager"
  },
  
  // Productivity Apps
  notes: {
    id: "notes",
    name: "Notes",
    icon: "StickyNote",
    category: AppCategories.PRODUCTIVITY,
    roles: ["user", "admin"],
    description: "Quick notes"
  },
  calculator: {
    id: "calculator",
    name: "Calculator",
    icon: "Calculator",
    category: AppCategories.PRODUCTIVITY,
    roles: ["user", "admin"],
    description: "Basic calculator"
  },
  
  // Social Apps
  chatbot: {
    id: "chatbot",
    name: "Chatbot",
    icon: "MessageCircle",
    category: AppCategories.SOCIAL,
    roles: ["user", "admin"],
    capabilities: ["ai_chat"],
    description: "AI assistant"
  },
  
  // Games
  minesweeper: {
    id: "minesweeper",
    name: "Minesweeper",
    icon: "Gamepad2",
    category: AppCategories.GAMES,
    roles: ["user", "admin"],
    description: "Classic puzzle game"
  },
  cookieClicker: {
    id: "cookieClicker",
    name: "Cookie Clicker",
    icon: "Cookie",
    category: AppCategories.GAMES,
    roles: ["user", "admin"],
    description: "Idle clicker game"
  },
  
  // Media Apps
  music: {
    id: "music",
    name: "Music",
    icon: "Music",
    category: AppCategories.MEDIA,
    roles: ["user", "admin"],
    description: "Music player"
  },
  gallery: {
    id: "gallery",
    name: "Gallery",
    icon: "Image",
    category: AppCategories.MEDIA,
    roles: ["user", "admin"],
    description: "Image viewer"
  },
  
  // Developer Apps
  browser: {
    id: "browser",
    name: "Browser",
    icon: "Globe",
    category: AppCategories.DEVELOPER,
    roles: ["user", "admin"],
    description: "Web browser"
  },
  
  // Finance Apps
  wallet: {
    id: "wallet",
    name: "Wallet",
    icon: "Briefcase",
    category: AppCategories.FINANCE,
    roles: ["user", "admin"],
    capabilities: ["payments"],
    description: "Digital wallet"
  },
  
  // Profile
  profile: {
    id: "profile",
    name: "Profile",
    icon: "User",
    category: AppCategories.SYSTEM,
    roles: ["user", "admin"],
    description: "User profile"
  },
  
  // Achievements
  achievements: {
    id: "achievements",
    name: "Achievements",
    icon: "Trophy",
    category: AppCategories.GAMES,
    roles: ["user", "admin"],
    description: "Your achievements"
  }
};

/**
 * Get app definition by ID
 */
export function getAppById(id: AppId): AppDefinition | undefined {
  return AppRegistry[id];
}

/**
 * List all registered apps
 */
export function listApps(): AppDefinition[] {
  return Object.values(AppRegistry);
}

/**
 * List apps by category
 */
export function listAppsByCategory(category: string): AppDefinition[] {
  return Object.values(AppRegistry).filter(app => app.category === category);
}

/**
 * Check if user can access a route based on their roles
 * @param user - User object with roles array
 * @param route - Route string to check
 * @returns boolean - Whether user has access
 */
export function canAccessRoute(user: { roles?: string[] } | null | undefined, route?: string): boolean {
  // No route means no restriction
  if (!route) return true;
  
  // Find app by route
  const app = Object.values(AppRegistry).find(a => a.route === route);
  
  // If no app found for route, allow access
  if (!app) return true;
  
  // If no roles defined on app, allow access
  if (!app.roles || app.roles.length === 0) return true;
  
  // If no user or no user roles, only allow if 'guest' is in app roles
  if (!user || !user.roles) {
    return app.roles.includes("guest");
  }
  
  // Check if any user role matches app roles
  return user.roles.some(role => app.roles?.includes(role));
}

/**
 * Check if user has specific capability
 */
export function hasCapability(user: { capabilities?: string[] } | null | undefined, capability: string): boolean {
  if (!user || !user.capabilities) return false;
  return user.capabilities.includes(capability);
}

/**
 * Get apps accessible by a user
 */
export function getAccessibleApps(user: { roles?: string[] } | null | undefined): AppDefinition[] {
  return Object.values(AppRegistry).filter(app => {
    if (app.hidden) return false;
    if (!app.roles || app.roles.length === 0) return true;
    if (!user || !user.roles) return app.roles.includes("guest");
    return user.roles.some(role => app.roles?.includes(role));
  });
}
