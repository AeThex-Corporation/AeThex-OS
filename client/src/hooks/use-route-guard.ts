import { useEffect } from "react";
import { useLocation } from "wouter";
import { useMode } from "./use-mode";
import { canAccessRoute } from "@/shared/app-registry";
import { useToast } from "./use-toast";

export function useRouteGuard() {
  const [location, setLocation] = useLocation();
  const { mode, realm, loading } = useMode();
  const { toast } = useToast();

  useEffect(() => {
    if (loading || !realm || !mode) return;

    const canAccess = canAccessRoute(location, realm, mode);

    if (!canAccess) {
      toast({
        title: "Access Denied",
        description: `This feature requires ${realm === "foundation" ? "Corporation" : "Foundation"} realm`,
        variant: "destructive",
      });
      setLocation("/");
    }
  }, [location, realm, mode, loading]);
}
