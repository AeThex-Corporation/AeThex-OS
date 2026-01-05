import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Building2, Check, Plus } from "lucide-react";
import { useLocation } from "wouter";

interface Organization {
  id: string;
  name: string;
  slug: string;
  userRole: string;
}

export function OrgSwitcher() {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const [currentOrgId, setCurrentOrgId] = useState<string | null>(null);

  // Fetch user's organizations
  const { data: orgsData } = useQuery({
    queryKey: ["/api/orgs"],
    queryFn: async () => {
      const res = await fetch("/api/orgs", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch organizations");
      return res.json();
    },
  });

  const organizations: Organization[] = orgsData?.organizations || [];

  // Set initial org from localStorage or first org
  useEffect(() => {
    const savedOrgId = localStorage.getItem("currentOrgId");
    if (savedOrgId && organizations.find(o => o.id === savedOrgId)) {
      setCurrentOrgId(savedOrgId);
    } else if (organizations.length > 0 && !currentOrgId) {
      setCurrentOrgId(organizations[0].id);
    }
  }, [organizations, currentOrgId]);

  // Save current org to localStorage when it changes
  useEffect(() => {
    if (currentOrgId) {
      localStorage.setItem("currentOrgId", currentOrgId);
    }
  }, [currentOrgId]);

  const handleSwitchOrg = (orgId: string) => {
    setCurrentOrgId(orgId);
    queryClient.invalidateQueries(); // Refresh all queries with new org context
  };

  const currentOrg = organizations.find(o => o.id === currentOrgId);

  if (organizations.length === 0) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Building2 className="h-4 w-4" />
          <span className="hidden sm:inline">{currentOrg?.name || "Select Org"}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>Organizations</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {organizations.map((org) => (
          <DropdownMenuItem
            key={org.id}
            onClick={() => handleSwitchOrg(org.id)}
            className="flex items-center justify-between cursor-pointer"
          >
            <div className="flex flex-col gap-0.5">
              <span className="font-medium">{org.name}</span>
              <span className="text-xs text-slate-400">{org.userRole}</span>
            </div>
            {currentOrgId === org.id && <Check className="h-4 w-4 text-cyan-400" />}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => navigate("/orgs")}
          className="cursor-pointer gap-2"
        >
          <Plus className="h-4 w-4" />
          <span>Create or manage organizations</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Hook to get current org ID for use in API calls
export function useCurrentOrgId(): string | null {
  const [orgId, setOrgId] = useState<string | null>(null);

  useEffect(() => {
    const savedOrgId = localStorage.getItem("currentOrgId");
    setOrgId(savedOrgId);

    // Listen for storage changes
    const handleStorage = () => {
      const newOrgId = localStorage.getItem("currentOrgId");
      setOrgId(newOrgId);
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  return orgId;
}

// Hook to add org header to API requests
export function useOrgHeaders() {
  const orgId = useCurrentOrgId();
  
  return orgId ? { "x-org-id": orgId } : {};
}

