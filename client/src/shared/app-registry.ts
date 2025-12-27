// Minimal app registry stub to satisfy imports and provide types
export type AppId = string;

export interface AppDefinition {
  id: AppId;
  name: string;
  route?: string;
  icon?: string;
  roles?: string[];
  capabilities?: string[];
  hidden?: boolean;
}

export const AppRegistry: Record<AppId, AppDefinition> = {};

export function getAppById(id: AppId): AppDefinition | undefined {
  return AppRegistry[id];
}

export function listApps(): AppDefinition[] {
  return Object.values(AppRegistry);
}

// Basic enums to satisfy mode/realm references
export enum Mode {
  Web = "web",
  Desktop = "desktop",
  Mobile = "mobile"
}

export enum Realm {
  Foundation = "foundation",
  Studio = "studio",
  Network = "network"
}

// Minimal route access check placeholder (always allows)
export function canAccessRoute(_user: unknown, _route?: string): boolean {
  return true;
}
