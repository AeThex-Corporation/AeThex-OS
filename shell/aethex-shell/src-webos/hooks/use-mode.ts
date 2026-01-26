import { useAuth } from "@/lib/auth";
import { useEffect, useState } from "react";
import { Mode, Realm } from "@/shared/app-registry";

export function useMode() {
  const { user } = useAuth();
  const [mode, setModeState] = useState<Mode>(Mode.Web);
  const [realm, setRealm] = useState<Realm>(Realm.Foundation);
  const [enforcedRealm, setEnforcedRealm] = useState<Realm | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchModeAndPolicy = async () => {
      try {
        // Fetch user preference
        const prefRes = await fetch(`/api/user/mode-preference`);
        const prefData = await prefRes.json();

        // Fetch workspace policy (if exists)
        const policyRes = await fetch(`/api/workspace/policy`);
        const policyData = await policyRes.json();

        if (policyData?.enforced_realm) {
          // Workspace enforces a realm
          setRealm(policyData.enforced_realm as Realm);
          setModeState(policyData.enforced_realm as Mode);
          setEnforcedRealm(policyData.enforced_realm as Realm);
        } else if (prefData?.mode) {
          // User preference
          setModeState(prefData.mode as Mode);
          setRealm(prefData.mode as Realm); // Mode = Realm for now
        }
      } catch (error) {
        console.error("Failed to fetch mode/policy:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchModeAndPolicy();
  }, [user?.id]);

  const updateMode = async (newMode: Mode) => {
    if (!user) return;
    if (enforcedRealm) {
      console.warn("Cannot change mode: realm is enforced by workspace policy");
      return;
    }

    setModeState(newMode);
    setRealm(newMode as unknown as Realm);

    try {
      await fetch(`/api/user/mode-preference`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: newMode }),
      });
    } catch (error) {
      console.error("Failed to update mode:", error);
    }
  };

  return {
    mode,
    realm,
    setMode: updateMode,
    canSwitchMode: !enforcedRealm,
    loading,
  };
}
