import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Building2, Plus, Settings, Users } from "lucide-react";
import { useLocation } from "wouter";

interface Organization {
  id: string;
  name: string;
  slug: string;
  plan: string;
  userRole: string;
  created_at: string;
}

export default function OrgsPage() {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newOrgName, setNewOrgName] = useState("");
  const [newOrgSlug, setNewOrgSlug] = useState("");

  // Fetch organizations
  const { data: orgsData, isLoading } = useQuery({
    queryKey: ["/api/orgs"],
    queryFn: async () => {
      const res = await fetch("/api/orgs", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch organizations");
      return res.json();
    },
  });

  const organizations: Organization[] = orgsData?.organizations || [];

  // Create organization mutation
  const createOrgMutation = useMutation({
    mutationFn: async (data: { name: string; slug: string }) => {
      const res = await fetch("/api/orgs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create organization");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orgs"] });
      setIsCreateOpen(false);
      setNewOrgName("");
      setNewOrgSlug("");
    },
  });

  // Auto-generate slug from name
  const handleNameChange = (name: string) => {
    setNewOrgName(name);
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    setNewOrgSlug(slug);
  };

  const handleCreateOrg = () => {
    if (!newOrgName.trim() || !newOrgSlug.trim()) return;
    createOrgMutation.mutate({ name: newOrgName, slug: newOrgSlug });
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner': return 'bg-purple-500/20 text-purple-300';
      case 'admin': return 'bg-cyan-500/20 text-cyan-300';
      case 'member': return 'bg-slate-500/20 text-slate-300';
      default: return 'bg-slate-600/20 text-slate-400';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-50 flex items-center gap-3">
              <Building2 className="w-8 h-8 text-cyan-400" />
              Organizations
            </h1>
            <p className="text-slate-400 mt-2">
              Manage your workspaces and teams
            </p>
          </div>

          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Create Organization
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Organization</DialogTitle>
                <DialogDescription>
                  Create a workspace to collaborate with your team
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Organization Name</Label>
                  <Input
                    id="name"
                    placeholder="Acme Inc"
                    value={newOrgName}
                    onChange={(e) => handleNameChange(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">Slug (URL)</Label>
                  <Input
                    id="slug"
                    placeholder="acme-inc"
                    value={newOrgSlug}
                    onChange={(e) => setNewOrgSlug(e.target.value)}
                  />
                  <p className="text-xs text-slate-400">
                    This will be used in your organization's URL
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsCreateOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateOrg}
                  disabled={!newOrgName.trim() || !newOrgSlug.trim() || createOrgMutation.isPending}
                >
                  {createOrgMutation.isPending ? "Creating..." : "Create"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Organizations Grid */}
        {isLoading ? (
          <div className="text-center py-12 text-slate-400">
            Loading organizations...
          </div>
        ) : organizations.length === 0 ? (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="py-12 text-center">
              <Building2 className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-300 mb-2">
                No organizations yet
              </h3>
              <p className="text-slate-400 mb-4">
                Create your first organization to get started
              </p>
              <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                Create Organization
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {organizations.map((org) => (
              <Card
                key={org.id}
                className="bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-colors cursor-pointer"
                onClick={() => navigate(`/orgs/${org.slug}/settings`)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-slate-50 flex items-center gap-2 mb-1">
                        <Building2 className="w-5 h-5 text-cyan-400" />
                        {org.name}
                      </CardTitle>
                      <CardDescription className="text-slate-400">
                        /{org.slug}
                      </CardDescription>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${getRoleBadgeColor(org.userRole)}`}>
                      {org.userRole}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-slate-400">
                    <span className="capitalize">{org.plan} plan</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/orgs/${org.slug}/settings`);
                      }}
                      className="ml-auto gap-1.5"
                    >
                      <Settings className="w-4 h-4" />
                      Settings
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {createOrgMutation.error && (
          <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded text-red-400 text-sm">
            {createOrgMutation.error.message}
          </div>
        )}
      </div>
    </div>
  );
}

