import { useEffect, useRef } from 'react';

export interface SwipeHandlers {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onPinch?: (scale: number) => void;
  onDoubleTap?: () => void;
  onLongPress?: () => void;
}

export function useTouchGestures(handlers: SwipeHandlers, elementRef?: React.RefObject<HTMLElement>) {
  const touchStart = useRef<{ x: number; y: number; time: number } | null>(null);
  const lastTap = useRef<number>(0);
  const pinchStart = useRef<number>(0);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const target = elementRef?.current || document;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        touchStart.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
          time: Date.now()
        };

        // Start long press timer
        if (handlers.onLongPress) {
          longPressTimer.current = setTimeout(() => {
            handlers.onLongPress?.();
            touchStart.current = null;
          }, 500);
        }
      } else if (e.touches.length === 2 && handlers.onPinch) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        pinchStart.current = Math.sqrt(dx * dx + dy * dy);
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      // Clear long press timer
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }

      if (!touchStart.current || e.touches.length > 0) return;

      const deltaX = e.changedTouches[0].clientX - touchStart.current.x;
      const deltaY = e.changedTouches[0].clientY - touchStart.current.y;
      const deltaTime = Date.now() - touchStart.current.time;

      // Double tap detection
      if (deltaTime < 300 && Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10) {
        if (Date.now() - lastTap.current < 300 && handlers.onDoubleTap) {
          handlers.onDoubleTap();
        }
        lastTap.current = Date.now();
      }

      // Swipe detection (minimum 50px, max 300ms)
      if (deltaTime < 300) {
        if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY)) {
          if (deltaX > 0 && handlers.onSwipeRight) {
            handlers.onSwipeRight();
          } else if (deltaX < 0 && handlers.onSwipeLeft) {
            handlers.onSwipeLeft();
          }
        } else if (Math.abs(deltaY) > 50) {
          if (deltaY > 0 && handlers.onSwipeDown) {
            handlers.onSwipeDown();
          } else if (deltaY < 0 && handlers.onSwipeUp) {
            handlers.onSwipeUp();
          }
        }
      }

      touchStart.current = null;
    };

    const handleTouchMove = (e: TouchEvent) => {
      // Cancel long press on move
      if (longPressTimer.current && touchStart.current) {
        const dx = e.touches[0].clientX - touchStart.current.x;
        const dy = e.touches[0].clientY - touchStart.current.y;
        if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
          clearTimeout(longPressTimer.current);
          longPressTimer.current = null;
        }
      }

      if (e.touches.length === 2 && handlers.onPinch && pinchStart.current) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const scale = distance / pinchStart.current;
        handlers.onPinch(scale);
      }
    };

    target.addEventListener('touchstart', handleTouchStart as any);
    target.addEventListener('touchend', handleTouchEnd as any);
    target.addEventListener('touchmove', handleTouchMove as any);

    return () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
      }
      target.removeEventListener('touchstart', handleTouchStart as any);
      target.removeEventListener('touchend', handleTouchEnd as any);
      target.removeEventListener('touchmove', handleTouchMove as any);
    };
  }, [handlers, elementRef]);
}
