import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { 
  Users, FileCode, Shield, Activity, LogOut, 
  BarChart3, User, Globe, Award, Key, Inbox, 
  Circle, Clock, TrendingUp, Wifi
} from "lucide-react";

interface ActivityEvent {
  id: string;
  type: string;
  user: string;
  action: string;
  timestamp: Date;
  details?: string;
}

export default function AdminActivity() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [liveEvents, setLiveEvents] = useState<ActivityEvent[]>([]);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [seenEventIds, setSeenEventIds] = useState<Set<string>>(new Set());

  const { data: profiles } = useQuery({
    queryKey: ["profiles"],
    queryFn: async () => {
      const res = await fetch("/api/profiles", { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    refetchInterval: 10000,
  });

  const { data: authLogs } = useQuery({
    queryKey: ["auth-logs"],
    queryFn: async () => {
      const res = await fetch("/api/auth-logs", { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    refetchInterval: 5000,
  });

  const { data: metrics } = useQuery({
    queryKey: ["metrics"],
    queryFn: async () => {
      const res = await fetch("/api/metrics", { credentials: "include" });
      return res.json();
    },
    refetchInterval: 5000,
  });

  useEffect(() => {
    if (authLogs && authLogs.length > 0) {
      const newEvents: ActivityEvent[] = [];
      const newIds = new Set(seenEventIds);
      
      for (const log of authLogs.slice(0, 30)) {
        const eventId = log.id || `log-${log.created_at}`;
        if (!newIds.has(eventId)) {
          newIds.add(eventId);
          newEvents.push({
            id: eventId,
            type: log.event_type?.includes('success') ? 'login' : log.event_type?.includes('fail') ? 'failed' : 'auth',
            user: log.username || log.user_id || 'Unknown',
            action: log.event_type || 'Activity',
            timestamp: new Date(log.created_at),
            details: log.ip_address,
          });
        }
      }
      
      if (newEvents.length > 0) {
        setLiveEvents(prev => [...newEvents, ...prev].slice(0, 50));
        setSeenEventIds(newIds);
      }
      setLastRefresh(new Date());
    }
  }, [authLogs]);

  const handleLogout = async () => {
    await logout();
    setLocation("/");
  };

  const onlineProfiles = profiles?.filter((p: any) => p.status === 'online') || [];
  const recentlyActive = profiles?.filter((p: any) => {
    if (!p.last_seen) return false;
    const lastSeen = new Date(p.last_seen);
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return lastSeen > fiveMinutesAgo;
  }) || [];

  return (
    <div className="min-h-screen bg-background text-foreground font-mono flex">
      <Sidebar user={user} onLogout={handleLogout} active="activity" />

      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h2 className="text-2xl font-display font-bold text-white uppercase tracking-wider">
                Real-Time Activity
              </h2>
              <p className="text-muted-foreground text-sm mt-1">
                Live monitoring of user activity across the platform
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                Last updated: {lastRefresh.toLocaleTimeString()}
              </div>
              <div className="flex items-center gap-2 bg-green-500/10 text-green-500 px-3 py-1 text-xs">
                <Wifi className="w-3 h-3 animate-pulse" />
                Live
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-card/50 border border-white/10 p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs text-muted-foreground uppercase tracking-wider">Online Now</div>
                <Circle className="w-3 h-3 text-green-500 fill-green-500 animate-pulse" />
              </div>
              <div className="text-4xl font-display font-bold text-green-500">{metrics?.onlineUsers || 0}</div>
              <div className="text-xs text-muted-foreground mt-1">Active users</div>
            </div>
            <div className="bg-card/50 border border-white/10 p-6">
              <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Total Architects</div>
              <div className="text-4xl font-display font-bold text-primary">{metrics?.totalProfiles || 0}</div>
              <div className="text-xs text-muted-foreground mt-1">Registered</div>
            </div>
            <div className="bg-card/50 border border-white/10 p-6">
              <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Auth Events</div>
              <div className="text-4xl font-display font-bold text-white">{authLogs?.length || 0}</div>
              <div className="text-xs text-muted-foreground mt-1">Last 100</div>
            </div>
            <div className="bg-card/50 border border-white/10 p-6">
              <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Verified Users</div>
              <div className="text-4xl font-display font-bold text-secondary">{metrics?.verifiedUsers || 0}</div>
              <div className="text-xs text-muted-foreground mt-1">Certified</div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-card/50 border border-white/10 p-6">
              <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                <Circle className="w-3 h-3 text-green-500 fill-green-500" />
                Online Users ({onlineProfiles.length})
              </h3>
              <div className="space-y-3 max-h-80 overflow-auto">
                {onlineProfiles.length === 0 ? (
                  <div className="text-sm text-muted-foreground text-center py-8">No users currently online</div>
                ) : (
                  onlineProfiles.map((profile: any) => (
                    <div key={profile.id} className="flex items-center justify-between p-3 bg-black/20 border border-white/5">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-primary" />
                          </div>
                          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-card" />
                        </div>
                        <div>
                          <div className="text-sm text-white font-bold">{profile.username || profile.display_name}</div>
                          <div className="text-xs text-muted-foreground">Level {profile.level || 1}</div>
                        </div>
                      </div>
                      <div className="text-xs text-green-500">Online</div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-card/50 border border-white/10 p-6">
              <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" />
                Live Activity Feed
              </h3>
              <div className="space-y-2 max-h-80 overflow-auto">
                {liveEvents.length === 0 ? (
                  <div className="text-sm text-muted-foreground text-center py-8">No recent activity</div>
                ) : (
                  liveEvents.map((event) => (
                    <div key={event.id} className="flex items-center gap-3 p-2 bg-black/20 border border-white/5 text-xs">
                      <div className={`w-2 h-2 rounded-full ${
                        event.type === 'login' ? 'bg-green-500' :
                        event.type === 'failed' ? 'bg-destructive' :
                        'bg-blue-500'
                      }`} />
                      <div className="flex-1">
                        <span className="text-white font-bold">{event.user}</span>
                        <span className="text-muted-foreground"> — {event.action}</span>
                      </div>
                      <div className="text-muted-foreground">
                        {event.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Sidebar({ user, onLogout, active }: { user: any; onLogout: () => void; active: string }) {
  return (
    <div className="w-64 bg-card border-r border-white/10 flex flex-col">
      <div className="p-6 border-b border-white/10">
        <h1 className="text-xl font-display font-bold text-white uppercase tracking-wider">AeThex</h1>
        <p className="text-xs text-primary mt-1">Command Center</p>
      </div>
      <nav className="flex-1 p-4 space-y-2">
        <NavItem icon={<BarChart3 className="w-4 h-4" />} label="Dashboard" href="/admin" active={active === 'dashboard'} />
        <NavItem icon={<Activity className="w-4 h-4" />} label="Live Activity" href="/admin/activity" active={active === 'activity'} />
        <NavItem icon={<Users className="w-4 h-4" />} label="Architects" href="/admin/architects" active={active === 'architects'} />
        <NavItem icon={<Inbox className="w-4 h-4" />} label="Applications" href="/admin/applications" active={active === 'applications'} />
        <NavItem icon={<Award className="w-4 h-4" />} label="Achievements" href="/admin/achievements" active={active === 'achievements'} />
        <NavItem icon={<FileCode className="w-4 h-4" />} label="Credentials" href="/admin/credentials" active={active === 'credentials'} />
        <NavItem icon={<Globe className="w-4 h-4" />} label="Sites" href="/admin/sites" active={active === 'sites'} />
        <NavItem icon={<Key className="w-4 h-4" />} label="Auth Logs" href="/admin/logs" active={active === 'logs'} />
        <NavItem icon={<Shield className="w-4 h-4" />} label="Aegis Monitor" href="/admin/aegis" active={active === 'aegis'} />
      </nav>
      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-primary" />
          </div>
          <div>
            <div className="text-sm text-white font-bold">{user?.username}</div>
            <div className="text-xs text-muted-foreground">{user?.isAdmin ? "Administrator" : "Member"}</div>
          </div>
        </div>
        <button onClick={onLogout} className="w-full flex items-center gap-2 text-muted-foreground hover:text-white text-sm py-2 px-3 hover:bg-white/5 transition-colors">
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>
    </div>
  );
}

function NavItem({ icon, label, href, active = false }: { icon: React.ReactNode; label: string; href: string; active?: boolean }) {
  return (
    <Link href={href}>
      <div className={`flex items-center gap-3 px-3 py-2 text-sm transition-colors cursor-pointer ${active ? 'bg-primary/10 text-primary border-l-2 border-primary' : 'text-muted-foreground hover:text-white hover:bg-white/5'}`}>
        {icon}
        {label}
      </div>
    </Link>
  );
}
