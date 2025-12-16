import { useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { 
  Users, FileCode, Shield, Activity, LogOut, 
  BarChart3, User, Globe, Key, Award, Star, Trophy
} from "lucide-react";

export default function AdminAchievements() {
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

  const { data: achievements, isLoading } = useQuery({
    queryKey: ["achievements"],
    queryFn: async () => {
      const res = await fetch("/api/achievements");
      if (!res.ok) throw new Error("Failed to fetch achievements");
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

  const getRarityColor = (rarity: string) => {
    switch (rarity?.toLowerCase()) {
      case 'legendary': return 'border-yellow-500 bg-yellow-500/10';
      case 'epic': return 'border-purple-500 bg-purple-500/10';
      case 'rare': return 'border-blue-500 bg-blue-500/10';
      case 'uncommon': return 'border-green-500 bg-green-500/10';
      default: return 'border-white/10 bg-white/5';
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-mono flex">
      <Sidebar user={user} onLogout={handleLogout} active="achievements" />

      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="mb-8">
            <h2 className="text-2xl font-display font-bold text-white uppercase tracking-wider">
              Achievements
            </h2>
            <p className="text-muted-foreground text-sm mt-1">
              {achievements?.length || 0} achievements configured
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading ? (
              <div className="col-span-full text-center text-muted-foreground py-12">Loading...</div>
            ) : achievements?.length === 0 ? (
              <div className="col-span-full text-center text-muted-foreground py-12">No achievements found</div>
            ) : (
              achievements?.map((achievement: any) => (
                <motion.div 
                  key={achievement.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`border p-6 ${getRarityColor(achievement.rarity)}`}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-black/20 rounded-lg flex items-center justify-center text-2xl">
                      {achievement.icon || '🏆'}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-display text-white uppercase text-sm">{achievement.name}</h3>
                      <p className="text-xs text-muted-foreground mt-1">{achievement.description}</p>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-white/5 grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <div className="text-muted-foreground">XP</div>
                      <div className="text-primary font-bold">+{achievement.xp_reward || 0}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Points</div>
                      <div className="text-secondary font-bold">+{achievement.points_reward || 0}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Rarity</div>
                      <div className="text-white font-bold capitalize">{achievement.rarity || 'common'}</div>
                    </div>
                  </div>
                  
                  {achievement.category && (
                    <div className="mt-3">
                      <span className="text-xs bg-white/5 px-2 py-1 rounded text-muted-foreground">
                        {achievement.category}
                      </span>
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
        <NavItem icon={<Award className="w-4 h-4" />} label="Achievements" href="/admin/achievements" active={active === 'achievements'} />
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
