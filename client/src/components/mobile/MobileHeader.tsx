import { Home, ArrowLeft, Menu } from 'lucide-react';
import { useLocation } from 'wouter';

interface MobileHeaderProps {
  title?: string;
  onMenuClick?: () => void;
  showBack?: boolean;
  backPath?: string;
}

export function MobileHeader({ 
  title = 'AeThex OS', 
  onMenuClick,
  showBack = true,
  backPath = '/mobile'
}: MobileHeaderProps) {
  const [, navigate] = useLocation();

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-xl border-b border-emerald-500/30">
      <div className="flex items-center justify-between px-4 py-3 safe-area-inset-top">
        {showBack ? (
          <button
            onClick={() => navigate(backPath)}
            className="p-3 rounded-full bg-emerald-600 active:bg-emerald-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        ) : (
          <div className="w-11" />
        )}
        
        <h1 className="text-base font-bold text-white truncate max-w-[200px]">
          {title}
        </h1>
        
        {onMenuClick ? (
          <button
            onClick={onMenuClick}
            className="p-3 rounded-full bg-gray-800 active:bg-gray-700 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
        ) : (
          <button
            onClick={() => navigate('/mobile')}
            className="p-3 rounded-full bg-gray-800 active:bg-gray-700 transition-colors"
          >
            <Home className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}
