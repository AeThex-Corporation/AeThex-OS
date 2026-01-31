import type { CapacitorConfig } from '@capacitor/cli';

// Live reload configuration
// Set CAPACITOR_LIVE_RELOAD=true and CAPACITOR_SERVER_URL to enable
const isLiveReload = process.env.CAPACITOR_LIVE_RELOAD === 'true';
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
      launchShowDuration: 0,
      launchAutoHide: true,
      backgroundColor: '#000000',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      androidSpinnerStyle: 'large',
      iosSpinnerStyle: 'small',
      spinnerColor: '#999999',
      splashFullScreen: true,
      splashImmersive: true
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#000000',
      overlaysWebView: true
    },
    App: {
      backButtonEnabled: true
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    },
    LocalNotifications: {
      smallIcon: 'ic_stat_icon_config_sample',
      iconColor: '#488AFF',
      sound: 'beep.wav'
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

