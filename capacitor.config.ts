import type { CapacitorConfig } from '@capacitor/cli';

// Live reload configuration
// Set CAPACITOR_LIVE_RELOAD=true and CAPACITOR_SERVER_URL to enable
const isLiveReload = false; // process.env.CAPACITOR_LIVE_RELOAD === 'true';
const serverUrl = process.env.CAPACITOR_SERVER_URL || 'http://192.168.1.100:5000';

const config: CapacitorConfig = {
  appId: 'com.aethex.os',
  appName: 'AeThex OS',
  webDir: 'dist/public',
  server: {
    androidScheme: 'https',
    iosScheme: 'https',
    // Live reload: point to dev server instead of bundled assets
    ...(isLiveReload && {
      url: serverUrl,
      cleartext: true, // Allow HTTP for local development
    }),
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      launchFadeOutDuration: 500,
      backgroundColor: '#0a0a0a',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: true,
      androidSpinnerStyle: 'small',
      iosSpinnerStyle: 'small',
      spinnerColor: '#DC2626',
      splashFullScreen: true,
      splashImmersive: true
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#0a0a0a',
      overlaysWebView: false
    },
    App: {
      backButtonEnabled: true
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    },
    LocalNotifications: {
      smallIcon: 'ic_stat_icon_config_sample',
      iconColor: '#DC2626',
      sound: 'beep.wav'
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
      style: 'dark'
    },
    Haptics: {
      selectionStart: true,
      selectionChanged: true,
      selectionEnd: true
    }
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true,
    // Allow cleartext (HTTP) for live reload
    ...(isLiveReload && {
      allowMixedContent: true,
    }),
  },
  ios: {
    // iOS-specific live reload settings
    ...(isLiveReload && {
      limitsNavigationsToAppBoundDomains: false,
    }),
  },
};

export default config;
