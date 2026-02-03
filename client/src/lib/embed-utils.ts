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
