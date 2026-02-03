import { useState, useEffect, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { NativeBiometric, BiometryType } from 'capacitor-native-biometric';

interface BiometricAuthResult {
  isAvailable: boolean;
  biometricType: 'fingerprint' | 'face' | 'iris' | 'none';
  authenticate: (reason?: string) => Promise<boolean>;
  isAuthenticated: boolean;
  checkCredentials: () => Promise<boolean>;
  setCredentials: (username: string, password: string) => Promise<void>;
  deleteCredentials: () => Promise<void>;
}

export function useBiometricAuth(): BiometricAuthResult {
  const [isAvailable, setIsAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState<'fingerprint' | 'face' | 'iris' | 'none'>('none');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAvailability = async () => {
      if (!Capacitor.isNativePlatform()) {
        setIsAvailable(false);
        return;
      }

      try {
        const result = await NativeBiometric.isAvailable();
        setIsAvailable(result.isAvailable);
        
        // Map biometry type
        switch (result.biometryType) {
          case BiometryType.FINGERPRINT:
          case BiometryType.TOUCH_ID:
            setBiometricType('fingerprint');
            break;
          case BiometryType.FACE_ID:
          case BiometryType.FACE_AUTHENTICATION:
            setBiometricType('face');
            break;
          case BiometryType.IRIS_AUTHENTICATION:
            setBiometricType('iris');
            break;
          default:
            setBiometricType('none');
        }
      } catch (error) {
        console.error('Biometric availability check failed:', error);
        setIsAvailable(false);
      }
    };

    checkAvailability();
  }, []);

  const authenticate = useCallback(async (reason?: string): Promise<boolean> => {
    if (!isAvailable) return false;

    try {
      await NativeBiometric.verifyIdentity({
        reason: reason || 'Authenticate to access AeThex OS',
        title: 'Biometric Authentication',
        subtitle: 'Use your fingerprint or face',
        description: 'Verify your identity to continue',
      });
      
      setIsAuthenticated(true);
      return true;
    } catch (error) {
      console.error('Biometric auth error:', error);
      setIsAuthenticated(false);
      return false;
    }
  }, [isAvailable]);

  const checkCredentials = useCallback(async (): Promise<boolean> => {
    if (!Capacitor.isNativePlatform()) return false;
    try {
      await NativeBiometric.getCredentials({ server: 'com.aethex.os' });
      return true;
    } catch {
      return false;
    }
  }, []);

  const setCredentials = useCallback(async (username: string, password: string): Promise<void> => {
    if (!Capacitor.isNativePlatform()) return;
    await NativeBiometric.setCredentials({
      server: 'com.aethex.os',
      username,
      password,
    });
  }, []);

  const deleteCredentials = useCallback(async (): Promise<void> => {
    if (!Capacitor.isNativePlatform()) return;
    try {
      await NativeBiometric.deleteCredentials({ server: 'com.aethex.os' });
    } catch {
      // Credentials may not exist
    }
  }, []);

  return {
    isAvailable,
    biometricType,
    authenticate,
    isAuthenticated,
    checkCredentials,
    setCredentials,
    deleteCredentials,
  };
}
