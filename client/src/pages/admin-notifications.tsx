import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { 
  Users, FileCode, Shield, Activity, LogOut, 
  BarChart3, User, Globe, Award, Key, Inbox, 
  Bell, Mail, AlertTriangle, CheckCircle, Settings
} from "lucide-react";

interface NotificationSetting {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  category: "security" | "users" | "system";
}

const defaultSettings: NotificationSetting[] = [
  { id: "failed_logins", name: "Failed Login Attempts", description: "Alert when multiple failed login attempts are detected", enabled: true, category: "security" },
  { id: "new_user", name: "New User Registration", description: "Notify when a new architect joins the platform", enabled: true, category: "users" },
  { id: "critical_alert", name: "Critical Security Alerts", description: "Immediate notification for high-severity security events", enabled: true, category: "security" },
  { id: "verification", name: "Verification Requests", description: "Alert when an architect requests credential verification", enabled: false, category: "users" },
  { id: "system_down", name: "System Downtime", description: "Notify when any AeThex service goes offline", enabled: true, category: "system" },
  { id: "weekly_report", name: "Weekly Summary Report", description: "Receive a weekly digest of platform activity", enabled: false, category: "system" },
  { id: "application", name: "New Applications", description: "Alert when new job applications are submitted", enabled: true, category: "users" },
  { id: "threat_detected", name: "Threat Detection", description: "Real-time alerts from Aegis threat monitoring", enabled: true, category: "security" },
];

export default function AdminNotifications() {
  const { user, isAuthenticated, isLoading: authLoading, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [settings, setSettings] = useState<NotificationSetting[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("aethex_notification_settings");
      if (saved) return JSON.parse(saved);
    }
    return defaultSettings;
  });
  const [email, setEmail] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("aethex_notification_email") || "";
    }
    return "";
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!authLoading && !isAuthenticated) {
        setLocation("/login");
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [authLoading, isAuthenticated, setLocation]);

  const toggleSetting = (id: string) => {
    setSettings((prev) =>
      prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s))
    );
    setSaved(false);
  };

  const saveSettings = () => {
    localStorage.setItem("aethex_notification_settings", JSON.stringify(settings));
    localStorage.setItem("aethex_notification_email", email);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-primary animate-pulse">Loading...</div>
      </div>
    );
  }

  const handleLogout = async () => {
    await logout();
    setLocation("/");
  };

  const groupedSettings = {
    security: settings.filter((s) => s.category === "security"),
    users: settings.filter((s) => s.category === "users"),
    system: settings.filter((s) => s.category === "system"),
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-mono flex">
      <Sidebar user={user} onLogout={handleLogout} active="notifications" />

      <div className="flex-1 overflow-auto">
        <div className="p-8 max-w-4xl">
          <div className="mb-8">
            <h2 className="text-2xl font-display font-bold text-white uppercase tracking-wider">
              Notification Settings
            </h2>
            <p className="text-muted-foreground text-sm mt-1">
              Configure email alerts for critical system events
            </p>
          </div>

          <div className="bg-card/50 border border-white/10 p-6 mb-8">
            <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-4 flex items-center gap-2">
              <Mail className="w-4 h-4 text-primary" />
              Email Configuration
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider block mb-2">
                  Notification Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setSaved(false); }}
                  placeholder="admin@example.com"
                  className="w-full max-w-md bg-black/20 border border-white/10 px-4 py-3 text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
                  data-testid="input-notification-email"
                />
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <div className="bg-card/50 border border-white/10 p-6">
              <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                <Shield className="w-4 h-4 text-destructive" />
                Security Alerts
              </h3>
              <div className="space-y-4">
                {groupedSettings.security.map((setting) => (
                  <SettingRow key={setting.id} setting={setting} onToggle={toggleSetting} />
                ))}
              </div>
            </div>

            <div className="bg-card/50 border border-white/10 p-6">
              <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                <Users className="w-4 h-4 text-secondary" />
                User Activity
              </h3>
              <div className="space-y-4">
                {groupedSettings.users.map((setting) => (
                  <SettingRow key={setting.id} setting={setting} onToggle={toggleSetting} />
                ))}
              </div>
            </div>

            <div className="bg-card/50 border border-white/10 p-6">
              <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                <Settings className="w-4 h-4 text-blue-500" />
                System Notifications
              </h3>
              <div className="space-y-4">
                {groupedSettings.system.map((setting) => (
                  <SettingRow key={setting.id} setting={setting} onToggle={toggleSetting} />
                ))}
              </div>
            </div>
          </div>

          <div className="mt-8 flex items-center gap-4">
            <button
              onClick={saveSettings}
              className="bg-primary text-background px-6 py-3 font-bold uppercase tracking-wider hover:bg-primary/90 transition-colors"
              data-testid="button-save-notifications"
            >
              Save Settings
            </button>
            {saved && (
              <span className="text-green-500 text-sm flex items-center gap-2">
                <CheckCircle className="w-4 h-4" /> Settings saved
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingRow({ setting, onToggle }: { setting: NotificationSetting; onToggle: (id: string) => void }) {
  return (
    <div className="flex items-center justify-between p-4 bg-black/20 border border-white/5">
      <div>
        <div className="text-white font-bold text-sm">{setting.name}</div>
        <div className="text-xs text-muted-foreground">{setting.description}</div>
      </div>
      <button
        onClick={() => onToggle(setting.id)}
        className={`w-12 h-6 rounded-full relative transition-colors ${
          setting.enabled ? "bg-primary" : "bg-white/10"
        }`}
        data-testid={`toggle-${setting.id}`}
      >
        <span
          className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
            setting.enabled ? "left-7" : "left-1"
          }`}
        />
      </button>
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
        <NavItem icon={<Bell className="w-4 h-4" />} label="Notifications" href="/admin/notifications" active={active === 'notifications'} />
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
