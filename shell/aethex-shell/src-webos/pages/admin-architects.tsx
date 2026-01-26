import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { 
  Users, FileCode, Shield, Activity, LogOut, 
  Home, BarChart3, Settings, User, Search,
  CheckCircle, XCircle, Eye, Edit, ChevronRight,
  Download, Trash2, Square, CheckSquare
} from "lucide-react";

export default function AdminArchitects() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProfile, setSelectedProfile] = useState<any>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [verifiedFilter, setVerifiedFilter] = useState<string>("all");
  const queryClient = useQueryClient();

  const { data: profiles, isLoading } = useQuery({
    queryKey: ["profiles"],
    queryFn: async () => {
      const res = await fetch("/api/profiles");
      return res.json();
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const res = await fetch(`/api/profiles/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
      setSelectedProfile(null);
    },
  });

  const filteredProfiles = useMemo(() => {
    if (!profiles) return [];
    return profiles.filter((p: any) => {
      const matchesSearch = p.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.email?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole = roleFilter === "all" || p.role === roleFilter;
      const matchesVerified = verifiedFilter === "all" || 
        (verifiedFilter === "verified" && p.is_verified) ||
        (verifiedFilter === "unverified" && !p.is_verified);
      return matchesSearch && matchesRole && matchesVerified;
    });
  }, [profiles, searchQuery, roleFilter, verifiedFilter]);

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredProfiles.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredProfiles.map((p: any) => p.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const exportToCSV = () => {
    const dataToExport = selectedIds.size > 0 
      ? filteredProfiles.filter((p: any) => selectedIds.has(p.id))
      : filteredProfiles;
    
    const headers = ["Username", "Email", "Role", "Level", "XP", "Status", "Verified"];
    const csvContent = [
      headers.join(","),
      ...dataToExport.map((p: any) => [
        p.username || "",
        p.email || "",
        p.role || "",
        p.level || 0,
        p.total_xp || 0,
        p.status || "",
        p.is_verified ? "Yes" : "No"
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `architects_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  const bulkVerify = async (verify: boolean) => {
    const ids = Array.from(selectedIds);
    for (const id of ids) {
      await updateProfileMutation.mutateAsync({ id, updates: { is_verified: verify } });
    }
    setSelectedIds(new Set());
  };

  const handleLogout = async () => {
    await logout();
    setLocation("/");
  };

  const toggleVerified = (profile: any) => {
    updateProfileMutation.mutate({
      id: profile.id,
      updates: { is_verified: !profile.is_verified }
    });
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
          <NavItem icon={<Users className="w-4 h-4" />} label="Architects" href="/admin/architects" active />
          <NavItem icon={<FileCode className="w-4 h-4" />} label="Credentials" href="/admin/credentials" />
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
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-display font-bold text-white uppercase tracking-wider">
                Architects
              </h2>
              <p className="text-muted-foreground text-sm mt-1">
                {filteredProfiles.length} of {profiles?.length || 0} architects
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="bg-card border border-white/10 px-3 py-2 text-sm text-white focus:border-primary/50 focus:outline-none"
                data-testid="filter-role"
              >
                <option value="all">All Roles</option>
                <option value="admin">Admin</option>
                <option value="oversee">Overseer</option>
                <option value="employee">Employee</option>
                <option value="member">Member</option>
              </select>

              <select
                value={verifiedFilter}
                onChange={(e) => setVerifiedFilter(e.target.value)}
                className="bg-card border border-white/10 px-3 py-2 text-sm text-white focus:border-primary/50 focus:outline-none"
                data-testid="filter-verified"
              >
                <option value="all">All Status</option>
                <option value="verified">Verified</option>
                <option value="unverified">Unverified</option>
              </select>

              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search architects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-card border border-white/10 pl-10 pr-4 py-2 text-sm text-white placeholder-muted-foreground focus:border-primary/50 focus:outline-none w-64"
                  data-testid="input-search"
                />
              </div>
            </div>
          </div>

          {selectedIds.size > 0 && (
            <div className="flex items-center gap-4 mb-4 p-3 bg-primary/10 border border-primary/30 rounded">
              <span className="text-sm text-white">{selectedIds.size} selected</span>
              <button
                onClick={() => bulkVerify(true)}
                className="px-3 py-1 bg-green-500/20 text-green-400 text-sm rounded hover:bg-green-500/30 transition-colors"
                data-testid="bulk-verify"
              >
                Verify Selected
              </button>
              <button
                onClick={() => bulkVerify(false)}
                className="px-3 py-1 bg-red-500/20 text-red-400 text-sm rounded hover:bg-red-500/30 transition-colors"
                data-testid="bulk-unverify"
              >
                Revoke Selected
              </button>
              <button
                onClick={() => setSelectedIds(new Set())}
                className="px-3 py-1 text-muted-foreground text-sm hover:text-white transition-colors"
              >
                Clear Selection
              </button>
              <div className="flex-1" />
              <button
                onClick={exportToCSV}
                className="flex items-center gap-2 px-3 py-1 bg-white/10 text-white text-sm rounded hover:bg-white/20 transition-colors"
                data-testid="export-csv"
              >
                <Download className="w-4 h-4" /> Export CSV
              </button>
            </div>
          )}

          {selectedIds.size === 0 && (
            <div className="flex justify-end mb-4">
              <button
                onClick={exportToCSV}
                className="flex items-center gap-2 px-3 py-1 bg-white/10 text-white text-sm rounded hover:bg-white/20 transition-colors"
                data-testid="export-csv-all"
              >
                <Download className="w-4 h-4" /> Export All to CSV
              </button>
            </div>
          )}

          {/* Table */}
          <div className="bg-card/50 border border-white/10 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10 text-left">
                  <th className="p-4 w-10">
                    <button onClick={toggleSelectAll} className="text-muted-foreground hover:text-white transition-colors">
                      {selectedIds.size === filteredProfiles.length && filteredProfiles.length > 0 ? (
                        <CheckSquare className="w-5 h-5 text-primary" />
                      ) : (
                        <Square className="w-5 h-5" />
                      )}
                    </button>
                  </th>
                  <th className="p-4 text-xs text-muted-foreground uppercase tracking-wider font-bold">User</th>
                  <th className="p-4 text-xs text-muted-foreground uppercase tracking-wider font-bold">Role</th>
                  <th className="p-4 text-xs text-muted-foreground uppercase tracking-wider font-bold">Level</th>
                  <th className="p-4 text-xs text-muted-foreground uppercase tracking-wider font-bold">XP</th>
                  <th className="p-4 text-xs text-muted-foreground uppercase tracking-wider font-bold">Status</th>
                  <th className="p-4 text-xs text-muted-foreground uppercase tracking-wider font-bold">Verified</th>
                  <th className="p-4 text-xs text-muted-foreground uppercase tracking-wider font-bold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-muted-foreground">
                      Loading...
                    </td>
                  </tr>
                ) : filteredProfiles.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-muted-foreground">
                      No architects found
                    </td>
                  </tr>
                ) : (
                  filteredProfiles.map((profile: any) => (
                    <tr key={profile.id} className={`border-b border-white/5 hover:bg-white/5 transition-colors ${selectedIds.has(profile.id) ? 'bg-primary/5' : ''}`}>
                      <td className="p-4">
                        <button onClick={() => toggleSelect(profile.id)} className="text-muted-foreground hover:text-white transition-colors">
                          {selectedIds.has(profile.id) ? (
                            <CheckSquare className="w-5 h-5 text-primary" />
                          ) : (
                            <Square className="w-5 h-5" />
                          )}
                        </button>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img 
                            src={profile.avatar_url} 
                            alt={profile.username}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                          <div>
                            <div className="text-sm text-white font-bold">{profile.username}</div>
                            <div className="text-xs text-muted-foreground">{profile.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`text-xs px-2 py-1 rounded uppercase font-bold ${
                          profile.role === 'admin' ? 'bg-primary/10 text-primary' :
                          profile.role === 'employee' ? 'bg-secondary/10 text-secondary' :
                          'bg-white/5 text-muted-foreground'
                        }`}>
                          {profile.role}
                        </span>
                      </td>
                      <td className="p-4 text-white font-bold">{profile.level}</td>
                      <td className="p-4 text-primary font-bold">{profile.total_xp}</td>
                      <td className="p-4">
                        <span className={`text-xs ${
                          profile.status === 'online' ? 'text-green-500' : 'text-muted-foreground'
                        }`}>
                          {profile.status}
                        </span>
                      </td>
                      <td className="p-4">
                        <button 
                          onClick={() => toggleVerified(profile)}
                          className={`p-1 rounded transition-colors ${
                            profile.is_verified 
                              ? 'text-green-500 hover:bg-green-500/10' 
                              : 'text-muted-foreground hover:bg-white/5'
                          }`}
                          data-testid={`button-verify-${profile.id}`}
                        >
                          {profile.is_verified ? (
                            <CheckCircle className="w-5 h-5" />
                          ) : (
                            <XCircle className="w-5 h-5" />
                          )}
                        </button>
                      </td>
                      <td className="p-4">
                        <button 
                          onClick={() => setSelectedProfile(profile)}
                          className="text-muted-foreground hover:text-white transition-colors p-1"
                          data-testid={`button-view-${profile.id}`}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Profile Detail Modal */}
      {selectedProfile && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card border border-white/10 w-full max-w-2xl max-h-[80vh] overflow-auto"
          >
            <div className="p-6 border-b border-white/10 flex justify-between items-start">
              <div className="flex items-center gap-4">
                <img 
                  src={selectedProfile.avatar_url} 
                  alt={selectedProfile.username}
                  className="w-16 h-16 rounded-full object-cover"
                />
                <div>
                  <h3 className="text-xl font-display text-white uppercase">{selectedProfile.username}</h3>
                  <p className="text-muted-foreground text-sm">{selectedProfile.email}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedProfile(null)}
                className="text-muted-foreground hover:text-white"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 grid grid-cols-2 gap-6">
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider">Role</label>
                <div className="text-white font-bold">{selectedProfile.role}</div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider">Level</label>
                <div className="text-white font-bold">{selectedProfile.level}</div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider">Total XP</label>
                <div className="text-primary font-bold">{selectedProfile.total_xp}</div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider">Status</label>
                <div className={selectedProfile.status === 'online' ? 'text-green-500' : 'text-muted-foreground'}>
                  {selectedProfile.status}
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider">Passport ID</label>
                <div className="text-white font-mono text-xs">{selectedProfile.aethex_passport_id}</div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider">Verified</label>
                <div className={selectedProfile.is_verified ? 'text-green-500' : 'text-destructive'}>
                  {selectedProfile.is_verified ? 'Yes' : 'No'}
                </div>
              </div>
              <div className="col-span-2">
                <label className="text-xs text-muted-foreground uppercase tracking-wider">Bio</label>
                <div className="text-white">{selectedProfile.bio || 'No bio'}</div>
              </div>
              <div className="col-span-2">
                <label className="text-xs text-muted-foreground uppercase tracking-wider">Skills</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedProfile.skills?.map((skill: string, i: number) => (
                    <span key={i} className="bg-primary/10 text-primary px-2 py-1 text-xs rounded">
                      {skill}
                    </span>
                  )) || <span className="text-muted-foreground">No skills listed</span>}
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-white/10 flex justify-end gap-4">
              <button 
                onClick={() => setSelectedProfile(null)}
                className="px-4 py-2 text-muted-foreground hover:text-white transition-colors"
              >
                Close
              </button>
              <button 
                onClick={() => toggleVerified(selectedProfile)}
                className={`px-4 py-2 font-bold uppercase tracking-wider transition-colors ${
                  selectedProfile.is_verified 
                    ? 'bg-destructive/10 text-destructive hover:bg-destructive/20'
                    : 'bg-green-500/10 text-green-500 hover:bg-green-500/20'
                }`}
              >
                {selectedProfile.is_verified ? 'Revoke Verification' : 'Verify Architect'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
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
