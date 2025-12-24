import { z } from "zod";

// ============================================
// REALM: Authority + Policy Boundary
// ============================================
export const RealmSchema = z.enum(["foundation", "corporation"]);
export type Realm = z.infer<typeof RealmSchema>;

// ============================================
// MODE: Presentation + App Surface
// ============================================
export const ModeSchema = z.enum(["foundation", "corporation"]);
export type Mode = z.infer<typeof ModeSchema>;

// ============================================
// CAPABILITY: What APIs/Features Are Available
// ============================================
export const CapabilitySchema = z.enum([
  "credential_verification",
  "identity_linking",
  "education_programs",
  "commerce",
  "social",
  "messaging",
  "marketplace",
  "file_storage",
  "analytics",
]);
export type Capability = z.infer<typeof CapabilitySchema>;

// ============================================
// APP DEFINITION (Single Source of Truth)
// ============================================
export interface AppDefinition {
  id: string;
  name: string;
  path: string;
  icon: string;
  description: string;
  scope: "core" | "hub" | "os";
  requiresRealm: Realm | "either";
  requiresCapabilities: Capability[];
  navVisibleIn: Mode[];
  routes: string[]; // All routes this app controls (for guards)
}

// ============================================
// CANONICAL APP DICTIONARY
// ============================================
export const appsById: Record<string, AppDefinition> = {
  // CORE APPS (Foundation + Corporation)
  achievements: {
    id: "achievements",
    name: "Achievements",
    path: "/achievements",
    icon: "Trophy",
    description: "Verify credentials and badges",
    scope: "core",
    requiresRealm: "either",
    requiresCapabilities: ["credential_verification"],
    navVisibleIn: ["foundation", "corporation"],
    routes: ["/achievements"],
  },
  passport: {
    id: "passport",
    name: "Passport",
    path: "/passport",
    icon: "IdCard",
    description: "Your verified identity profile",
    scope: "core",
    requiresRealm: "either",
    requiresCapabilities: ["credential_verification"],
    navVisibleIn: ["foundation", "corporation"],
    routes: ["/passport"],
  },
  curriculum: {
    id: "curriculum",
    name: "Curriculum",
    path: "/curriculum",
    icon: "BookOpen",
    description: "Learning paths and programs",
    scope: "core",
    requiresRealm: "either",
    requiresCapabilities: ["education_programs"],
    navVisibleIn: ["foundation", "corporation"],
    routes: ["/curriculum"],
  },
  events: {
    id: "events",
    name: "Events",
    path: "/events",
    icon: "Calendar",
    description: "Programs and cohorts",
    scope: "core",
    requiresRealm: "either",
    requiresCapabilities: ["education_programs"],
    navVisibleIn: ["foundation", "corporation"],
    routes: ["/events"],
  },
  lab: {
    id: "lab",
    name: "Lab",
    path: "/lab",
    icon: "Code",
    description: "Development environment",
    scope: "core",
    requiresRealm: "either",
    requiresCapabilities: [],
    navVisibleIn: ["foundation", "corporation"],
    routes: ["/lab"],
  },
  network: {
    id: "network",
    name: "Network",
    path: "/network",
    icon: "Users",
    description: "Directory of verified builders and issuers",
    scope: "core",
    requiresRealm: "either",
    requiresCapabilities: [],
    navVisibleIn: ["foundation", "corporation"],
    routes: ["/network"],
  },

  // OS KERNEL (Both Modes)
  "os-link": {
    id: "os-link",
    name: "Identity Linking",
    path: "/os/link",
    icon: "Link2",
    description: "Link external accounts (Roblox, Discord, GitHub)",
    scope: "os",
    requiresRealm: "either",
    requiresCapabilities: ["identity_linking"],
    navVisibleIn: ["foundation", "corporation"],
    routes: ["/os/link", "/os/verify"],
  },

  // HUB APPS (Corporation Only)
  messaging: {
    id: "messaging",
    name: "Messaging",
    path: "/hub/messaging",
    icon: "MessageSquare",
    description: "Direct messaging",
    scope: "hub",
    requiresRealm: "corporation",
    requiresCapabilities: ["social", "messaging"],
    navVisibleIn: ["corporation"],
    routes: ["/hub/messaging"],
  },
  marketplace: {
    id: "marketplace",
    name: "Marketplace",
    path: "/hub/marketplace",
    icon: "ShoppingCart",
    description: "Access courses, tools, and services",
    scope: "hub",
    requiresRealm: "corporation",
    requiresCapabilities: ["commerce", "marketplace"],
    navVisibleIn: ["corporation"],
    routes: ["/hub/marketplace"],
  },
  projects: {
    id: "projects",
    name: "Projects",
    path: "/hub/projects",
    icon: "Briefcase",
    description: "Portfolio and project showcase",
    scope: "hub",
    requiresRealm: "corporation",
    requiresCapabilities: ["social"],
    navVisibleIn: ["corporation"],
    routes: ["/hub/projects"],
  },
  "code-gallery": {
    id: "code-gallery",
    name: "Code Gallery",
    path: "/hub/code-gallery",
    icon: "Code",
    description: "Share code and snippets",
    scope: "hub",
    requiresRealm: "corporation",
    requiresCapabilities: ["social"],
    navVisibleIn: ["corporation"],
    routes: ["/hub/code-gallery"],
  },
  notifications: {
    id: "notifications",
    name: "Notifications",
    path: "/hub/notifications",
    icon: "Bell",
    description: "Activity feed",
    scope: "hub",
    requiresRealm: "corporation",
    requiresCapabilities: ["social"],
    navVisibleIn: ["corporation"],
    routes: ["/hub/notifications"],
  },
  analytics: {
    id: "analytics",
    name: "Analytics",
    path: "/hub/analytics",
    icon: "BarChart3",
    description: "Activity and engagement metrics",
    scope: "hub",
    requiresRealm: "corporation",
    requiresCapabilities: ["analytics"],
    navVisibleIn: ["corporation"],
    routes: ["/hub/analytics"],
  },
  "file-manager": {
    id: "file-manager",
    name: "Files",
    path: "/hub/file-manager",
    icon: "Folder",
    description: "Cloud storage",
    scope: "hub",
    requiresRealm: "corporation",
    requiresCapabilities: ["file_storage"],
    navVisibleIn: ["corporation"],
    routes: ["/hub/file-manager"],
  },
  settings: {
    id: "settings",
    name: "Settings",
    path: "/hub/settings",
    icon: "Settings",
    description: "Preferences and configuration",
    scope: "hub",
    requiresRealm: "either",
    requiresCapabilities: [],
    navVisibleIn: ["foundation", "corporation"],
    routes: ["/hub/settings"],
  },
};

// ============================================
// MODE MANIFESTS (What Apps Are Visible)
// ============================================
export const modeManifests = {
  foundation: [
    "achievements",
    "passport",
    "curriculum",
    "events",
    "lab",
    "network",
    "os-link",
  ],
  corporation: [
    "achievements",
    "passport",
    "curriculum",
    "events",
    "lab",
    "network",
    "os-link",
    "messaging",
    "marketplace",
    "projects",
    "code-gallery",
    "notifications",
    "analytics",
    "file-manager",
    "settings",
  ],
};

// ============================================
// REALM CAPABILITIES
// ============================================
export const realmCapabilities: Record<Realm, Capability[]> = {
  foundation: ["credential_verification", "identity_linking", "education_programs"],
  corporation: [
    "credential_verification",
    "identity_linking",
    "education_programs",
    "commerce",
    "social",
    "messaging",
    "marketplace",
    "file_storage",
    "analytics",
  ],
};

// ============================================
// HELPER FUNCTIONS
// ============================================
export function getAppsByMode(mode: Mode): AppDefinition[] {
  return modeManifests[mode].map((id) => appsById[id]).filter(Boolean);
}

export function canAccessApp(app: AppDefinition, realm: Realm, mode: Mode): boolean {
  // Check if app is visible in this mode
  if (!app.navVisibleIn.includes(mode)) return false;

  // Check if realm has required capabilities
  const realmCaps = realmCapabilities[realm];
  return app.requiresCapabilities.every((cap) => realmCaps.includes(cap));
}

export function canAccessRoute(path: string, realm: Realm, mode: Mode): boolean {
  // Find app that owns this route
  const app = Object.values(appsById).find((a) =>
    a.routes.some((r) => path.startsWith(r))
  );

  if (!app) return true; // Unknown routes are allowed (e.g., login)

  return canAccessApp(app, realm, mode);
}

export const modeConfig = {
  foundation: {
    label: "AeThex Foundation",
    description: "Educational credentials and verification",
    color: "from-cyan-600 to-blue-600",
    capabilities: realmCapabilities.foundation,
  },
  corporation: {
    label: "AeThex Hub",
    description: "Full ecosystem with tools and community",
    color: "from-purple-600 to-pink-600",
    capabilities: realmCapabilities.corporation,
  },
};
