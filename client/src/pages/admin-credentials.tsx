import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { 
  Users, FileCode, Shield, Activity, LogOut, 
  BarChart3, User, Award, Clock, AlertTriangle
} from "lucide-react";

export default function AdminCredentials() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();

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
          <NavItem icon={<FileCode className="w-4 h-4" />} label="Credentials" href="/admin/credentials" active />
          <NavItem icon={<Activity className="w-4 h-4" />} label="Projects" href="/admin/projects" />
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
              Credential Issuance
            </h2>
            <p className="text-muted-foreground text-sm mt-1">
              Manage Codex certifications and passport credentials
            </p>
          </div>

          {/* Coming Soon Notice */}
          <div className="bg-card/50 border border-secondary/30 p-8 mb-8">
            <div className="flex items-center gap-4 mb-4">
              <Award className="w-12 h-12 text-secondary" />
              <div>
                <h3 className="text-xl font-display text-white uppercase">Codex Certification System</h3>
                <p className="text-muted-foreground text-sm">Under Development</p>
              </div>
            </div>
            <p className="text-muted-foreground mb-6">
              The credential issuance system will allow administrators to:
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-secondary rounded-full" />
                Issue Architect Passports with unique identifiers
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-secondary rounded-full" />
                Award skill certifications based on completed curriculum
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-secondary rounded-full" />
                Verify and validate credentials across platforms
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-secondary rounded-full" />
                Revoke credentials when necessary
              </li>
            </ul>
          </div>

          {/* Placeholder Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-card/50 border border-white/10 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Award className="w-5 h-5 text-primary" />
                <span className="text-xs text-muted-foreground uppercase tracking-wider">Issued</span>
              </div>
              <div className="text-3xl font-display font-bold text-white">0</div>
              <div className="text-xs text-muted-foreground mt-1">Passports Issued</div>
            </div>
            <div className="bg-card/50 border border-white/10 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-5 h-5 text-secondary" />
                <span className="text-xs text-muted-foreground uppercase tracking-wider">Pending</span>
              </div>
              <div className="text-3xl font-display font-bold text-white">0</div>
              <div className="text-xs text-muted-foreground mt-1">Awaiting Review</div>
            </div>
            <div className="bg-card/50 border border-white/10 p-6">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="w-5 h-5 text-destructive" />
                <span className="text-xs text-muted-foreground uppercase tracking-wider">Revoked</span>
              </div>
              <div className="text-3xl font-display font-bold text-white">0</div>
              <div className="text-xs text-muted-foreground mt-1">Credentials Revoked</div>
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
