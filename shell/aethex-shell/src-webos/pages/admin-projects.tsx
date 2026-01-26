import { motion } from "framer-motion";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { 
  Users, FileCode, Shield, Activity, LogOut, 
  BarChart3, User, ExternalLink
} from "lucide-react";

export default function AdminProjects() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();

  const { data: projects, isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const res = await fetch("/api/projects");
      return res.json();
    },
  });

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
          <NavItem icon={<BarChart3 className="w-4 h-4" />} label="Dashboard" href="/admin" />
          <NavItem icon={<Users className="w-4 h-4" />} label="Architects" href="/admin/architects" />
          <NavItem icon={<FileCode className="w-4 h-4" />} label="Credentials" href="/admin/credentials" />
          <NavItem icon={<Activity className="w-4 h-4" />} label="Projects" href="/admin/projects" active />
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
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="mb-8">
            <h2 className="text-2xl font-display font-bold text-white uppercase tracking-wider">
              Projects
            </h2>
            <p className="text-muted-foreground text-sm mt-1">
              {projects?.length || 0} active projects
            </p>
          </div>

          {/* Projects Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading ? (
              <div className="col-span-full text-center text-muted-foreground py-12">
                Loading projects...
              </div>
            ) : projects?.length === 0 ? (
              <div className="col-span-full text-center text-muted-foreground py-12">
                No projects found
              </div>
            ) : (
              projects?.map((project: any) => (
                <motion.div 
                  key={project.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-card/50 border border-white/10 p-6 hover:border-primary/30 transition-colors"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-display text-white uppercase">{project.title}</h3>
                      <div className="text-xs text-muted-foreground mt-1">{project.engine}</div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded uppercase font-bold ${
                      project.status === 'In Progress' ? 'bg-secondary/10 text-secondary' :
                      project.status === 'planning' ? 'bg-primary/10 text-primary' :
                      'bg-white/5 text-muted-foreground'
                    }`}>
                      {project.status}
                    </span>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {project.description || 'No description'}
                  </p>
                  
                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="text-secondary font-bold">{project.progress}%</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded overflow-hidden">
                      <div 
                        className="h-full bg-secondary transition-all"
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <span className={`px-2 py-1 rounded ${
                      project.priority === 'Critical' ? 'bg-destructive/10 text-destructive' :
                      project.priority === 'High' ? 'bg-primary/10 text-primary' :
                      'bg-white/5 text-muted-foreground'
                    }`}>
                      {project.priority}
                    </span>
                    
                    {project.github_url && (
                      <a 
                        href={project.github_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-white flex items-center gap-1"
                      >
                        GitHub <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </motion.div>
              ))
            )}
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
