import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { 
  Users, FileCode, Shield, Activity, LogOut, 
  BarChart3, User, AlertTriangle, CheckCircle, XCircle, Eye
} from "lucide-react";

export default function AdminAegis() {
  const { user, isAuthenticated, isLoading: authLoading, logout } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setLocation("/login");
    }
  }, [authLoading, isAuthenticated, setLocation]);

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

  // Mock threat data for demo
  const mockThreats = [
    { id: 1, type: "PII Exposure", severity: "high", status: "blocked", timestamp: "2 min ago" },
    { id: 2, type: "Suspicious Pattern", severity: "medium", status: "flagged", timestamp: "15 min ago" },
    { id: 3, type: "Rate Limit", severity: "low", status: "allowed", timestamp: "1 hour ago" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground font-mono flex">
      {/* Sidebar */}
      <div className="w-64 bg-card border-r border-white/10 flex flex-col">
        <div className="p-6 border-b border-white/10">
          <h1 className="text-xl font-display font-bold text-white uppercase tracking-wider">
            AeThex
          </h1>
          <p className="text-xs text-primary mt-1">Command Center</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <NavItem icon={<BarChart3 className="w-4 h-4" />} label="Dashboard" href="/admin" />
          <NavItem icon={<Users className="w-4 h-4" />} label="Architects" href="/admin/architects" />
          <NavItem icon={<FileCode className="w-4 h-4" />} label="Credentials" href="/admin/credentials" />
          <NavItem icon={<Activity className="w-4 h-4" />} label="Projects" href="/admin/projects" />
          <NavItem icon={<Shield className="w-4 h-4" />} label="Aegis Monitor" href="/admin/aegis" active />
        </nav>
        
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-primary" />
            </div>
            <div>
              <div className="text-sm text-white font-bold">{user?.username}</div>
              <div className="text-xs text-muted-foreground">
                {user?.isAdmin ? "Administrator" : "Member"}
              </div>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-2 text-muted-foreground hover:text-white text-sm py-2 px-3 hover:bg-white/5 transition-colors"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h2 className="text-2xl font-display font-bold text-white uppercase tracking-wider">
                Aegis Monitor
              </h2>
              <p className="text-muted-foreground text-sm mt-1">
                Real-time security monitoring and threat intervention
              </p>
            </div>
            <div className="flex items-center gap-2 bg-green-500/10 text-green-500 px-4 py-2 text-sm">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              Shield Active
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-card/50 border border-white/10 p-6">
              <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Threats Blocked</div>
              <div className="text-3xl font-display font-bold text-destructive">247</div>
              <div className="text-xs text-muted-foreground mt-1">Last 24 hours</div>
            </div>
            <div className="bg-card/50 border border-white/10 p-6">
              <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">PII Scrubbed</div>
              <div className="text-3xl font-display font-bold text-primary">1,892</div>
              <div className="text-xs text-muted-foreground mt-1">Instances protected</div>
            </div>
            <div className="bg-card/50 border border-white/10 p-6">
              <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Active Sessions</div>
              <div className="text-3xl font-display font-bold text-white">34</div>
              <div className="text-xs text-muted-foreground mt-1">Being monitored</div>
            </div>
            <div className="bg-card/50 border border-white/10 p-6">
              <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Uptime</div>
              <div className="text-3xl font-display font-bold text-green-500">99.9%</div>
              <div className="text-xs text-muted-foreground mt-1">Last 30 days</div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-card/50 border border-white/10 p-6">
            <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-6 flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              Recent Threat Activity
            </h3>
            
            <div className="space-y-4">
              {mockThreats.map((threat) => (
                <div key={threat.id} className="flex items-center justify-between p-4 bg-black/20 border border-white/5">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      threat.severity === 'high' ? 'bg-destructive/10' :
                      threat.severity === 'medium' ? 'bg-yellow-500/10' :
                      'bg-white/5'
                    }`}>
                      <AlertTriangle className={`w-5 h-5 ${
                        threat.severity === 'high' ? 'text-destructive' :
                        threat.severity === 'medium' ? 'text-yellow-500' :
                        'text-muted-foreground'
                      }`} />
                    </div>
                    <div>
                      <div className="text-white font-bold">{threat.type}</div>
                      <div className="text-xs text-muted-foreground">{threat.timestamp}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`text-xs px-2 py-1 rounded uppercase font-bold ${
                      threat.status === 'blocked' ? 'bg-destructive/10 text-destructive' :
                      threat.status === 'flagged' ? 'bg-yellow-500/10 text-yellow-500' :
                      'bg-green-500/10 text-green-500'
                    }`}>
                      {threat.status}
                    </span>
                    <button className="text-muted-foreground hover:text-white p-2">
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 text-center">
              <p className="text-xs text-muted-foreground">
                Aegis security layer is monitoring all active sessions
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function NavItem({ icon, label, href, active = false }: { 
  icon: React.ReactNode; 
  label: string; 
  href: string;
  active?: boolean;
}) {
  return (
    <Link href={href}>
      <div className={`flex items-center gap-3 px-3 py-2 text-sm transition-colors cursor-pointer ${
        active 
          ? 'bg-primary/10 text-primary border-l-2 border-primary' 
          : 'text-muted-foreground hover:text-white hover:bg-white/5'
      }`}>
        {icon}
        {label}
      </div>
    </Link>
  );
}
