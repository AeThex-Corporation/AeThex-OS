import React, { createContext, useContext, useEffect } from 'react';
import { useHaptics } from '@/hooks/use-haptics';
import { isMobile } from '@/lib/platform';

interface HapticContextValue {
  triggerImpact: (style?: 'light' | 'medium' | 'heavy') => void;
  triggerNotification: (type?: 'success' | 'warning' | 'error') => void;
  triggerSelection: () => void;
}

const HapticContext = createContext<HapticContextValue>({
  triggerImpact: () => {},
  triggerNotification: () => {},
  triggerSelection: () => {},
});

export function useHapticFeedback() {
  return useContext(HapticContext);
}

interface HapticProviderProps {
  children: React.ReactNode;
  enableGlobalTouchFeedback?: boolean;
}

/**
 * Provider that enables haptic feedback throughout the app.
 * Wrap your app with this to enable automatic haptics on touch events.
 */
export function HapticProvider({ children, enableGlobalTouchFeedback = true }: HapticProviderProps) {
  const haptics = useHaptics();

  // Add global touch feedback for interactive elements
  useEffect(() => {
    if (!enableGlobalTouchFeedback || !isMobile()) return;

    const handleTouchStart = (e: TouchEvent) => {
      const target = e.target as HTMLElement;
      
      // Check if the touched element is interactive
      const isInteractive = 
        target.tagName === 'BUTTON' ||
        target.tagName === 'A' ||
        target.closest('button') ||
        target.closest('a') ||
        target.closest('[role="button"]') ||
        target.closest('[data-haptic]');

      if (isInteractive) {
        haptics.impact('light');
      }
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    return () => document.removeEventListener('touchstart', handleTouchStart);
  }, [enableGlobalTouchFeedback, haptics]);

  const value: HapticContextValue = {
    triggerImpact: (style = 'medium') => haptics.impact(style),
    triggerNotification: (type = 'success') => haptics.notification(type),
    triggerSelection: () => haptics.selectionChanged(),
  };

  return (
    <HapticContext.Provider value={value}>
      {children}
    </HapticContext.Provider>
  );
}

/**
 * HOC to add haptic feedback to any component
 */
export function withHapticFeedback<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  hapticStyle: 'light' | 'medium' | 'heavy' = 'light'
) {
  return function HapticWrapper(props: P & { onClick?: (e: React.MouseEvent) => void }) {
    const haptics = useHaptics();

    const handleClick = (e: React.MouseEvent) => {
      haptics.impact(hapticStyle);
      props.onClick?.(e);
    };

    return <WrappedComponent {...props} onClick={handleClick} />;
  };
}

export default HapticProvider;
