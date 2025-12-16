import { useState } from "react";
import { motion } from "framer-motion";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { 
  Users, FileCode, Shield, Activity, LogOut, 
  BarChart3, User, Globe, Award, Key, Inbox, 
  CheckCircle, XCircle, Clock, Eye, Mail, Briefcase
} from "lucide-react";

export default function AdminApplications() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data: applications, isLoading } = useQuery({
    queryKey: ["applications"],
    queryFn: async () => {
      const res = await fetch("/api/applications");
      if (!res.ok) throw new Error("Failed to fetch applications");
      return res.json();
    },
  });

  const updateApplicationMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await fetch(`/api/applications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update application");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      setSelectedApp(null);
    },
  });

  const handleLogout = async () => {
    await logout();
    setLocation("/");
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'approved': case 'accepted': return 'bg-green-500/10 text-green-500';
      case 'rejected': case 'declined': return 'bg-destructive/10 text-destructive';
      case 'pending': case 'review': return 'bg-yellow-500/10 text-yellow-500';
      default: return 'bg-white/5 text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'approved': case 'accepted': return <CheckCircle className="w-4 h-4" />;
      case 'rejected': case 'declined': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const pendingCount = applications?.filter((a: any) => a.status === 'pending' || !a.status).length || 0;

  return (
    <div className="min-h-screen bg-background text-foreground font-mono flex">
      <Sidebar user={user} onLogout={handleLogout} active="applications" />

      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="mb-8">
            <h2 className="text-2xl font-display font-bold text-white uppercase tracking-wider">
              Applications
            </h2>
            <p className="text-muted-foreground text-sm mt-1">
              {applications?.length || 0} total applications • {pendingCount} pending review
            </p>
          </div>

          <div className="bg-card/50 border border-white/10 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10 text-left">
                  <th className="p-4 text-xs text-muted-foreground uppercase tracking-wider font-bold">Applicant</th>
                  <th className="p-4 text-xs text-muted-foreground uppercase tracking-wider font-bold">Position</th>
                  <th className="p-4 text-xs text-muted-foreground uppercase tracking-wider font-bold">Status</th>
                  <th className="p-4 text-xs text-muted-foreground uppercase tracking-wider font-bold">Submitted</th>
                  <th className="p-4 text-xs text-muted-foreground uppercase tracking-wider font-bold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-muted-foreground">Loading...</td>
                  </tr>
                ) : applications?.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-muted-foreground">No applications found</td>
                  </tr>
                ) : (
                  applications?.map((app: any) => (
                    <tr key={app.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <div className="text-sm text-white font-bold">{app.name || app.applicant_name || 'Unknown'}</div>
                            <div className="text-xs text-muted-foreground">{app.email || app.applicant_email || 'No email'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-sm text-white">{app.position || app.role || 'General'}</span>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded uppercase font-bold ${getStatusColor(app.status)}`}>
                          {getStatusIcon(app.status)}
                          {app.status || 'pending'}
                        </span>
                      </td>
                      <td className="p-4 text-xs text-muted-foreground">
                        {app.submitted_at ? new Date(app.submitted_at).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSelectedApp(app)}
                            className="text-muted-foreground hover:text-white p-1"
                            data-testid={`button-view-${app.id}`}
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {(!app.status || app.status === 'pending') && (
                            <>
                              <button
                                onClick={() => updateApplicationMutation.mutate({ id: app.id, status: 'approved' })}
                                disabled={updateApplicationMutation.isPending}
                                className="text-green-500 hover:bg-green-500/10 p-1 rounded"
                                data-testid={`button-approve-${app.id}`}
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => updateApplicationMutation.mutate({ id: app.id, status: 'rejected' })}
                                disabled={updateApplicationMutation.isPending}
                                className="text-destructive hover:bg-destructive/10 p-1 rounded"
                                data-testid={`button-reject-${app.id}`}
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {selectedApp && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card border border-white/10 w-full max-w-2xl max-h-[80vh] overflow-auto"
          >
            <div className="p-6 border-b border-white/10 flex justify-between items-start">
              <div>
                <h3 className="text-xl font-display text-white uppercase">Application Details</h3>
                <p className="text-muted-foreground text-sm mt-1">
                  Submitted {selectedApp.submitted_at ? new Date(selectedApp.submitted_at).toLocaleString() : 'Unknown'}
                </p>
              </div>
              <button onClick={() => setSelectedApp(null)} className="text-muted-foreground hover:text-white">
                ✕
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-xs text-muted-foreground uppercase tracking-wider">Name</label>
                  <div className="text-white font-bold">{selectedApp.name || selectedApp.applicant_name || 'Unknown'}</div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground uppercase tracking-wider">Email</label>
                  <div className="text-white">{selectedApp.email || selectedApp.applicant_email || 'No email'}</div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground uppercase tracking-wider">Position</label>
                  <div className="text-white">{selectedApp.position || selectedApp.role || 'General'}</div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground uppercase tracking-wider">Status</label>
                  <div className={`inline-flex items-center gap-1 ${getStatusColor(selectedApp.status)}`}>
                    {getStatusIcon(selectedApp.status)}
                    {selectedApp.status || 'pending'}
                  </div>
                </div>
              </div>
              
              {(selectedApp.message || selectedApp.cover_letter || selectedApp.description) && (
                <div>
                  <label className="text-xs text-muted-foreground uppercase tracking-wider">Message</label>
                  <div className="text-white mt-2 p-4 bg-black/20 border border-white/5">
                    {selectedApp.message || selectedApp.cover_letter || selectedApp.description}
                  </div>
                </div>
              )}
              
              {selectedApp.resume_url && (
                <div>
                  <label className="text-xs text-muted-foreground uppercase tracking-wider">Resume</label>
                  <a 
                    href={selectedApp.resume_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline text-sm mt-1 block"
                  >
                    View Resume
                  </a>
                </div>
              )}
            </div>
            
            <div className="p-6 border-t border-white/10 flex justify-end gap-4">
              <button onClick={() => setSelectedApp(null)} className="px-4 py-2 text-muted-foreground hover:text-white">
                Close
              </button>
              {(!selectedApp.status || selectedApp.status === 'pending') && (
                <>
                  <button 
                    onClick={() => updateApplicationMutation.mutate({ id: selectedApp.id, status: 'rejected' })}
                    disabled={updateApplicationMutation.isPending}
                    className="px-4 py-2 bg-destructive/10 text-destructive hover:bg-destructive/20 font-bold uppercase"
                  >
                    Reject
                  </button>
                  <button 
                    onClick={() => updateApplicationMutation.mutate({ id: selectedApp.id, status: 'approved' })}
                    disabled={updateApplicationMutation.isPending}
                    className="px-4 py-2 bg-green-500/10 text-green-500 hover:bg-green-500/20 font-bold uppercase"
                  >
                    Approve
                  </button>
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
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
