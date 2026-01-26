import { useState } from 'react';
import { Trash2, Archive } from 'lucide-react';
import { useHaptics } from '@/hooks/use-haptics';

interface SwipeableCardProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  leftAction?: { icon?: React.ReactNode; label?: string; color?: string };
  rightAction?: { icon?: React.ReactNode; label?: string; color?: string };
}

export function SwipeableCard({ 
  children, 
  onSwipeLeft, 
  onSwipeRight,
  leftAction = { icon: <Trash2 className="w-5 h-5" />, label: 'Delete', color: 'bg-red-500' },
  rightAction = { icon: <Archive className="w-5 h-5" />, label: 'Archive', color: 'bg-blue-500' }
}: SwipeableCardProps) {
  const [offset, setOffset] = useState(0);
  const haptics = useHaptics();
  let startX = 0;
  let currentX = 0;

  const handleTouchStart = (e: React.TouchEvent) => {
    startX = e.touches[0].clientX;
    currentX = startX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    currentX = e.touches[0].clientX;
    const diff = currentX - startX;
    if (Math.abs(diff) > 10) {
      setOffset(Math.max(-100, Math.min(100, diff)));
    }
  };

  const handleTouchEnd = () => {
    if (offset < -50 && onSwipeLeft) {
      haptics.impact('medium');
      onSwipeLeft();
    } else if (offset > 50 && onSwipeRight) {
      haptics.impact('medium');
      onSwipeRight();
    }
    setOffset(0);
  };

  return (
    <div className="relative overflow-hidden">
      <div
        className="bg-gray-900 border border-gray-700 rounded-lg p-4"
        style={{
          transform: `translateX(${offset}px)`,
          transition: offset === 0 ? 'transform 0.2s ease-out' : 'none'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </div>
    </div>
  );
}

interface CardListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  onItemSwipeLeft?: (item: T, index: number) => void;
  onItemSwipeRight?: (item: T, index: number) => void;
  keyExtractor: (item: T, index: number) => string;
  emptyMessage?: string;
}

export function SwipeableCardList<T>({
  items,
  renderItem,
  onItemSwipeLeft,
  onItemSwipeRight,
  keyExtractor,
  emptyMessage = 'No items'
}: CardListProps<T>) {
  if (items.length === 0) {
    return <div className="text-center py-12 text-gray-500">{emptyMessage}</div>;
  }

  return (
    <div className="space-y-2">
      {items.map((item, index) => (
        <SwipeableCard
          key={keyExtractor(item, index)}
          onSwipeLeft={onItemSwipeLeft ? () => onItemSwipeLeft(item, index) : undefined}
          onSwipeRight={onItemSwipeRight ? () => onItemSwipeRight(item, index) : undefined}
        >
          {renderItem(item, index)}
        </SwipeableCard>
      ))}
    </div>
  );
}
