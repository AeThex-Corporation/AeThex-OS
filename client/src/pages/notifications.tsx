import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bell, Check, Trash2, Filter, CheckCircle, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";

interface Notification {
  id: string;
  user_id: string;
  type: "achievement" | "message" | "event" | "system" | "marketplace";
  title: string;
  description: string;
  read: boolean;
  timestamp: Date;
  action_url?: string;
  created_at?: Date;
}

export default function Notifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) fetchNotifications();
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });
      if (!error && data) {
        setNotifications(data.map(n => ({
          ...n,
          timestamp: new Date(n.created_at),
          actionUrl: n.action_url
        })));
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };
      timestamp: new Date(Date.now() - 259200000)
    }
  ]);

  const [filterType, setFilterType] = useState<string | null>(null);

  const handleMarkAsRead = async (id: string) => {
    try {
      await supabase.from('notifications').update({ read: true }).eq('id', id);
      setNotifications(n =>
        n.map(notif =>
          notif.id === id ? { ...notif, read: true } : notif
        )
      );
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await supabase.from('notifications').update({ read: true }).eq('user_id', user?.id);
      setNotifications(n => n.map(notif => ({ ...notif, read: true })));
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await supabase.from('notifications').delete().eq('id', id);
      setNotifications(n => n.filter(notif => notif.id !== id));
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;
  const filteredNotifications = filterType
    ? notifications.filter(n => n.type === filterType)
    : notifications;

  const getTypeColor = (type: Notification["type"]) => {
    const colors = {
      achievement: "bg-yellow-500/10 border-yellow-500/20",
      message: "bg-blue-500/10 border-blue-500/20",
      event: "bg-purple-500/10 border-purple-500/20",
      marketplace: "bg-green-500/10 border-green-500/20",
      system: "bg-slate-500/10 border-slate-500/20"
    };
    return colors[type];
  };

  const getTypeIcon = (type: Notification["type"]) => {
    const icons = {
      achievement: "🏆",
      message: "💬",
      event: "📅",
      marketplace: "🛍️",
      system: "⚙️"
    };
    return icons[type];
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950 text-slate-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-lg">
              <Bell className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Notifications</h1>
              <p className="text-slate-400">
                {unreadCount > 0 ? `${unreadCount} unread` : "All caught up!"}
              </p>
            </div>
          </div>
          {unreadCount > 0 && (
            <Button
              onClick={handleMarkAllAsRead}
              variant="outline"
              size="sm"
              className="border-cyan-500/20 hover:bg-cyan-500/10"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Mark all as read
            </Button>
          )}
        </div>

        {/* Filter Tabs */}
        <Tabs defaultValue="all" className="mb-6">
          <TabsList className="bg-slate-800/50 border border-slate-700/50">
            <TabsTrigger
              value="all"
              onClick={() => setFilterType(null)}
              className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400"
            >
              All
            </TabsTrigger>
            <TabsTrigger
              value="achievement"
              onClick={() => setFilterType("achievement")}
              className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400"
            >
              Achievements
            </TabsTrigger>
            <TabsTrigger
              value="message"
              onClick={() => setFilterType("message")}
              className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400"
            >
              Messages
            </TabsTrigger>
            <TabsTrigger
              value="event"
              onClick={() => setFilterType("event")}
              className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400"
            >
              Events
            </TabsTrigger>
            <TabsTrigger
              value="marketplace"
              onClick={() => setFilterType("marketplace")}
              className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400"
            >
              Marketplace
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Notifications List */}
        <div className="space-y-3">
          {filteredNotifications.length === 0 ? (
            <Card className="bg-slate-800/30 border-slate-700/30 p-8 text-center">
              <Bell className="w-12 h-12 text-slate-600 mx-auto mb-4 opacity-50" />
              <p className="text-slate-400">No {filterType ? `${filterType}` : ""} notifications</p>
            </Card>
          ) : (
            filteredNotifications.map(notification => (
              <Card
                key={notification.id}
                className={`border-l-4 transition-all ${
                  notification.read
                    ? "bg-slate-800/20 border-slate-700/30"
                    : "bg-slate-800/50 border-l-cyan-400 border-slate-700/50"
                } hover:bg-slate-800/40`}
              >
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="text-2xl mt-1">{getTypeIcon(notification.type)}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{notification.title}</h3>
                          {!notification.read && (
                            <span className="w-2 h-2 bg-cyan-400 rounded-full" />
                          )}
                        </div>
                        <p className="text-slate-400 text-sm mb-2">{notification.description}</p>
                        <p className="text-slate-500 text-xs">{formatTime(notification.timestamp)}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      {!notification.read && (
                        <Button
                          onClick={() => handleMarkAsRead(notification.id)}
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 hover:bg-cyan-500/10 hover:text-cyan-400"
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                      )}
                      {notification.actionUrl && (
                        <Button
                          onClick={() => window.location.href = notification.actionUrl!}
                          variant="ghost"
                          size="sm"
                          className="h-8 px-3 text-cyan-400 hover:bg-cyan-500/10"
                        >
                          View
                        </Button>
                      )}
                      <Button
                        onClick={() => handleDelete(notification.id)}
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 hover:bg-red-500/10 hover:text-red-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Settings Section */}
        <Card className="mt-8 bg-slate-800/30 border-slate-700/30">
          <div className="p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Filter className="w-5 h-5 text-cyan-400" />
              Notification Preferences
            </h3>
            <div className="space-y-3">
              {[
                { label: "Achievement Notifications", enabled: true },
                { label: "Message Alerts", enabled: true },
                { label: "Event Reminders", enabled: true },
                { label: "Marketplace Updates", enabled: false }
              ].map((pref, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <label className="text-sm text-slate-300">{pref.label}</label>
                  <input
                    type="checkbox"
                    defaultChecked={pref.enabled}
                    className="w-4 h-4 rounded bg-slate-700 border-slate-600 cursor-pointer"
                  />
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
