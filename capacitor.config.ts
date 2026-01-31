import type { CapacitorConfig } from '@capacitor/cli';

// Live reload config - set LIVE_RELOAD_IP to your machine's local IP
// Example: LIVE_RELOAD_IP=192.168.1.100 npx cap sync
const liveReloadIP = process.env.LIVE_RELOAD_IP;

const config: CapacitorConfig = {
  appId: 'com.aethex.os',
  appName: 'AeThex OS',
  webDir: 'dist/public',
  server: {
    androidScheme: 'https',
    iosScheme: 'https',
    // Enable live reload when LIVE_RELOAD_IP is set
    ...(liveReloadIP && {
      url: `http://${liveReloadIP}:5000`,
      cleartext: true
    })
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
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    },
    LocalNotifications: {
      smallIcon: 'ic_stat_icon_config_sample',
      iconColor: '#488AFF',
      sound: 'beep.wav'
    }
  }
};

export default config;
