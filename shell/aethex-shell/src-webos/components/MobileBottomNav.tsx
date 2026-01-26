import React from 'react';
import { Home, Package, MessageSquare, Settings, Camera, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

export interface BottomTabItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}

export interface MobileBottomNavProps {
  tabs: BottomTabItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}

export function MobileBottomNav({
  tabs,
  activeTab,
  onTabChange,
  className = '',
}: MobileBottomNavProps) {
  return (
    <div className={`fixed bottom-0 left-0 right-0 h-16 bg-black/90 border-t border-emerald-500/30 z-40 safe-area-inset-bottom ${className}`}>
      <div className="flex items-center justify-around h-full px-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className="flex flex-col items-center justify-center gap-1 flex-1 h-full relative group"
          >
            {activeTab === tab.id && (
              <motion.div
                layoutId="tab-indicator"
                className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-emerald-400 rounded-t-full"
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}

            <div className={`transition-colors ${
              activeTab === tab.id
                ? 'text-emerald-300'
                : 'text-cyan-200 group-hover:text-emerald-200'
            }`}>
              {tab.icon}
            </div>

            <span className={`text-[10px] font-mono uppercase tracking-wide transition-colors ${
              activeTab === tab.id
                ? 'text-emerald-300'
                : 'text-cyan-200 group-hover:text-emerald-200'
            }`}>
              {tab.label}
            </span>

            {tab.badge !== undefined && tab.badge > 0 && (
              <div className="absolute top-1 right-2 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {tab.badge > 9 ? '9+' : tab.badge}
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

export const DEFAULT_MOBILE_TABS: BottomTabItem[] = [
  { id: 'home', label: 'Home', icon: <Home className="w-5 h-5" /> },
  { id: 'projects', label: 'Projects', icon: <Package className="w-5 h-5" /> },
  { id: 'chat', label: 'Chat', icon: <MessageSquare className="w-5 h-5" /> },
  { id: 'camera', label: 'Camera', icon: <Camera className="w-5 h-5" /> },
  { id: 'settings', label: 'Settings', icon: <Settings className="w-5 h-5" /> },
];
