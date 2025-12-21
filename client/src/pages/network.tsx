import { motion } from "framer-motion";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { 
  Terminal, Users, Cpu, Globe, ExternalLink, Shield, 
  ArrowLeft, Zap, Lock, Code, Sparkles
} from "lucide-react";

interface ApiArchitect {
  id: string;
  name: string;
  role: string;
  bio: string | null;
  level: number;
  xp: number;
  passportId: string | null;
  skills: string[] | null;
}

interface DisplayArchitect {
  id: string;
  index: number;
  name: string;
  role: string;
  slug?: string;
  isReserved?: boolean;
  isLive?: boolean;
}

interface Protocol {
  id: string;
  name: string;
  description: string;
  link?: string;
}

interface Domain {
  name: string;
  purpose: string;
}

const NUM_RESERVED_SLOTS = 10;

const PROTOCOLS: Protocol[] = [
  { 
    id: "aegis", 
    name: "AEGIS", 
    description: "Identity & Security Layer",
    link: "https://github.com"
  },
  { 
    id: "warden", 
    name: "WARDEN", 
    description: "Browser Security Extension",
    link: "https://chrome.google.com/webstore"
  },
  { 
    id: "lonestar", 
    name: "LONE STAR", 
    description: "Simulation Engine",
    link: "https://roblox.com"
  },
];

const DOMAINS: Domain[] = [
  { name: ".foundation", purpose: "Governance & Policy" },
  { name: ".studio", purpose: "Labs & Education" },
  { name: ".dev", purpose: "Developer Tools" },
  { name: ".network", purpose: "Public Directory" },
];

export default function Network() {
  const { data: metrics } = useQuery({
    queryKey: ["metrics"],
    queryFn: async () => {
      const res = await fetch("/api/metrics");
      return res.json();
    },
  });

  const { data: liveArchitects = [] } = useQuery<ApiArchitect[]>({
    queryKey: ["directory-architects"],
    queryFn: async () => {
      const res = await fetch("/api/directory/architects");
      if (!res.ok) return [];
      return res.json();
    },
  });

  // Combine live architects with reserved slots
  const displayArchitects: DisplayArchitect[] = [
    ...liveArchitects.map((a, index) => ({
      id: String(index + 1).padStart(3, "0"),
      index: index + 1,
      name: a.name,
      role: a.role || "Architect",
      slug: a.passportId || a.name.toLowerCase().replace(/\s+/g, '-'),
      isLive: true,
    })),
    ...Array.from({ length: Math.max(0, NUM_RESERVED_SLOTS - liveArchitects.length) }, (_, i) => ({
      id: String(liveArchitects.length + i + 1).padStart(3, "0"),
      index: liveArchitects.length + i + 1,
      name: "[RESERVED FOR FOUNDRY]",
      role: "Available Slot",
      isReserved: true,
    })),
  ];

  const activeNodes = liveArchitects.length;

  return (
    <div className="min-h-screen bg-black text-white font-mono selection:bg-cyan-500 selection:text-black">
      <div className="fixed inset-0 opacity-5 pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(0,255,255,0.03) 1px, rgba(0,255,255,0.03) 2px)`,
          backgroundSize: '100% 4px'
        }} />
      </div>

      <nav className="relative z-20 flex justify-between items-center px-6 py-4 border-b border-cyan-500/20">
        <Link href="/">
          <button className="flex items-center gap-2 text-cyan-500/60 hover:text-cyan-500 transition-colors" data-testid="link-back-home">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-xs uppercase tracking-wider">Back</span>
          </button>
        </Link>
        <div className="text-cyan-500 font-bold tracking-widest uppercase text-sm">
          AeThex.Network
        </div>
        <div className="text-cyan-500/40 text-xs">
          v1.0.0
        </div>
      </nav>

      <header className="relative z-10 border-b border-cyan-500/20 py-12 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-3">
              <Terminal className="w-8 h-8 text-cyan-500" />
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white uppercase">
                The Network
              </h1>
            </div>
            <p className="text-cyan-500/60 text-lg max-w-2xl">
              A directory of verified entities in the AeThex ecosystem.
            </p>
            <div className="flex items-center gap-6 pt-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-green-500 text-sm uppercase tracking-wider">
                  Nodes Detected: <span className="font-bold">{activeNodes}</span>
                </span>
              </div>
              <div className="text-cyan-500/40 text-sm">
                Last Sync: {new Date().toLocaleDateString()}
              </div>
            </div>
          </motion.div>
        </div>
      </header>

      <main className="relative z-10 max-w-4xl mx-auto px-6 py-12 space-y-16">

        <section>
          <div className="flex items-center gap-3 mb-6">
            <Users className="w-5 h-5 text-cyan-500" />
            <h2 className="text-xl font-bold uppercase tracking-wider text-white">
              The Architects
            </h2>
            <span className="text-cyan-500/40 text-sm">// Humans</span>
          </div>
          
          <div className="space-y-1">
            {displayArchitects.map((architect: DisplayArchitect, idx: number) => (
              <motion.div
                key={architect.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={`group flex items-center justify-between py-3 px-4 border-l-2 transition-all ${
                  architect.isReserved 
                    ? "border-yellow-500/30 bg-yellow-500/5 hover:bg-yellow-500/10" 
                    : "border-cyan-500/30 bg-cyan-500/5 hover:bg-cyan-500/10"
                }`}
                data-testid={`architect-row-${architect.id}`}
              >
                <div className="flex items-center gap-4">
                  <span className={`font-mono text-sm ${architect.isReserved ? "text-yellow-500/60" : "text-cyan-500/60"}`}>
                    [{architect.id}]
                  </span>
                  <div>
                    <span className={`font-bold ${architect.isReserved ? "text-yellow-500/80" : "text-white"}`}>
                      {architect.name}
                    </span>
                    <span className="text-cyan-500/40 text-sm ml-2">
                      — {architect.role}
                    </span>
                  </div>
                </div>
                
                {architect.isReserved ? (
                  <a 
                    href="https://aethex.studio" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-yellow-500 hover:text-yellow-400 transition-colors uppercase tracking-wider"
                    data-testid={`link-join-foundry-${architect.id}`}
                  >
                    Join Foundry <ExternalLink className="w-3 h-3" />
                  </a>
                ) : architect.isLive && architect.slug ? (
                  <Link href={`/network/${architect.slug}`}>
                    <span className="flex items-center gap-1 text-xs text-cyan-500/60 hover:text-cyan-500 transition-colors uppercase tracking-wider cursor-pointer">
                      View Profile <ArrowLeft className="w-3 h-3 rotate-180" />
                    </span>
                  </Link>
                ) : null}
              </motion.div>
            ))}
          </div>
        </section>

        <section>
          <div className="flex items-center gap-3 mb-6">
            <Cpu className="w-5 h-5 text-purple-500" />
            <h2 className="text-xl font-bold uppercase tracking-wider text-white">
              The Protocols
            </h2>
            <span className="text-purple-500/40 text-sm">// Technology</span>
          </div>
          
          <div className="grid gap-4">
            {PROTOCOLS.map((protocol, idx) => (
              <motion.a
                key={protocol.id}
                href={protocol.link}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="group flex items-center justify-between py-4 px-4 border-l-2 border-purple-500/30 bg-purple-500/5 hover:bg-purple-500/10 transition-all"
                data-testid={`protocol-row-${protocol.id}`}
              >
                <div className="flex items-center gap-4">
                  {protocol.id === "aegis" && <Shield className="w-5 h-5 text-purple-500" />}
                  {protocol.id === "warden" && <Lock className="w-5 h-5 text-purple-500" />}
                  {protocol.id === "lonestar" && <Sparkles className="w-5 h-5 text-purple-500" />}
                  <div>
                    <span className="font-bold text-white">{protocol.name}</span>
                    <span className="text-purple-500/60 text-sm ml-2">— {protocol.description}</span>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-purple-500/40 group-hover:text-purple-500 transition-colors" />
              </motion.a>
            ))}
          </div>
        </section>

        <section>
          <div className="flex items-center gap-3 mb-6">
            <Globe className="w-5 h-5 text-green-500" />
            <h2 className="text-xl font-bold uppercase tracking-wider text-white">
              The Domains
            </h2>
            <span className="text-green-500/40 text-sm">// Real Estate</span>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {DOMAINS.map((domain, idx) => (
              <motion.div
                key={domain.name}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="p-4 border border-green-500/20 bg-green-500/5 hover:bg-green-500/10 transition-all text-center"
                data-testid={`domain-card-${domain.name}`}
              >
                <div className="font-bold text-green-500 text-lg">{domain.name}</div>
                <div className="text-green-500/60 text-xs uppercase tracking-wider mt-1">{domain.purpose}</div>
              </motion.div>
            ))}
          </div>
        </section>

        <section className="border-t border-cyan-500/20 pt-12">
          <div className="text-center space-y-6">
            <div className="flex items-center justify-center gap-2">
              <Zap className="w-5 h-5 text-yellow-500" />
              <h3 className="text-lg font-bold uppercase tracking-wider text-white">
                Want Your Name on This List?
              </h3>
            </div>
            <p className="text-cyan-500/60 max-w-md mx-auto">
              Join The Foundry and become a verified Architect in the AeThex ecosystem.
              Your name gets hardcoded into the Network Genesis Block.
            </p>
            <a 
              href="https://aethex.studio" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-black px-8 py-3 font-bold uppercase tracking-wider hover:from-yellow-400 hover:to-orange-400 transition-all"
              data-testid="link-join-foundry-cta"
            >
              Join The Foundry <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </section>

      </main>

      <footer className="relative z-10 border-t border-cyan-500/10 py-8 px-6 text-center">
        <div className="text-cyan-500/30 text-xs uppercase tracking-wider">
          AeThex Network // The Public Square
        </div>
      </footer>
    </div>
  );
}
