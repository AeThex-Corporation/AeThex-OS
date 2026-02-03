/**
 * Utility to detect if the current page is embedded in an iframe
 * Used by hub pages to hide their own navigation when loaded inside the OS window system
 */
export const isEmbedded = (): boolean => {
  try {
    return window.self !== window.top;
  } catch (e) {
    // If cross-origin, we can't access parent - assume embedded
    return true;
  }
};

/**
 * Detect if running on mobile device
 */
export const isMobileDevice = (): boolean => {
  return typeof window !== 'undefined' && window.innerWidth < 768;
};

/**
 * Get mobile theme based on Foundation/Corp mode
 * Retrieves theme from localStorage (set by OS) or defaults to Foundation
 */
export const getMobileTheme = () => {
  const clearanceMode = typeof localStorage !== 'undefined' 
    ? localStorage.getItem('aethex-clearance') || 'foundation'
    : 'foundation';
  
  const isFoundation = clearanceMode === 'foundation';
  
  return {
    mode: clearanceMode as 'foundation' | 'corp',
    isFoundation,
    // Colors
    primary: isFoundation ? 'rgb(220, 38, 38)' : 'rgb(59, 130, 246)',
    secondary: isFoundation ? 'rgb(212, 175, 55)' : 'rgb(148, 163, 184)',
    // Tailwind classes
    primaryClass: isFoundation ? 'text-red-500' : 'text-blue-500',
    secondaryClass: isFoundation ? 'text-amber-400' : 'text-slate-300',
    borderClass: isFoundation ? 'border-red-900/50' : 'border-blue-900/50',
    bgAccent: isFoundation ? 'bg-red-900/20' : 'bg-blue-900/20',
    iconClass: isFoundation ? 'text-red-400' : 'text-blue-400',
    activeBorder: isFoundation ? 'border-red-500' : 'border-blue-500',
    activeBtn: isFoundation ? 'bg-red-600' : 'bg-blue-600',
    hoverBtn: isFoundation ? 'hover:bg-red-700' : 'hover:bg-blue-700',
    gradientBg: isFoundation 
      ? 'linear-gradient(135deg, #0a0a0a 0%, #1a0505 50%, #0a0a0a 100%)'
      : 'linear-gradient(135deg, #0a0a0a 0%, #050a14 50%, #0a0a0a 100%)',
    cardBg: 'bg-zinc-900/80',
    inputBg: 'bg-zinc-800/80',
  };
};

/**
 * Hook-like function to get mobile-aware styling
 * Returns desktop styling when not on mobile, mobile styling otherwise
 */
export const getResponsiveStyles = () => {
  const embedded = isEmbedded();
  const mobile = isMobileDevice();
  const theme = getMobileTheme();
  
  return {
    embedded,
    mobile,
    theme,
    // Use mobile styles when embedded (in OS) or on mobile device
    useMobileStyles: embedded || mobile,
  };
};
