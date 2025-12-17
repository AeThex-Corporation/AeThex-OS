export type PlatformType = 'web' | 'desktop' | 'mobile';

declare global {
  interface Window {
    __TAURI__?: unknown;
    flutter_inappwebview?: unknown;
    Capacitor?: unknown;
  }
}

interface PlatformConfig {
  platform: PlatformType;
  apiBaseUrl: string;
  isSecureContext: boolean;
  supportsNotifications: boolean;
  supportsFileSystem: boolean;
}

let cachedPlatform: PlatformType | null = null;

function detectPlatform(): PlatformType {
  if (cachedPlatform !== null) return cachedPlatform;
  
  if (typeof window === 'undefined') {
    cachedPlatform = 'web';
    return cachedPlatform;
  }
  
  if (window.__TAURI__ !== undefined) {
    cachedPlatform = 'desktop';
    return cachedPlatform;
  }
  
  if (window.flutter_inappwebview !== undefined || window.Capacitor !== undefined) {
    cachedPlatform = 'mobile';
    return cachedPlatform;
  }
  
  const userAgent = navigator.userAgent.toLowerCase();
  
  if (userAgent.includes('electron')) {
    cachedPlatform = 'desktop';
    return cachedPlatform;
  }
  
  if (userAgent.includes('cordova')) {
    cachedPlatform = 'mobile';
    return cachedPlatform;
  }
  
  cachedPlatform = 'web';
  return cachedPlatform;
}

function getApiBaseUrl(): string {
  const platform = detectPlatform();
  
  if (platform === 'web') {
    return '';
  }
  
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (envUrl) return envUrl;
  
  return 'https://aethex.network';
}

export function getPlatformConfig(): PlatformConfig {
  const platform = detectPlatform();
  
  return {
    platform,
    apiBaseUrl: getApiBaseUrl(),
    isSecureContext: typeof window !== 'undefined' && window.isSecureContext,
    supportsNotifications: typeof Notification !== 'undefined',
    supportsFileSystem: typeof window !== 'undefined' && 'showOpenFilePicker' in window,
  };
}

export function isDesktop(): boolean {
  return detectPlatform() === 'desktop';
}

export function isMobile(): boolean {
  return detectPlatform() === 'mobile';
}

export function isWeb(): boolean {
  return detectPlatform() === 'web';
}

export const platformConfig = getPlatformConfig();
