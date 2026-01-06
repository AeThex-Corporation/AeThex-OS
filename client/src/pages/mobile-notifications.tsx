import { useState, useEffect } from 'react';
import { Bell, Check, Trash2, X, Clock, AlertCircle, Info, CheckCircle } from 'lucide-react';
import { useLocation } from 'wouter';
import { PullToRefresh } from '@/components/mobile/PullToRefresh';
import { SwipeableCardList } from '@/components/mobile/SwipeableCard';
import { useNativeFeatures } from '@/hooks/use-native-features';
import { haptics } from '@/lib/haptics';
import { isMobile } from '@/lib/platform';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  time: string;
  read: boolean;
  created_at?: string;
}

export default function MobileNotifications() {
  const [, navigate] = useLocation();
  const native = useNativeFeatures();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch notifications from Supabase
  const fetchNotifications = async () => {
    try {
      if (!user) {
        // Show welcome notifications for non-logged in users
        setNotifications([
          {
            id: '1',
            title: 'Welcome to AeThex Mobile',
            message: 'Sign in to sync your data across devices.',
            type: 'info',
            time: 'now',
            read: false
          }
        ]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      if (data && data.length > 0) {
        const mapped = data.map(n => ({
          id: n.id.toString(),
          title: n.title || 'Notification',
          message: n.message || '',
          type: (n.type || 'info') as 'info' | 'success' | 'warning' | 'error',
          time: formatTime(n.created_at),
          read: n.read || false,
          created_at: n.created_at
        }));
        setNotifications(mapped);
      } else {
        // No notifications - show empty state
        setNotifications([]);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      native.showToast('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp: string) => {
    const now = new Date();
    const created = new Date(timestamp);
    const diffMs = now.getTime() - created.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  useEffect(() => {
    fetchNotifications();
  }, [user]);

  useEffect(() => {
    if (!isMobile()) {
      navigate('/home');
    }
  }, [navigate]);

  const handleRefresh = async () => {
    haptics.light();
    native.showToast('Refreshing notifications...');
    await fetchNotifications();
    haptics.success();
  };

  const handleMarkAsRead = async (id: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      );
      haptics.selection();
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const handleDelete = async (notification: Notification) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notification.id)
        .eq('user_id', user.id);

      if (error) throw error;

      setNotifications(prev => prev.filter(n => n.id !== notification.id));
      native.showToast('Notification deleted');
      haptics.medium();
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const handleMarkAllRead = async () => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);

      if (error) throw error;

      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      native.showToast('All marked as read');
      haptics.success();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'warning': return <AlertCircle className="w-5 h-5 text-yellow-400" />;
      case 'error': return <AlertCircle className="w-5 h-5 text-red-400" />;
      default: return <Info className="w-5 h-5 text-blue-400" />;
    }
  };

  if (!isMobile()) return null;

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-black/80 backdrop-blur-xl border-b border-cyan-500/20">
        <div className="px-4 py-4 safe-area-inset-top">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  navigate('/');
                  haptics.light();
                }}
                className="p-2 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/40 transition-colors"
              >
                <X className="w-6 h-6 text-cyan-400" />
              </button>
              <div>
                <h1 className="text-2xl font-black text-white uppercase tracking-wider">
                  ALERTS
                </h1>
                {unreadCount > 0 && (
                  <p className="text-xs text-cyan-300 font-mono">
                    {unreadCount} new events
                  </p>
                )}
              </div>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="px-3 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-lg text-xs font-black uppercase tracking-wide transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Notifications list */}
      <PullToRefresh onRefresh={handleRefresh}>
        <div className="px-4 py-4">
          <SwipeableCardList
            items={notifications}
            keyExtractor={(n) => n.id}
            onItemSwipeLeft={handleDelete}
            renderItem={(notification) => (
              <div
                onClick={() => !notification.read && handleMarkAsRead(notification.id)}
                className={`relative overflow-hidden rounded-lg transition-all ${
                  notification.read 
                    ? 'bg-gray-900/40 border border-gray-800 opacity-60' 
                    : 'bg-gradient-to-r from-cyan-900/40 to-emerald-900/40 border border-cyan-500/40'
                }`}
              >
                {/* Accent line */}
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-cyan-400 to-emerald-400" />
                
                <div className="p-4 pl-4">
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {getIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className={`font-bold uppercase text-sm tracking-wide ${
                          notification.read ? 'text-gray-500' : 'text-white'
                        }`}>
                          {notification.title}
                        </h3>
                        {!notification.read && (
                          <span className="w-2 h-2 bg-cyan-400 rounded-full flex-shrink-0 mt-2" />
                        )}
                      </div>
                      <p className={`text-sm mb-2 line-clamp-2 ${
                        notification.read ? 'text-gray-600' : 'text-gray-300'
                      }`}>
                        {notification.message}
                      </p>
                      <div className={`flex items-center gap-2 text-xs font-mono ${
                        notification.read ? 'text-gray-600' : 'text-cyan-400'
                      }`}>
                        <Clock className="w-3 h-3" />
                        {notification.time}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            emptyMessage="No notifications"
          />

          {notifications.length === 0 && (
            <div className="text-center py-16">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-cyan-500/10 flex items-center justify-center">
                <Bell className="w-8 h-8 text-cyan-400" />
              </div>
              <p className="text-white font-black text-lg uppercase">All Caught Up</p>
              <p className="text-xs text-cyan-300/60 mt-2 font-mono">No new events</p>
            </div>
          )}

          {/* Tip */}
          {notifications.length > 0 && (
            <div className="mt-6 bg-gradient-to-r from-cyan-900/20 to-emerald-900/20 border border-cyan-500/30 rounded-lg p-4">
              <p className="text-xs text-cyan-200 font-mono leading-relaxed">
                ← SWIPE LEFT TO DISMISS<br/>
                TAP TO MARK AS READ
              </p>
            </div>
          )}
        </div>
      </PullToRefresh>
    </div>
  );
}
