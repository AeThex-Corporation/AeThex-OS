import { useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { 
  Users, FileCode, Shield, Activity, LogOut, 
  Home, BarChart3, Settings, ChevronRight, User, Globe, Award, Key, Inbox
} from "lucide-react";
import gridBg from '@assets/generated_images/dark_subtle_digital_grid_texture.png';

export default function Admin() {
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

  const { data: metrics } = useQuery({
    queryKey: ["metrics"],
    queryFn: async () => {
      const res = await fetch("/api/metrics");
      return res.json();
    },
    enabled: isAuthenticated,
  });

  const { data: profiles } = useQuery({
    queryKey: ["profiles"],
    queryFn: async () => {
      const res = await fetch("/api/profiles");
      return res.json();
    },
    enabled: isAuthenticated,
  });

  const { data: projects } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const res = await fetch("/api/projects");
      return res.json();
    },
    enabled: isAuthenticated,
  });

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-primary animate-pulse">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const handleLogout = async () => {
    await logout();
    setLocation("/");
  };

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
          <NavItem icon={<BarChart3 className="w-4 h-4" />} label="Dashboard" href="/admin" active />
          <NavItem icon={<Activity className="w-4 h-4" />} label="Live Activity" href="/admin/activity" />
          <NavItem icon={<Users className="w-4 h-4" />} label="Architects" href="/admin/architects" />
          <NavItem icon={<Inbox className="w-4 h-4" />} label="Applications" href="/admin/applications" />
          <NavItem icon={<Award className="w-4 h-4" />} label="Achievements" href="/admin/achievements" />
          <NavItem icon={<FileCode className="w-4 h-4" />} label="Credentials" href="/admin/credentials" />
          <NavItem icon={<Globe className="w-4 h-4" />} label="Sites" href="/admin/sites" />
          <NavItem icon={<Key className="w-4 h-4" />} label="Auth Logs" href="/admin/logs" />
          <NavItem icon={<Shield className="w-4 h-4" />} label="Aegis Monitor" href="/admin/aegis" />
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
            data-testid="button-logout"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 relative overflow-auto">
        <div 
          className="absolute inset-0 opacity-10 pointer-events-none z-0"
          style={{ backgroundImage: `url(${gridBg})`, backgroundSize: 'cover' }}
        />
        
        <div className="relative z-10 p-8">
          <div className="mb-8">
            <h2 className="text-2xl font-display font-bold text-white uppercase tracking-wider">
              Dashboard
            </h2>
            <p className="text-muted-foreground text-sm mt-1">
              Real-time ecosystem metrics from Supabase
            </p>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
            <MetricCard 
              title="Total Architects" 
              value={metrics?.totalProfiles || 0} 
              icon={<Users className="w-5 h-5 text-primary" />}
            />
            <MetricCard 
              title="Active Projects" 
              value={metrics?.totalProjects || 0} 
              icon={<Activity className="w-5 h-5 text-secondary" />}
            />
            <MetricCard 
              title="Online Now" 
              value={metrics?.onlineUsers || 0} 
              icon={<div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />}
            />
            <MetricCard 
              title="Verified Users" 
              value={metrics?.verifiedUsers || 0} 
              icon={<Shield className="w-5 h-5 text-primary" />}
            />
          </div>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Recent Profiles */}
            <div className="bg-card/50 border border-white/10 p-6">
              <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                Recent Architects
              </h3>
              <div className="space-y-3">
                {profiles?.slice(0, 5).map((profile: any) => (
                  <div key={profile.id} className="flex items-center justify-between p-3 bg-black/20 border border-white/5">
                    <div className="flex items-center gap-3">
                      <img 
                        src={profile.avatar_url} 
                        alt={profile.username}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <div>
                        <div className="text-sm text-white font-bold">{profile.username}</div>
                        <div className="text-xs text-muted-foreground">
                          Level {profile.level} • {profile.role}
                        </div>
                      </div>
                    </div>
                    <div className={`text-xs px-2 py-1 rounded ${
                      profile.status === 'online' 
                        ? 'bg-green-500/10 text-green-500' 
                        : 'bg-white/5 text-muted-foreground'
                    }`}>
                      {profile.status}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Projects */}
            <div className="bg-card/50 border border-white/10 p-6">
              <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                <Activity className="w-4 h-4 text-secondary" />
                Active Projects
              </h3>
              <div className="space-y-3">
                {projects?.slice(0, 5).map((project: any) => (
                  <div key={project.id} className="p-3 bg-black/20 border border-white/5">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm text-white font-bold">{project.title}</div>
                      <div className="text-xs text-muted-foreground">{project.engine}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-1 bg-white/10 rounded overflow-hidden">
                        <div 
                          className="h-full bg-secondary"
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                      <div className="text-xs text-secondary font-bold">{project.progress}%</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* XP Stats */}
          <div className="mt-8 bg-card/50 border border-white/10 p-6">
            <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-4">
              Ecosystem Stats
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <div className="text-3xl font-display font-bold text-primary">
                  {metrics?.totalXP?.toLocaleString() || 0}
                </div>
                <div className="text-xs text-muted-foreground uppercase">Total XP Earned</div>
              </div>
              <div>
                <div className="text-3xl font-display font-bold text-white">
                  {metrics?.avgLevel || 1}
                </div>
                <div className="text-xs text-muted-foreground uppercase">Avg Level</div>
              </div>
              <div>
                <div className="text-3xl font-display font-bold text-secondary">
                  {profiles?.filter((p: any) => p.onboarded).length || 0}
                </div>
                <div className="text-xs text-muted-foreground uppercase">Onboarded</div>
              </div>
              <div>
                <div className="text-3xl font-display font-bold text-white">
                  {profiles?.filter((p: any) => p.role === 'admin').length || 0}
                </div>
                <div className="text-xs text-muted-foreground uppercase">Admins</div>
              </div>
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

function MetricCard({ title, value, icon }: { title: string; value: number; icon: React.ReactNode }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card/50 border border-white/10 p-6"
    >
      <div className="flex justify-between items-start mb-4">
        <div className="text-xs text-muted-foreground uppercase tracking-widest font-bold">{title}</div>
        {icon}
      </div>
      <div className="text-3xl font-display font-bold text-white">{value}</div>
    </motion.div>
  );
}
