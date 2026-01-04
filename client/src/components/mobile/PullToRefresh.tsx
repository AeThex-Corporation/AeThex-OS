import { useState, useRef, useEffect, useCallback } from 'react';
import { Loader2 } from 'lucide-react';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  disabled?: boolean;
}

export function PullToRefresh({ 
  onRefresh, 
  children, 
  disabled = false
}: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startY = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (disabled || isRefreshing || window.scrollY > 0) return;
    startY.current = e.touches[0].clientY;
  }, [disabled, isRefreshing]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (disabled || isRefreshing || window.scrollY > 0) return;
    const distance = e.touches[0].clientY - startY.current;
    if (distance > 0) {
      setPullDistance(Math.min(distance * 0.5, 100));
    }
  }, [disabled, isRefreshing]);

  const handleTouchEnd = useCallback(async () => {
    if (pullDistance > 60 && !isRefreshing) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }
    setPullDistance(0);
  }, [pullDistance, isRefreshing, onRefresh]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('touchstart', handleTouchStart as any, { passive: true });
    container.addEventListener('touchmove', handleTouchMove as any, { passive: true });
    container.addEventListener('touchend', handleTouchEnd as any, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart as any);
      container.removeEventListener('touchmove', handleTouchMove as any);
      container.removeEventListener('touchend', handleTouchEnd as any);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return (
    <div ref={containerRef} className="relative">
      {pullDistance > 0 && (
        <div 
          className="flex justify-center items-center bg-gray-900 overflow-hidden"
          style={{ height: `${pullDistance}px` }}
        >
          {isRefreshing ? (
            <Loader2 className="w-5 h-5 animate-spin text-emerald-400" />
          ) : (
            <span className="text-xs text-gray-400">Pull to refresh</span>
          )}
        </div>
      )}
      <div>{children}</div>
    </div>
  );
}
