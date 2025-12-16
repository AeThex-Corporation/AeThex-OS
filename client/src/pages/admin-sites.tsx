import { motion } from "framer-motion";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { 
  Users, FileCode, Shield, Activity, LogOut, 
  BarChart3, User, Globe, CheckCircle, XCircle, AlertTriangle, ExternalLink
} from "lucide-react";

export default function AdminSites() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();

  const { data: sites, isLoading } = useQuery({
    queryKey: ["sites"],
    queryFn: async () => {
      const res = await fetch("/api/sites");
      if (!res.ok) throw new Error("Failed to fetch sites");
      return res.json();
    },
  });

  const handleLogout = async () => {
    await logout();
    setLocation("/");
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'online': case 'operational': return 'text-green-500';
      case 'degraded': case 'warning': return 'text-yellow-500';
      case 'offline': case 'down': return 'text-destructive';
      default: return 'text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'online': case 'operational': return <CheckCircle className="w-4 h-4" />;
      case 'degraded': case 'warning': return <AlertTriangle className="w-4 h-4" />;
      case 'offline': case 'down': return <XCircle className="w-4 h-4" />;
      default: return <Globe className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-mono flex">
      <Sidebar user={user} onLogout={handleLogout} active="sites" />

      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="mb-8">
            <h2 className="text-2xl font-display font-bold text-white uppercase tracking-wider">
              AeThex Sites
            </h2>
            <p className="text-muted-foreground text-sm mt-1">
              {sites?.length || 0} monitored sites
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading ? (
              <div className="col-span-full text-center text-muted-foreground py-12">
                Loading sites...
              </div>
            ) : sites?.length === 0 ? (
              <div className="col-span-full text-center text-muted-foreground py-12">
                No sites found
              </div>
            ) : (
              sites?.map((site: any) => (
                <motion.div 
                  key={site.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-card/50 border border-white/10 p-6 hover:border-primary/30 transition-colors"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-2">
                      <Globe className="w-5 h-5 text-primary" />
                      <h3 className="font-display text-white uppercase text-sm">{site.name}</h3>
                    </div>
                    <div className={`flex items-center gap-1 text-xs ${getStatusColor(site.status)}`}>
                      {getStatusIcon(site.status)}
                      {site.status || 'unknown'}
                    </div>
                  </div>
                  
                  {site.url && (
                    <a 
                      href={site.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 mb-4"
                    >
                      {site.url} <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <div className="text-muted-foreground">Uptime</div>
                      <div className="text-white font-bold">{site.uptime || 0}%</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Response</div>
                      <div className="text-white font-bold">{site.response_time || 0}ms</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Users</div>
                      <div className="text-white font-bold">{site.users || 0}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Requests</div>
                      <div className="text-white font-bold">{site.requests || 0}</div>
                    </div>
                  </div>
                  
                  {site.last_check && (
                    <div className="mt-4 pt-4 border-t border-white/5 text-xs text-muted-foreground">
                      Last check: {new Date(site.last_check).toLocaleString()}
                    </div>
                  )}
                </motion.div>
              ))
            )}
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
