import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Github, Globe, MessageSquare, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth";

export default function OsLink() {
  const { user } = useAuth();
  const [linkedIdentities, setLinkedIdentities] = useState<
    Array<{ provider: string; external_id: string; verified_at: string }>
  >([]);
  const [loading, setLoading] = useState(false);

  const providers = [
    { name: "Roblox", id: "roblox", icon: Globe, color: "text-red-500" },
    { name: "Discord", id: "discord", icon: MessageSquare, color: "text-indigo-500" },
    { name: "GitHub", id: "github", icon: Github, color: "text-gray-300" },
  ];

  const handleLinkStart = async (provider: string) => {
    if (!user?.id) {
      alert("Please log in first");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/os/link/start", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-id": user.id },
        body: JSON.stringify({ provider }),
      });
      const { redirect_url } = await res.json();
      // In production, redirect to OAuth flow
      alert(`Would redirect to: ${redirect_url}`);
    } catch (error) {
      console.error("Link failed:", error);
      alert("Failed to start linking");
    } finally {
      setLoading(false);
    }
  };

  const handleUnlink = async (provider: string) => {
    if (!user?.id) return;

    try {
      await fetch("/api/os/link/unlink", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-id": user.id },
        body: JSON.stringify({ provider }),
      });
      setLinkedIdentities(linkedIdentities.filter((id) => id.provider !== provider));
    } catch (error) {
      console.error("Unlink failed:", error);
      alert("Failed to unlink identity");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-white mb-2">Identity Linking</h1>
          <p className="text-gray-300 text-lg">
            Link your accounts to get verified credentials across the AeThex ecosystem.
          </p>
          <p className="text-gray-400 text-sm mt-4">
            💡 <strong>What this means:</strong> Your proofs are portable. Link once, use everywhere.
          </p>
        </div>

        {/* Providers */}
        <div className="space-y-3 mb-12">
          <h2 className="text-xl font-semibold text-white mb-4">Available Platforms</h2>
          {providers.map((provider) => {
            const Icon = provider.icon;
            const isLinked = linkedIdentities.some((id) => id.provider === provider.id);

            return (
              <Card key={provider.id} className="bg-slate-800/50 border-slate-700 hover:border-slate-600 transition">
                <CardContent className="flex items-center justify-between p-5">
                  <div className="flex items-center gap-4">
                    <Icon className={`w-7 h-7 ${provider.color}`} />
                    <div>
                      <p className="font-semibold text-white">{provider.name}</p>
                      {isLinked && (
                        <p className="text-sm text-green-400">
                          ✓ Linked and verified
                        </p>
                      )}
                    </div>
                  </div>
                  <Button
                    onClick={() =>
                      isLinked ? handleUnlink(provider.id) : handleLinkStart(provider.id)
                    }
                    disabled={loading}
                    variant={isLinked ? "outline" : "default"}
                    className={isLinked ? "border-red-500 text-red-500 hover:bg-red-500/10" : ""}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Linking...
                      </>
                    ) : isLinked ? (
                      "Unlink"
                    ) : (
                      "Link"
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Info Cards */}
        <div className="grid md:grid-cols-2 gap-4">
          <Card className="bg-cyan-900/20 border-cyan-700/50">
            <CardHeader>
              <CardTitle className="text-cyan-400 text-lg flex items-center gap-2">
                <span>🔐</span> Your Privacy
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-gray-300">
              We never share your linked identities without your consent. Each platform only sees what you allow.
            </CardContent>
          </Card>

          <Card className="bg-green-900/20 border-green-700/50">
            <CardHeader>
              <CardTitle className="text-green-400 text-lg flex items-center gap-2">
                <span>✓</span> Verified Proofs
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-gray-300">
              When you link, we create cryptographically signed proofs of your achievements that you can share.
            </CardContent>
          </Card>

          <Card className="bg-purple-900/20 border-purple-700/50">
            <CardHeader>
              <CardTitle className="text-purple-400 text-lg flex items-center gap-2">
                <span>🔗</span> Portable
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-gray-300">
              Use your verified credentials across any platform that trusts AeThex, without creating new accounts.
            </CardContent>
          </Card>

          <Card className="bg-blue-900/20 border-blue-700/50">
            <CardHeader>
              <CardTitle className="text-blue-400 text-lg flex items-center gap-2">
                <span>🚪</span> Exit Path
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-gray-300">
              If AeThex disappears, your proofs remain valid and your linked accounts are still yours.
            </CardContent>
          </Card>
        </div>

        {/* How It Works */}
        <Card className="mt-8 bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">How It Works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-gray-300">
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-cyan-500 text-white flex items-center justify-center text-xs font-bold">1</div>
                <div>
                  <p className="font-semibold text-white">Link Your Account</p>
                  <p className="text-gray-400">Connect your Roblox, Discord, or GitHub account securely.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-cyan-500 text-white flex items-center justify-center text-xs font-bold">2</div>
                <div>
                  <p className="font-semibold text-white">Verify Ownership</p>
                  <p className="text-gray-400">We confirm you own the account (OAuth, challenge, etc).</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-cyan-500 text-white flex items-center justify-center text-xs font-bold">3</div>
                <div>
                  <p className="font-semibold text-white">Get Verified Proofs</p>
                  <p className="text-gray-400">Your achievements are signed and portable across platforms.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-cyan-500 text-white flex items-center justify-center text-xs font-bold">4</div>
                <div>
                  <p className="font-semibold text-white">Use Everywhere</p>
                  <p className="text-gray-400">Share your proofs with any platform that trusts AeThex OS.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-gray-400">
          <p>
            💡 <strong>OS attests; platforms decide.</strong>
          </p>
          <p className="mt-2">We verify your credentials. Other platforms decide what access to grant.</p>
        </div>
      </div>
    </div>
  );
}
