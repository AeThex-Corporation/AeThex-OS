import { useState, useCallback, useEffect } from 'react';
import { Device } from '@capacitor/device';
import { isMobile } from '@/lib/platform';

export function useSamsungDex() {
  const [isDexMode, setIsDexMode] = useState(false);
  const [isLinkAvailable, setIsLinkAvailable] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState<any>(null);
  const [isChecking, setIsChecking] = useState(false);

  const checkDexMode = useCallback(async () => {
    if (!isMobile()) {
      setIsLinkAvailable(false);
      return false;
    }

    try {
      setIsChecking(true);

      const info = await Device.getInfo();
      setDeviceInfo(info);

      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;
      const aspectRatio = screenWidth / screenHeight;

      // Check for Samsung-specific APIs and user agent
      const hasSamsungAPIs = !!(
        (window as any).__SAMSUNG__ || 
        (window as any).samsung ||
        (window as any).SamsungLink
      );
      const isSamsung = navigator.userAgent.includes('SAMSUNG') || 
                       navigator.userAgent.includes('Samsung') ||
                       info.manufacturer?.toLowerCase().includes('samsung');

      // SAMSUNG LINK FOR WINDOWS DETECTION
      // Link mirrors phone screen to Windows PC - key indicators:
      // 1. Samsung device
      // 2. Desktop-sized viewport (>1024px width)
      // 3. Desktop aspect ratio (landscape)
      // 4. Navigator platform hints at Windows connection
      const isWindowsLink = isSamsung && 
                           screenWidth >= 1024 && 
                           aspectRatio > 1.3 &&
                           (navigator.userAgent.includes('Windows') || 
                            (window as any).SamsungLink ||
                            hasSamsungAPIs);

      // DeX (dock to monitor) vs Link (mirror to PC)
      // DeX: 1920x1080+ desktop mode
      // Link: 1024-1920 mirrored mode
      const isDex = screenWidth >= 1920 && aspectRatio > 1.5 && aspectRatio < 1.8;
      const isLink = screenWidth >= 1024 && screenWidth < 1920 && aspectRatio > 1.3;

      setIsDexMode(isDex || isWindowsLink);
      setIsLinkAvailable(isWindowsLink || isLink || hasSamsungAPIs);

      console.log('🔗 [SAMSUNG WINDOWS LINK DETECTION]', {
        screenWidth,
        screenHeight,
        aspectRatio,
        isSamsung,
        hasSamsungAPIs,
        isDex,
        isWindowsLink,
        manufacturer: info.manufacturer,
        platform: info.platform,
        userAgent: navigator.userAgent.substring(0, 100),
      });

      return isDex || isWindowsLink;
    } catch (err) {
      console.log('[DeX/Link Check] Error:', err);
      return false;
    } finally {
      setIsChecking(false);
    }
  }, []);

  useEffect(() => {
    checkDexMode();

    // Re-check on orientation change / window resize
    const handleResize = () => {
      checkDexMode();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [checkDexMode]);

  return {
    isDexMode,
    isLinkAvailable,
    deviceInfo,
    isChecking,
    checkDexMode,
  };
}
