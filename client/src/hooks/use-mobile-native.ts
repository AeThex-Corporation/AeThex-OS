import { useState, useEffect } from 'react';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { Keyboard } from '@capacitor/keyboard';
import { Device } from '@capacitor/device';
import { isMobile } from '@/lib/platform';

/**
 * Initialize mobile-specific native features
 */
export function useMobileNative(theme: 'dark' | 'light' = 'dark') {
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState<any>(null);

  useEffect(() => {
    if (!isMobile()) return;

    const initMobileFeatures = async () => {
      // Get device info for recognition
      try {
        const info = await Device.getInfo();
        const id = await Device.getId();
        setDeviceInfo({ ...info, ...id });
        console.log('[Device Recognition]', info.manufacturer, info.model);
      } catch (e) {
        console.log('Device info unavailable');
      }

      // Always hide splash screen immediately
      try {
        await SplashScreen.hide({ fadeOutDuration: 100 });
      } catch (e) {
        console.log('Splash screen already hidden');
      }

      // Configure status bar for immersive mode
      setTimeout(async () => {
        try {
          await StatusBar.setStyle({ style: Style.Dark });
          await StatusBar.setBackgroundColor({ color: '#000000' });
          await StatusBar.setOverlaysWebView({ overlay: true });
          await StatusBar.hide();
        } catch (e) {
          console.log('Status bar config skipped');
        }
      }, 0);

      // Setup keyboard listeners (non-blocking)
      setTimeout(async () => {
        try {
          Keyboard.addListener('keyboardWillShow', () => {
            setKeyboardVisible(true);
          });
          Keyboard.addListener('keyboardWillHide', () => {
            setKeyboardVisible(false);
          });
        } catch (e) {
          console.log('Keyboard listeners skipped');
        }
      }, 0);
    };

    initMobileFeatures();

    return () => {
      if (isMobile()) {
        Keyboard.removeAllListeners().catch(() => {});
      }
    };
  }, [theme]);

  const hideKeyboard = async () => {
    if (!isMobile()) return;
    try {
      await Keyboard.hide();
    } catch (e) {
      // Not available
    }
  };

  return {
    keyboardVisible,
    hideKeyboard,
    deviceInfo,
  };
}
