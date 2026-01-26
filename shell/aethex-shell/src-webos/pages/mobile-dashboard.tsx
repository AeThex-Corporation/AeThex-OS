import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Home, Camera, Bell, Settings, Zap, Battery, Wifi, 
  MessageSquare, Package, User, CheckCircle, Star, Award
} from 'lucide-react';
import { useLocation } from 'wouter';
import { PullToRefresh } from '@/components/mobile/PullToRefresh';
import { SwipeableCardList } from '@/components/mobile/SwipeableCard';
import { MobileBottomNav, DEFAULT_MOBILE_TABS } from '@/components/MobileBottomNav';
import { MobileNativeBridge } from '@/components/MobileNativeBridge';
import { MobileQuickActions } from '@/components/MobileQuickActions';
import { useNativeFeatures } from '@/hooks/use-native-features';
import { useTouchGestures } from '@/hooks/use-touch-gestures';
import { haptics } from '@/lib/haptics';
import { isMobile } from '@/lib/platform';

interface DashboardCard {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  badge?: number;
  action: () => void;
}

export default function MobileDashboard() {
  const [location, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState('home');
  const [showQuickActions, setShowQuickActions] = useState(false);
  const native = useNativeFeatures();

  // Redirect non-mobile users
  useEffect(() => {
    if (!isMobile()) {
      navigate('/home');
    }
  }, [navigate]);

  const [cards, setCards] = useState<DashboardCard[]>([
    {
      id: '1',
      title: 'Projects',
      description: 'View and manage your active projects',
      icon: <Package className="w-6 h-6" />,
      color: 'from-blue-500 to-cyan-500',
      badge: 3,
      action: () => navigate('/hub/projects')
    },
    {
      id: '2',
      title: 'Messages',
      description: 'Check your recent conversations',
      icon: <MessageSquare className="w-6 h-6" />,
      color: 'from-purple-500 to-pink-500',
      badge: 5,
      action: () => navigate('/hub/messaging')
    },
    {
      id: '3',
      title: 'Achievements',
      description: 'Track your progress and milestones',
      icon: <Award className="w-6 h-6" />,
      color: 'from-yellow-500 to-orange-500',
      action: () => navigate('/achievements')
    },
    {
      id: '4',
      title: 'Network',
      description: 'Connect with other architects',
      icon: <User className="w-6 h-6" />,
      color: 'from-green-500 to-emerald-500',
      action: () => navigate('/network')
    },
    {
      id: '5',
      title: 'Notifications',
      description: 'View all your notifications',
      icon: <Bell className="w-6 h-6" />,
      color: 'from-red-500 to-pink-500',
      badge: 2,
      action: () => navigate('/hub/notifications')
    }
  ]);

  // Redirect non-mobile users
  useEffect(() => {
    if (!isMobile()) {
      navigate('/home');
    }
  }, [navigate]);

  const handleRefresh = async () => {
    haptics.light();
    await new Promise(resolve => setTimeout(resolve, 1500));
    native.showToast('Dashboard refreshed!');
    haptics.success();
  };

  const handleCardSwipeLeft = (card: DashboardCard) => {
    haptics.medium();
    setCards(prev => prev.filter(c => c.id !== card.id));
    native.showToast(`${card.title} removed`);
  };

  const handleCardSwipeRight = (card: DashboardCard) => {
    haptics.medium();
    native.showToast(`${card.title} favorited`);
  };

  const handleCardTap = (card: DashboardCard) => {
    haptics.light();
    card.action();
  };

  useTouchGestures({
    onSwipeDown: () => {
      setShowQuickActions(true);
      haptics.light();
    },
    onSwipeUp: () => {
      setShowQuickActions(false);
      haptics.light();
    }
  });

  if (!isMobile()) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black text-white pb-20">
      {/* Native bridge status */}
      <MobileNativeBridge />

      {/* Header */}
      <div className="sticky top-0 z-30 bg-black/80 backdrop-blur-xl border-b border-emerald-500/30">
        <div className="safe-area-inset-top px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-emerald-300 font-mono">
                AETHEX MOBILE
              </h1>
              <p className="text-xs text-cyan-200 font-mono uppercase tracking-wide">
                Device Dashboard
              </p>
            </div>
            <button
              onClick={() => {
                setShowQuickActions(!showQuickActions);
                haptics.light();
              }}
              className="p-3 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 transition-all"
            >
              <Zap className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main content with pull-to-refresh */}
      <PullToRefresh onRefresh={handleRefresh}>
        <div className="px-4 py-6 space-y-6">
          {/* Quick stats */}
          <div className="grid grid-cols-3 gap-3">
            <StatCard 
              icon={<Star className="w-5 h-5" />}
              label="Points"
              value="1,234"
              color="from-yellow-500 to-orange-500"
            />
            <StatCard 
              icon={<CheckCircle className="w-5 h-5" />}
              label="Tasks"
              value="42"
              color="from-green-500 to-emerald-500"
            />
            <StatCard 
              icon={<Zap className="w-5 h-5" />}
              label="Streak"
              value="7d"
              color="from-purple-500 to-pink-500"
            />
          </div>

          {/* Swipeable cards */}
          <div>
            <h2 className="text-lg font-bold text-emerald-300 mb-3 font-mono uppercase tracking-wide">
              Quick Access
            </h2>
            <SwipeableCardList
              items={cards}
              keyExtractor={(card) => card.id}
              onItemSwipeLeft={handleCardSwipeLeft}
              onItemSwipeRight={handleCardSwipeRight}
              renderItem={(card) => (
                <div
                  onClick={() => handleCardTap(card)}
                  className="bg-gradient-to-r from-gray-900 to-gray-800 border border-emerald-500/20 rounded-xl p-4 cursor-pointer active:scale-95 transition-transform"
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-lg bg-gradient-to-r ${card.color}`}>
                      {card.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-white">{card.title}</h3>
                        {card.badge && (
                          <span className="px-2 py-1 text-xs font-bold bg-red-500 text-white rounded-full">
                            {card.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400">{card.description}</p>
                    </div>
                  </div>
                </div>
              )}
              emptyMessage="No quick access cards available"
            />
          </div>

          {/* Helpful tip */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-gradient-to-r from-cyan-900/30 to-emerald-900/30 border border-cyan-500/30 rounded-xl p-4"
          >
            <p className="text-xs text-cyan-200 font-mono">
              💡 <strong>TIP:</strong> Swipe cards left to remove, right to favorite. 
              Pull down to refresh. Swipe down from top for quick actions.
            </p>
          </motion.div>
        </div>
      </PullToRefresh>

      {/* Quick actions overlay */}
      {showQuickActions && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed top-20 left-4 right-4 z-40"
        >
          <MobileQuickActions />
        </motion.div>
      )}

      {/* Bottom navigation */}
      <MobileBottomNav
        tabs={DEFAULT_MOBILE_TABS}
        activeTab={activeTab}
        onTabChange={(tabId) => {
          setActiveTab(tabId);
          haptics.selection();
          navigate(tabId === 'home' ? '/mobile' : `/${tabId}`);
        }}
      />
    </div>
  );
}

function StatCard({ 
  icon, 
  label, 
  value, 
  color 
}: { 
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="bg-gray-900 border border-emerald-500/20 rounded-xl p-3">
      <div className={`inline-flex p-2 rounded-lg bg-gradient-to-r ${color} mb-2`}>
        {icon}
      </div>
      <div className="text-2xl font-bold text-white mb-1">{value}</div>
      <div className="text-[10px] text-gray-400 uppercase tracking-wide">{label}</div>
    </div>
  );
}
