import React, { useEffect, useMemo, useState } from 'react';
import {
  Camera,
  Bell,
  FileText,
  Users,
  Settings,
  Menu,
  X,
  Zap,
  Code,
  MessageSquare,
  Package,
  ShieldCheck,
  Activity,
  Sparkles,
  MonitorSmartphone,
} from 'lucide-react';
import { useLocation } from 'wouter';
import { isMobile } from '@/lib/platform';
import { App as CapApp } from '@capacitor/app';
import { haptics } from '@/lib/haptics';
import { PullToRefresh } from '@/components/mobile/PullToRefresh';
import { SwipeableCardList } from '@/components/mobile/SwipeableCard';
import { MobileBottomNav, DEFAULT_MOBILE_TABS } from '@/components/MobileBottomNav';

export default function SimpleMobileDashboard() {
  const [location, navigate] = useLocation();
  const [showMenu, setShowMenu] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [cards, setCards] = useState(() => defaultCards());

  // Handle Android back button
  useEffect(() => {
    if (!isMobile()) return;

    const backHandler = CapApp.addListener('backButton', ({ canGoBack }) => {
      if (location === '/' || location === '/mobile') {
        CapApp.exitApp();
      } else {
        window.history.back();
      }
    });

    return () => {
      backHandler.remove();
    };
  }, [location]);

  const handleRefresh = async () => {
    haptics.light();
    await new Promise((resolve) => setTimeout(resolve, 900));
    haptics.success();
  };

  const quickStats = useMemo(
    () => [
      { label: 'Projects', value: '5', icon: <Package className="w-4 h-4" />, tone: 'from-cyan-500 to-emerald-500' },
      { label: 'Alerts', value: '3', icon: <Bell className="w-4 h-4" />, tone: 'from-red-500 to-pink-500' },
      { label: 'Messages', value: '12', icon: <MessageSquare className="w-4 h-4" />, tone: 'from-violet-500 to-blue-500' },
    ],
    []
  );

  const handleNav = (path: string) => {
    haptics.light();
    navigate(path);
    setShowMenu(false);
  };

  if (!isMobile()) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden pb-20">
      {/* Animated background */}
      <div className="fixed inset-0 opacity-30">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-600/10 via-transparent to-emerald-600/10" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-b border-cyan-500/20">
        <div className="flex items-center justify-between px-4 py-4 safe-area-inset-top">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-emerald-400 rounded-lg flex items-center justify-center font-black text-black shadow-lg shadow-cyan-500/50">
              Æ
            </div>
            <div>
              <h1 className="text-xl font-black text-white uppercase tracking-widest">AeThex</h1>
              <p className="text-xs text-cyan-300 font-mono">Mobile OS</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleNav('/notifications')}
              className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/30 hover:bg-cyan-500/20 transition-colors"
            >
              <Bell className="w-5 h-5 text-cyan-200" />
            </button>
            <button
              onClick={() => {
                haptics.light();
                setShowMenu(!showMenu);
              }}
              className="p-3 hover:bg-cyan-500/10 rounded-lg transition-colors"
            >
              {showMenu ? <X className="w-6 h-6 text-cyan-400" /> : <Menu className="w-6 h-6 text-cyan-400" />}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <PullToRefresh onRefresh={handleRefresh}>
        <div className="relative pt-28 pb-8 px-4 space-y-6">
          {/* Welcome */}
          <div>
            <p className="text-xs text-cyan-300/80 font-mono uppercase">AeThex OS · Android</p>
            <h2 className="text-3xl font-black text-white uppercase tracking-wider">Launchpad</h2>
          </div>

          {/* Primary Resume */}
          <button
            onClick={() => handleNav('/hub/projects')}
            className="w-full relative overflow-hidden rounded-2xl group border border-emerald-500/30 bg-gradient-to-r from-emerald-600/30 to-cyan-600/30"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/40 to-cyan-500/40 opacity-0 group-hover:opacity-20 blur-xl transition-opacity" />
            <div className="relative px-6 py-5 flex items-center justify-between">
              <div className="text-left">
                <p className="text-xs text-emerald-100 font-mono mb-1">RESUME</p>
                <p className="text-2xl font-black text-white uppercase">Projects</p>
                <p className="text-xs text-emerald-200 mt-1">Continue where you left off</p>
              </div>
              <div className="flex items-center gap-2 text-emerald-200 font-bold">
                <Activity className="w-6 h-6" />
                Go
              </div>
            </div>
          </button>

          {/* Full OS entry point */}
          <button
            onClick={() => handleNav('/os')}
            className="w-full relative overflow-hidden rounded-xl group border border-cyan-500/30 bg-gradient-to-r from-cyan-900/50 to-emerald-900/40"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/30 to-emerald-500/20 opacity-0 group-hover:opacity-20 blur-xl transition-opacity" />
            <div className="relative px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-cyan-500/20 border border-cyan-400/30">
                  <MonitorSmartphone className="w-5 h-5 text-cyan-200" />
                </div>
                <div className="text-left">
                  <p className="text-xs text-cyan-200 font-mono uppercase">Full OS</p>
                  <p className="text-sm text-white font-semibold">Open desktop UI on mobile</p>
                </div>
              </div>
              <span className="text-cyan-200 text-sm font-bold">Go</span>
            </div>
          </button>

          {/* Quick stats */}
          <div className="grid grid-cols-3 gap-3">
            {quickStats.map((stat) => (
              <div key={stat.label} className="bg-gray-900/80 border border-cyan-500/20 rounded-xl p-3">
                <div className={`inline-flex p-2 rounded-lg bg-gradient-to-r ${stat.tone} mb-2`}>{stat.icon}</div>
                <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
                <div className="text-[10px] text-gray-400 uppercase tracking-wide">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Quick Actions Grid */}
          <div className="grid grid-cols-2 gap-3">
            <QuickTile icon={<Camera className="w-7 h-7" />} label="Capture" color="from-blue-900/40 to-purple-900/40" onPress={() => handleNav('/camera')} />
            <QuickTile icon={<Bell className="w-7 h-7" />} label="Alerts" color="from-red-900/40 to-pink-900/40" badge="3" onPress={() => handleNav('/notifications')} />
            <QuickTile icon={<Code className="w-7 h-7" />} label="Modules" color="from-emerald-900/40 to-cyan-900/40" onPress={() => handleNav('/hub/code-gallery')} />
            <QuickTile icon={<MessageSquare className="w-7 h-7" />} label="Messages" color="from-violet-900/40 to-purple-900/40" onPress={() => handleNav('/hub/messaging')} />
            <QuickTile icon={<MonitorSmartphone className="w-7 h-7" />} label="Desktop OS" color="from-cyan-900/40 to-emerald-900/40" onPress={() => handleNav('/os')} />
          </div>

          {/* Swipeable shortcuts */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs text-cyan-300/70 font-mono uppercase">Shortcuts</p>
                <h3 className="text-lg font-bold text-white">Move fast</h3>
              </div>
              <Sparkles className="w-5 h-5 text-cyan-300" />
            </div>
            <SwipeableCardList
              items={cards}
              keyExtractor={(card) => card.id}
              onItemSwipeLeft={(card) => {
                haptics.medium();
                setCards((prev) => prev.filter((c) => c.id !== card.id));
              }}
              onItemSwipeRight={(card) => {
                haptics.medium();
                setCards((prev) => prev.map((c) => (c.id === card.id ? { ...c, pinned: true } : c)));
              }}
              renderItem={(card) => (
                <button
                  onClick={() => handleNav(card.path)}
                  className="w-full text-left bg-gradient-to-r from-gray-900 to-gray-800 border border-cyan-500/20 rounded-xl p-4 active:scale-98 transition-transform"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-lg bg-gradient-to-r ${card.color}`}>{card.icon}</div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-white">{card.title}</p>
                        {card.badge ? (
                          <span className="px-2 py-1 text-xs font-bold bg-red-500 text-white rounded-full">{card.badge}</span>
                        ) : null}
                      </div>
                      <p className="text-xs text-gray-400">{card.description}</p>
                    </div>
                  </div>
                </button>
              )}
              emptyMessage="No shortcuts yet"
            />
          </div>

          {/* Status Bar */}
          <div className="bg-gradient-to-r from-cyan-900/20 to-emerald-900/20 border border-cyan-500/20 rounded-xl p-4 font-mono text-xs space-y-2">
            <div className="flex justify-between text-cyan-300">
              <span>PLATFORM</span>
              <span className="text-cyan-100 font-bold">ANDROID</span>
            </div>
            <div className="flex justify-between text-emerald-300">
              <span>STATUS</span>
              <span className="text-emerald-100 font-bold">READY</span>
            </div>
            <div className="flex justify-between text-cyan-200">
              <span>SYNC</span>
              <span className="text-cyan-100 font-bold">LIVE</span>
            </div>
          </div>
        </div>
      </PullToRefresh>

      {/* Bottom navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-40">
        <MobileBottomNav
          tabs={DEFAULT_MOBILE_TABS}
          activeTab={activeTab}
          onTabChange={(tabId) => {
            setActiveTab(tabId);
            haptics.selection();
            navigate(tabId === 'home' ? '/' : `/${tabId}`);
          }}
        />
      </div>

      {/* Slide-out Menu */}
      {showMenu && (
        <>
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            onClick={() => setShowMenu(false)}
          />
          <div className="fixed top-0 right-0 bottom-0 w-72 bg-black/95 backdrop-blur-xl border-l border-cyan-500/30 z-50 flex flex-col safe-area-inset-top">
            <div className="flex-1 p-6 overflow-y-auto space-y-2">
              <button
                onClick={() => handleNav('/')}
                className="w-full text-left px-4 py-3 bg-cyan-600 rounded-lg font-bold text-white flex items-center gap-3 mb-4"
              >
                <Zap className="w-5 h-5" />
                Home
              </button>
              <button
                onClick={() => handleNav('/camera')}
                className="w-full text-left px-4 py-3 hover:bg-cyan-600/20 rounded-lg text-cyan-300 flex items-center gap-3 transition-colors"
              >
                <Camera className="w-5 h-5" />
                Capture
              </button>
              <button
                onClick={() => handleNav('/notifications')}
                className="w-full text-left px-4 py-3 hover:bg-cyan-600/20 rounded-lg text-cyan-300 flex items-center gap-3 transition-colors"
              >
                <Bell className="w-5 h-5" />
                Alerts
              </button>
              <button
                onClick={() => handleNav('/hub/projects')}
                className="w-full text-left px-4 py-3 hover:bg-cyan-600/20 rounded-lg text-cyan-300 flex items-center gap-3 transition-colors"
              >
                <FileText className="w-5 h-5" />
                Projects
              </button>
              <button
                onClick={() => handleNav('/hub/messaging')}
                className="w-full text-left px-4 py-3 hover:bg-cyan-600/20 rounded-lg text-cyan-300 flex items-center gap-3 transition-colors"
              >
                <Users className="w-5 h-5" />
                Messages
              </button>
              <div className="border-t border-cyan-500/20 my-4" />
              <button
                onClick={() => handleNav('/hub/settings')}
                className="w-full text-left px-4 py-3 hover:bg-cyan-600/20 rounded-lg text-cyan-300 flex items-center gap-3 transition-colors"
              >
                <Settings className="w-5 h-5" />
                Settings
              </button>
              <button
                onClick={() => handleNav('/os')}
                className="w-full text-left px-4 py-3 hover:bg-cyan-600/20 rounded-lg text-cyan-300 flex items-center gap-3 transition-colors"
              >
                <MonitorSmartphone className="w-5 h-5" />
                Desktop OS (Full)
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function defaultCards() {
  return [
    {
      id: 'projects',
      title: 'Projects',
      description: 'View and manage builds',
      icon: <Package className="w-6 h-6" />,
      color: 'from-blue-500 to-cyan-500',
      badge: 3,
      path: '/hub/projects',
    },
    {
      id: 'messages',
      title: 'Messages',
      description: 'Recent conversations',
      icon: <MessageSquare className="w-6 h-6" />,
      color: 'from-purple-500 to-pink-500',
      badge: 5,
      path: '/hub/messaging',
    },
    {
      id: 'alerts',
      title: 'Alerts',
      description: 'System notifications',
      icon: <ShieldCheck className="w-6 h-6" />,
      color: 'from-red-500 to-orange-500',
      path: '/notifications',
    },
    {
      id: 'modules',
      title: 'Modules',
      description: 'Code gallery and tools',
      icon: <Code className="w-6 h-6" />,
      color: 'from-emerald-500 to-cyan-500',
      path: '/hub/code-gallery',
    },
  ];
}

function QuickTile({
  icon,
  label,
  color,
  badge,
  onPress,
}: {
  icon: React.ReactNode;
  label: string;
  color: string;
  badge?: string;
  onPress: () => void;
}) {
  return (
    <button
      onClick={onPress}
      className={`group relative overflow-hidden rounded-xl p-5 bg-gradient-to-br ${color} border border-cyan-500/20 hover:border-cyan-400/40 active:opacity-80 transition-all`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/0 to-emerald-500/0 group-hover:from-cyan-500/10 group-hover:to-emerald-500/10 transition-all" />
      <div className="relative flex flex-col items-center gap-2">
        <div className="relative">
          {icon}
          {badge ? (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-black w-5 h-5 rounded-full flex items-center justify-center">
              {badge}
            </span>
          ) : null}
        </div>
        <span className="text-sm font-bold text-white">{label}</span>
      </div>
    </button>
  );
}
