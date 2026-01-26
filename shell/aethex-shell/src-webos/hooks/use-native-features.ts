import { useEffect, useState } from 'react';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { PushNotifications } from '@capacitor/push-notifications';
import { Geolocation, Position } from '@capacitor/geolocation';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Network } from '@capacitor/network';
import { Toast } from '@capacitor/toast';
import { Clipboard } from '@capacitor/clipboard';
import { ScreenOrientation } from '@capacitor/screen-orientation';
import { Browser } from '@capacitor/browser';
import { App } from '@capacitor/app';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

interface UseNativeFeaturesReturn {
  // Camera
  takePhoto: () => Promise<string | null>;
  pickPhoto: () => Promise<string | null>;
  
  // Files
  saveFile: (data: string, filename: string) => Promise<boolean>;
  readFile: (filename: string) => Promise<string | null>;
  pickFile: () => Promise<string | null>;
  
  // Share
  shareText: (text: string, title?: string) => Promise<void>;
  shareUrl: (url: string, title?: string) => Promise<void>;
  
  // Notifications
  requestNotificationPermission: () => Promise<boolean>;
  sendLocalNotification: (title: string, body: string) => Promise<void>;
  
  // Location
  getCurrentLocation: () => Promise<Position | null>;
  watchLocation: (callback: (position: Position) => void) => () => void;
  
  // Network
  networkStatus: { connected: boolean; connectionType: string };
  
  // Clipboard
  copyToClipboard: (text: string) => Promise<void>;
  pasteFromClipboard: () => Promise<string>;
  
  // Screen
  lockOrientation: (orientation: 'portrait' | 'landscape') => Promise<void>;
  unlockOrientation: () => Promise<void>;
  
  // Browser
  openInBrowser: (url: string) => Promise<void>;
  
  // Toast
  showToast: (text: string, duration?: 'short' | 'long') => Promise<void>;
  
  // Haptics
  vibrate: (style?: 'light' | 'medium' | 'heavy') => Promise<void>;
}

export function useNativeFeatures(): UseNativeFeaturesReturn {
  const [networkStatus, setNetworkStatus] = useState({ connected: true, connectionType: 'unknown' });

  // Initialize network monitoring
  useEffect(() => {
    const initNetwork = async () => {
      const status = await Network.getStatus();
      setNetworkStatus({ connected: status.connected, connectionType: status.connectionType });
      
      Network.addListener('networkStatusChange', status => {
        setNetworkStatus({ connected: status.connected, connectionType: status.connectionType });
      });
    };
    
    initNetwork();
    
    return () => {
      Network.removeAllListeners();
    };
  }, []);

  // Camera functions
  const takePhoto = async (): Promise<string | null> => {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.Base64,
        source: CameraSource.Camera
      });
      return image.base64String || null;
    } catch (error) {
      console.error('Camera error:', error);
      return null;
    }
  };

  const pickPhoto = async (): Promise<string | null> => {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.Base64,
        source: CameraSource.Photos
      });
      return image.base64String || null;
    } catch (error) {
      console.error('Photo picker error:', error);
      return null;
    }
  };

  // File system functions
  const saveFile = async (data: string, filename: string): Promise<boolean> => {
    try {
      await Filesystem.writeFile({
        path: filename,
        data: data,
        directory: Directory.Documents,
        encoding: Encoding.UTF8
      });
      await showToast(`Saved ${filename}`, 'short');
      return true;
    } catch (error) {
      console.error('File save error:', error);
      return false;
    }
  };

  const readFile = async (filename: string): Promise<string | null> => {
    try {
      const result = await Filesystem.readFile({
        path: filename,
        directory: Directory.Documents,
        encoding: Encoding.UTF8
      });
      return result.data as string;
    } catch (error) {
      console.error('File read error:', error);
      return null;
    }
  };

  const pickFile = async (): Promise<string | null> => {
    // Note: Capacitor doesn't have a built-in file picker
    // You'd need to use a plugin like @capacitor-community/file-picker
    console.log('File picker not implemented - need @capacitor-community/file-picker');
    return null;
  };

  // Share functions
  const shareText = async (text: string, title?: string): Promise<void> => {
    try {
      await Share.share({
        text: text,
        title: title || 'Share',
        dialogTitle: 'Share via'
      });
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const shareUrl = async (url: string, title?: string): Promise<void> => {
    try {
      await Share.share({
        url: url,
        title: title || 'Share',
        dialogTitle: 'Share via'
      });
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  // Notification functions
  const requestNotificationPermission = async (): Promise<boolean> => {
    try {
      const result = await PushNotifications.requestPermissions();
      if (result.receive === 'granted') {
        await PushNotifications.register();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Notification permission error:', error);
      return false;
    }
  };

  const sendLocalNotification = async (title: string, body: string): Promise<void> => {
    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            title: title,
            body: body,
            id: Date.now(),
            schedule: { at: new Date(Date.now() + 1000) },
            sound: undefined,
            attachments: undefined,
            actionTypeId: '',
            extra: null
          }
        ]
      });
    } catch (error) {
      console.error('Local notification error:', error);
    }
  };

  // Location functions
  const getCurrentLocation = async (): Promise<Position | null> => {
    try {
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000
      });
      return position;
    } catch (error) {
      console.error('Location error:', error);
      return null;
    }
  };

  const watchLocation = (callback: (position: Position) => void) => {
    const watchId = Geolocation.watchPosition(
      { enableHighAccuracy: true },
      (position, err) => {
        if (position) callback(position);
      }
    );
    
    return () => {
      if (watchId) Geolocation.clearWatch({ id: watchId });
    };
  };

  // Clipboard functions
  const copyToClipboard = async (text: string): Promise<void> => {
    try {
      await Clipboard.write({ string: text });
      await showToast('Copied to clipboard', 'short');
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch (error) {
      console.error('Clipboard error:', error);
    }
  };

  const pasteFromClipboard = async (): Promise<string> => {
    try {
      const result = await Clipboard.read();
      return result.value;
    } catch (error) {
      console.error('Clipboard error:', error);
      return '';
    }
  };

  // Screen orientation
  const lockOrientation = async (orientation: 'portrait' | 'landscape'): Promise<void> => {
    try {
      await ScreenOrientation.lock({ orientation: orientation });
    } catch (error) {
      console.error('Orientation lock error:', error);
    }
  };

  const unlockOrientation = async (): Promise<void> => {
    try {
      await ScreenOrientation.unlock();
    } catch (error) {
      console.error('Orientation unlock error:', error);
    }
  };

  // Browser
  const openInBrowser = async (url: string): Promise<void> => {
    try {
      await Browser.open({ url });
    } catch (error) {
      console.error('Browser error:', error);
    }
  };

  // Toast
  const showToast = async (text: string, duration: 'short' | 'long' = 'short'): Promise<void> => {
    try {
      await Toast.show({
        text: text,
        duration: duration,
        position: 'bottom'
      });
    } catch (error) {
      console.error('Toast error:', error);
    }
  };

  // Haptics
  const vibrate = async (style: 'light' | 'medium' | 'heavy' = 'medium'): Promise<void> => {
    try {
      const styleMap = {
        light: ImpactStyle.Light,
        medium: ImpactStyle.Medium,
        heavy: ImpactStyle.Heavy
      };
      await Haptics.impact({ style: styleMap[style] });
    } catch (error) {
      console.error('Haptics error:', error);
    }
  };

  return {
    takePhoto,
    pickPhoto,
    saveFile,
    readFile,
    pickFile,
    shareText,
    shareUrl,
    requestNotificationPermission,
    sendLocalNotification,
    getCurrentLocation,
    watchLocation,
    networkStatus,
    copyToClipboard,
    pasteFromClipboard,
    lockOrientation,
    unlockOrientation,
    openInBrowser,
    showToast,
    vibrate
  };
}
