import { Link, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { 
  Users, FileCode, Shield, Activity, LogOut, 
  BarChart3, User, AlertTriangle, CheckCircle, XCircle, Globe, Award, Key, Inbox
} from "lucide-react";

export default function AdminAegis() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const { data: alerts } = useQuery({
    queryKey: ["alerts"],
    queryFn: async () => {
      const res = await fetch("/api/alerts");
      if (!res.ok) return [];
      return res.json();
    },
  });

  const { data: authLogs } = useQuery({
    queryKey: ["auth-logs-recent"],
    queryFn: async () => {
      const res = await fetch("/api/auth-logs");
      if (!res.ok) return [];
      return res.json();
    },
  });

  const resolveAlertMutation = useMutation({
    mutationFn: async ({ id, is_resolved }: { id: string; is_resolved: boolean }) => {
      const res = await fetch(`/api/alerts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_resolved }),
      });
      if (!res.ok) throw new Error("Failed to update alert");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
    },
  });

  const handleLogout = async () => {
    await logout();
    setLocation("/");
  };

  const failedLogins = authLogs?.filter((l: any) => l.event_type?.includes('fail')).length || 0;
  const successLogins = authLogs?.filter((l: any) => l.event_type?.includes('success')).length || 0;
  const unresolvedAlerts = alerts?.filter((a: any) => !a.is_resolved).length || 0;

  return (
    <div className="min-h-screen bg-background text-foreground font-mono flex">
      <Sidebar user={user} onLogout={handleLogout} active="aegis" />

      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h2 className="text-2xl font-display font-bold text-white uppercase tracking-wider">
                Aegis Monitor
              </h2>
              <p className="text-muted-foreground text-sm mt-1">
                Real-time security monitoring from your database
              </p>
            </div>
            <div className="flex items-center gap-2 bg-green-500/10 text-green-500 px-4 py-2 text-sm">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              Shield Active
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-card/50 border border-white/10 p-6">
              <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Auth Events</div>
              <div className="text-3xl font-display font-bold text-white">{authLogs?.length || 0}</div>
              <div className="text-xs text-muted-foreground mt-1">Last 100 events</div>
            </div>
            <div className="bg-card/50 border border-white/10 p-6">
              <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Failed Logins</div>
              <div className="text-3xl font-display font-bold text-destructive">{failedLogins}</div>
              <div className="text-xs text-muted-foreground mt-1">Blocked attempts</div>
            </div>
            <div className="bg-card/50 border border-white/10 p-6">
              <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Successful Logins</div>
              <div className="text-3xl font-display font-bold text-green-500">{successLogins}</div>
              <div className="text-xs text-muted-foreground mt-1">Verified access</div>
            </div>
            <div className="bg-card/50 border border-white/10 p-6">
              <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Active Alerts</div>
              <div className="text-3xl font-display font-bold text-primary">{unresolvedAlerts}</div>
              <div className="text-xs text-muted-foreground mt-1">Unresolved</div>
            </div>
          </div>

          {alerts && alerts.length > 0 && (
            <div className="bg-card/50 border border-white/10 p-6 mb-8">
              <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-destructive" />
                System Alerts
              </h3>
              <div className="space-y-4">
                {alerts.slice(0, 10).map((alert: any) => (
                  <div key={alert.id} className="flex items-center justify-between p-4 bg-black/20 border border-white/5">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        alert.severity === 'critical' ? 'bg-destructive/10' :
                        alert.severity === 'warning' ? 'bg-yellow-500/10' :
                        'bg-blue-500/10'
                      }`}>
                        <AlertTriangle className={`w-5 h-5 ${
                          alert.severity === 'critical' ? 'text-destructive' :
                          alert.severity === 'warning' ? 'text-yellow-500' :
                          'text-blue-500'
                        }`} />
                      </div>
                      <div>
                        <div className="text-white font-bold">{alert.type}</div>
                        <div className="text-xs text-muted-foreground">{alert.message}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`text-xs px-2 py-1 rounded uppercase font-bold ${
                        alert.is_resolved ? 'bg-green-500/10 text-green-500' : 'bg-destructive/10 text-destructive'
                      }`}>
                        {alert.is_resolved ? 'resolved' : 'active'}
                      </span>
                      <button
                        onClick={() => resolveAlertMutation.mutate({ id: alert.id, is_resolved: !alert.is_resolved })}
                        disabled={resolveAlertMutation.isPending}
                        className={`px-3 py-1 text-xs font-bold uppercase transition-colors ${
                          alert.is_resolved 
                            ? 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20'
                            : 'bg-green-500/10 text-green-500 hover:bg-green-500/20'
                        }`}
                        data-testid={`button-resolve-${alert.id}`}
                      >
                        {alert.is_resolved ? 'Reopen' : 'Resolve'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-card/50 border border-white/10 p-6">
            <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-6 flex items-center gap-2">
              <Key className="w-4 h-4 text-primary" />
              Recent Auth Events
            </h3>
            <div className="space-y-2">
              {authLogs?.slice(0, 10).map((log: any) => (
                <div key={log.id} className="flex items-center justify-between p-3 bg-black/20 border border-white/5 text-sm">
                  <div className="flex items-center gap-3">
                    {log.event_type?.includes('success') ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : log.event_type?.includes('fail') ? (
                      <XCircle className="w-4 h-4 text-destructive" />
                    ) : (
                      <Key className="w-4 h-4 text-muted-foreground" />
                    )}
                    <span className="text-white">{log.event_type}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="font-mono">{log.ip_address || 'N/A'}</span>
                    <span>{log.created_at ? new Date(log.created_at).toLocaleString() : ''}</span>
                  </div>
                </div>
              ))}
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
        <NavItem icon={<Users className="w-4 h-4" />} label="Architects" href="/admin/architects" active={active === 'architects'} />
        <NavItem icon={<Inbox className="w-4 h-4" />} label="Applications" href="/admin/applications" active={active === 'applications'} />
        <NavItem icon={<Award className="w-4 h-4" />} label="Achievements" href="/admin/achievements" active={active === 'achievements'} />
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
