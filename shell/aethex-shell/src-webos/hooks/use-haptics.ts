import React from 'react';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { isMobile } from '@/lib/platform';

/**
 * Haptic feedback hook for mobile interactions
 */
export function useHaptics() {
  const isAvailable = isMobile();

  const impact = async (style: 'light' | 'medium' | 'heavy' = 'medium') => {
    if (!isAvailable) return;
    try {
      const styleMap = {
        light: ImpactStyle.Light,
        medium: ImpactStyle.Medium,
        heavy: ImpactStyle.Heavy,
      };
      await Haptics.impact({ style: styleMap[style] });
    } catch (e) {
      // Haptics not supported on this device
    }
  };

  const notification = async (type: 'success' | 'warning' | 'error' = 'success') => {
    if (!isAvailable) return;
    try {
      const typeMap = {
        success: NotificationType.Success,
        warning: NotificationType.Warning,
        error: NotificationType.Error,
      };
      await Haptics.notification({ type: typeMap[type] });
    } catch (e) {
      // Haptics not supported
    }
  };

  const vibrate = async (duration: number = 50) => {
    if (!isAvailable) return;
    try {
      await Haptics.vibrate({ duration });
    } catch (e) {
      // Fallback to web vibration API
      if (navigator.vibrate) {
        navigator.vibrate(duration);
      }
    }
  };

  const selectionStart = async () => {
    if (!isAvailable) return;
    try {
      await Haptics.selectionStart();
    } catch (e) {
      // Not supported
    }
  };

  const selectionChanged = async () => {
    if (!isAvailable) return;
    try {
      await Haptics.selectionChanged();
    } catch (e) {
      // Not supported
    }
  };

  const selectionEnd = async () => {
    if (!isAvailable) return;
    try {
      await Haptics.selectionEnd();
    } catch (e) {
      // Not supported
    }
  };

  return {
    impact,
    notification,
    vibrate,
    selectionStart,
    selectionChanged,
    selectionEnd,
    isAvailable,
  };
}
