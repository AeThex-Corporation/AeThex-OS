import { useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { 
  Users, FileCode, Shield, Activity, LogOut, 
  BarChart3, User, Globe, Key, CheckCircle, XCircle, AlertTriangle
} from "lucide-react";

export default function AdminLogs() {
  const { user, isAuthenticated, isLoading: authLoading, logout } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!authLoading && !isAuthenticated) {
        setLocation("/login");
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [authLoading, isAuthenticated, setLocation]);

  const { data: logs, isLoading } = useQuery({
    queryKey: ["auth-logs"],
    queryFn: async () => {
      const res = await fetch("/api/auth-logs");
      if (!res.ok) throw new Error("Failed to fetch logs");
      return res.json();
    },
    enabled: isAuthenticated,
  });

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

  const getEventIcon = (eventType: string) => {
    if (eventType?.includes('success') || eventType?.includes('login')) {
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    } else if (eventType?.includes('fail') || eventType?.includes('error')) {
      return <XCircle className="w-4 h-4 text-destructive" />;
    } else if (eventType?.includes('warn')) {
      return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
    }
    return <Key className="w-4 h-4 text-muted-foreground" />;
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-mono flex">
      <Sidebar user={user} onLogout={handleLogout} active="logs" />

      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="mb-8">
            <h2 className="text-2xl font-display font-bold text-white uppercase tracking-wider">
              Auth Logs
            </h2>
            <p className="text-muted-foreground text-sm mt-1">
              {logs?.length || 0} recent authentication events
            </p>
          </div>

          <div className="bg-card/50 border border-white/10 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10 text-left">
                  <th className="p-4 text-xs text-muted-foreground uppercase tracking-wider font-bold">Event</th>
                  <th className="p-4 text-xs text-muted-foreground uppercase tracking-wider font-bold">User</th>
                  <th className="p-4 text-xs text-muted-foreground uppercase tracking-wider font-bold">IP Address</th>
                  <th className="p-4 text-xs text-muted-foreground uppercase tracking-wider font-bold">User Agent</th>
                  <th className="p-4 text-xs text-muted-foreground uppercase tracking-wider font-bold">Time</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-muted-foreground">Loading...</td>
                  </tr>
                ) : logs?.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-muted-foreground">No logs found</td>
                  </tr>
                ) : (
                  logs?.map((log: any) => (
                    <tr key={log.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {getEventIcon(log.event_type)}
                          <span className="text-sm text-white">{log.event_type}</span>
                        </div>
                      </td>
                      <td className="p-4 text-sm text-muted-foreground font-mono">
                        {log.user_id?.substring(0, 8)}...
                      </td>
                      <td className="p-4 text-sm text-muted-foreground font-mono">
                        {log.ip_address || 'N/A'}
                      </td>
                      <td className="p-4 text-xs text-muted-foreground max-w-[200px] truncate">
                        {log.user_agent || 'N/A'}
                      </td>
                      <td className="p-4 text-xs text-muted-foreground">
                        {log.created_at ? new Date(log.created_at).toLocaleString() : 'N/A'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
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
        <NavItem icon={<Users className="w-4 h-4" />} label="Architects" href="/admin/architects" active={active === 'architects'} />
        <NavItem icon={<FileCode className="w-4 h-4" />} label="Credentials" href="/admin/credentials" active={active === 'credentials'} />
        <NavItem icon={<Activity className="w-4 h-4" />} label="Projects" href="/admin/projects" active={active === 'projects'} />
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
