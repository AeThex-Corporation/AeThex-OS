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
    console.log('[Platform] Detected: web (no window)');
    cachedPlatform = 'web';
    return cachedPlatform;
  }
  
  console.log('[Platform] Checking window.Capacitor:', window.Capacitor);
  console.log('[Platform] Checking window.__TAURI__:', window.__TAURI__);
  
  if (window.__TAURI__ !== undefined) {
    console.log('[Platform] Detected: desktop (Tauri)');
    cachedPlatform = 'desktop';
    return cachedPlatform;
  }
  
  if (window.flutter_inappwebview !== undefined || window.Capacitor !== undefined) {
    console.log('[Platform] Detected: mobile (Capacitor or Flutter)');
    cachedPlatform = 'mobile';
    return cachedPlatform;
  }
  
  const userAgent = navigator.userAgent.toLowerCase();
  console.log('[Platform] User agent:', userAgent);
  
  if (userAgent.includes('electron')) {
    console.log('[Platform] Detected: desktop (Electron)');
    cachedPlatform = 'desktop';
    return cachedPlatform;
  }
  
  if (userAgent.includes('cordova')) {
    console.log('[Platform] Detected: mobile (Cordova)');
    cachedPlatform = 'mobile';
    return cachedPlatform;
  }
  
  console.log('[Platform] Detected: web (default)');
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
