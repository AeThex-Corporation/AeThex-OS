import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, Users, Settings, ArrowLeft, Crown, Shield, User, Eye } from "lucide-react";
import { useLocation } from "wouter";

interface Organization {
  id: string;
  name: string;
  slug: string;
  plan: string;
  owner_user_id: string;
  userRole: string;
  created_at: string;
}

interface Member {
  id: string;
  user_id: string;
  role: string;
  created_at: string;
  profiles: {
    username: string;
    full_name: string;
    avatar_url: string;
    email: string;
  };
}

export default function OrgSettingsPage() {
  const [, params] = useRoute("/orgs/:slug/settings");
  const [, navigate] = useLocation();
  const slug = params?.slug;

  // Fetch organization
  const { data: orgData, isLoading: orgLoading } = useQuery({
    queryKey: [`/api/orgs/${slug}`],
    queryFn: async () => {
      const res = await fetch(`/api/orgs/${slug}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch organization");
      return res.json();
    },
    enabled: !!slug,
  });

  const organization: Organization | undefined = orgData?.organization;

  // Fetch members
  const { data: membersData, isLoading: membersLoading } = useQuery({
    queryKey: [`/api/orgs/${slug}/members`],
    queryFn: async () => {
      const res = await fetch(`/api/orgs/${slug}/members`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch members");
      return res.json();
    },
    enabled: !!slug,
  });

  const members: Member[] = membersData?.members || [];

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner': return <Crown className="w-4 h-4 text-purple-400" />;
      case 'admin': return <Shield className="w-4 h-4 text-cyan-400" />;
      case 'member': return <User className="w-4 h-4 text-slate-400" />;
      case 'viewer': return <Eye className="w-4 h-4 text-slate-500" />;
      default: return null;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner': return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'admin': return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';
      case 'member': return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
      case 'viewer': return 'bg-slate-600/20 text-slate-400 border-slate-600/30';
      default: return 'bg-slate-700/20 text-slate-400 border-slate-700/30';
    }
  };

  if (orgLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 p-6 flex items-center justify-center">
        <div className="text-slate-400">Loading organization...</div>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 p-6 flex items-center justify-center">
        <div className="text-slate-400">Organization not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/orgs")}
            className="mb-4 gap-2 text-slate-400 hover:text-slate-300"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Organizations
          </Button>

          <div className="flex items-center gap-3">
            <Building2 className="w-8 h-8 text-cyan-400" />
            <div>
              <h1 className="text-3xl font-bold text-slate-50">{organization.name}</h1>
              <p className="text-slate-400">/{organization.slug}</p>
            </div>
            <span className={`ml-auto text-xs px-3 py-1.5 rounded border ${getRoleBadgeColor(organization.userRole)}`}>
              {organization.userRole}
            </span>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="bg-slate-800/50">
            <TabsTrigger value="general" className="gap-2">
              <Settings className="w-4 h-4" />
              General
            </TabsTrigger>
            <TabsTrigger value="members" className="gap-2">
              <Users className="w-4 h-4" />
              Members ({members.length})
            </TabsTrigger>
          </TabsList>

          {/* General Settings */}
          <TabsContent value="general">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-slate-50">Organization Settings</CardTitle>
                <CardDescription className="text-slate-400">
                  Manage your organization details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">Organization Name</Label>
                  <Input
                    value={organization.name}
                    disabled
                    className="bg-slate-900/50 border-slate-600 text-slate-300"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Slug</Label>
                  <Input
                    value={organization.slug}
                    disabled
                    className="bg-slate-900/50 border-slate-600 text-slate-300"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Plan</Label>
                  <Input
                    value={organization.plan}
                    disabled
                    className="bg-slate-900/50 border-slate-600 text-slate-300 capitalize"
                  />
                </div>
                <div className="pt-4 text-sm text-slate-400">
                  Note: Renaming and plan changes coming soon
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Members */}
          <TabsContent value="members">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-slate-50">Team Members</CardTitle>
                <CardDescription className="text-slate-400">
                  {members.length} {members.length === 1 ? 'member' : 'members'} in this organization
                </CardDescription>
              </CardHeader>
              <CardContent>
                {membersLoading ? (
                  <div className="text-center py-8 text-slate-400">
                    Loading members...
                  </div>
                ) : members.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">
                    No members found
                  </div>
                ) : (
                  <div className="space-y-3">
                    {members.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center gap-4 p-4 bg-slate-900/50 rounded-lg border border-slate-700/50"
                      >
                        {member.profiles.avatar_url ? (
                          <img
                            src={member.profiles.avatar_url}
                            alt={member.profiles.username}
                            className="w-10 h-10 rounded-full"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center">
                            <User className="w-5 h-5 text-slate-400" />
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="font-medium text-slate-200">
                            {member.profiles.full_name || member.profiles.username}
                          </div>
                          <div className="text-sm text-slate-400">
                            {member.profiles.email}
                          </div>
                        </div>
                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded border text-xs ${getRoleBadgeColor(member.role)}`}>
                          {getRoleIcon(member.role)}
                          <span className="capitalize">{member.role}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

