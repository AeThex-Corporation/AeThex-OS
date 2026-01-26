import { useMemo } from 'react';
import { isMobile, isDesktop, isWeb } from '@/lib/platform';

interface LayoutConfig {
  isMobile: boolean;
  isDesktop: boolean;
  isWeb: boolean;
  containerClass: string;
  cardClass: string;
  navClass: string;
  spacing: string;
  fontSize: string;
}

/**
 * Hook to get platform-specific layout configuration
 * Use this to conditionally render or style components based on platform
 */
export function usePlatformLayout(): LayoutConfig {
  // Call detection functions once and cache
  const platformCheck = useMemo(() => {
    const mobile = isMobile();
    const desktop = isDesktop();
    const web = isWeb();
    return { isMobile: mobile, isDesktop: desktop, isWeb: web };
  }, []); // Empty array - only check once on mount

  const config = useMemo((): LayoutConfig => {
    if (platformCheck.isMobile) {
      return {
        ...platformCheck,
        // Mobile-first container styling
        containerClass: 'px-4 py-3 max-w-full',
        cardClass: 'rounded-lg shadow-sm border p-4',
        navClass: 'fixed bottom-0 left-0 right-0 bg-background border-t',
        spacing: 'space-y-3',
        fontSize: 'text-base',
      };
    }

    if (platformCheck.isDesktop) {
      return {
        ...platformCheck,
        // Desktop app styling
        containerClass: 'px-8 py-6 max-w-7xl mx-auto',
        cardClass: 'rounded-xl shadow-lg border p-6',
        navClass: 'fixed top-0 left-0 right-0 bg-background border-b',
        spacing: 'space-y-6',
        fontSize: 'text-sm',
      };
    }

    // Web browser styling (default)
    return {
      ...platformCheck,
      containerClass: 'px-6 py-4 max-w-6xl mx-auto',
      cardClass: 'rounded-xl shadow-md border p-6',
      navClass: 'sticky top-0 bg-background/95 backdrop-blur border-b z-50',
      spacing: 'space-y-4',
      fontSize: 'text-sm',
    };
  }, [platformCheck]);

  return config;
}

/**
 * Get platform-specific class names
 */
export function usePlatformClasses() {
  const layout = usePlatformLayout();
  
  return {
    container: layout.containerClass,
    card: layout.cardClass,
    nav: layout.navClass,
    spacing: layout.spacing,
    fontSize: layout.fontSize,
    // Additional utility classes
    button: layout.isMobile ? 'h-12 text-base' : 'h-10 text-sm',
    input: layout.isMobile ? 'h-12 text-base' : 'h-10 text-sm',
    heading: layout.isMobile ? 'text-2xl' : 'text-3xl',
    subheading: layout.isMobile ? 'text-lg' : 'text-xl',
  };
}

/**
 * Conditional rendering based on platform
 */
export function PlatformSwitch({ 
  mobile, 
  desktop, 
  web, 
  fallback 
}: { 
  mobile?: React.ReactNode;
  desktop?: React.ReactNode;
  web?: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  if (isMobile() && mobile) return mobile as React.ReactElement;
  if (isDesktop() && desktop) return desktop as React.ReactElement;
  if (isWeb() && web) return web as React.ReactElement;
  return (fallback || null) as React.ReactElement;
}
