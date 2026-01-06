import { useState, useCallback } from 'react';
import { isMobile } from '@/lib/platform';

export interface BiometricCheckResult {
  isAvailable: boolean;
  biometryType?: string;
}

export function useBiometricCheck() {
  const [isCheckingBio, setIsCheckingBio] = useState(false);
  const [bioAvailable, setBioAvailable] = useState(false);
  const [bioType, setBioType] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const checkBiometric = useCallback(async (): Promise<BiometricCheckResult> => {
    if (!isMobile()) {
      return { isAvailable: false };
    }

    try {
      setIsCheckingBio(true);
      setError(null);

      // Mock response for now
      console.log('[Biometric] Plugin not available - using mock');
      setBioAvailable(false);
      return { isAvailable: false };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Biometric check error';
      setError(message);
      console.log('[Biometric Check] Error:', message);
      return { isAvailable: false };
    } finally {
      setIsCheckingBio(false);
    }
  }, []);

  const authenticate = useCallback(async (reason: string = 'Authenticate') => {
    if (!bioAvailable) {
      setError('Biometric not available');
      return false;
    }

    try {
      // Mock auth for now
      console.log('[Biometric] Mock authentication');
      return false;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Authentication failed';
      setError(message);
      return false;
    }
  }, [bioAvailable]);

  return {
    bioAvailable,
    bioType,
    isCheckingBio,
    error,
    checkBiometric,
    authenticate,
  };
}
