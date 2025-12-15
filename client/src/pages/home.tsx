import { motion } from "framer-motion";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Shield, FileCode, Terminal as TerminalIcon, ChevronRight, BarChart3, Network, ExternalLink, Lock } from "lucide-react";
import gridBg from '@assets/generated_images/dark_subtle_digital_grid_texture.png';

export default function Home() {
  const { data: metrics } = useQuery({
    queryKey: ["metrics"],
    queryFn: async () => {
      const res = await fetch("/api/metrics");
      return res.json();
    },
  });

  return (
    <div className="min-h-screen bg-background text-foreground font-mono selection:bg-primary selection:text-background relative overflow-hidden">
      {/* Background Texture */}
      <div 
        className="absolute inset-0 opacity-20 pointer-events-none z-0"
        style={{ backgroundImage: `url(${gridBg})`, backgroundSize: 'cover' }}
      />
      
      {/* Navigation */}
      <nav className="relative z-20 flex justify-between items-center px-8 py-6 border-b border-white/5">
        <div className="text-xl font-display font-bold text-white uppercase tracking-widest">
          AeThex
        </div>
        <div className="flex items-center gap-6">
          <a 
            href="https://aethex.foundation" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-sm text-muted-foreground hover:text-white transition-colors flex items-center gap-1"
          >
            Foundation <ExternalLink className="w-3 h-3" />
          </a>
          <a 
            href="https://aethex.studio" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-sm text-muted-foreground hover:text-white transition-colors flex items-center gap-1"
          >
            Studio <ExternalLink className="w-3 h-3" />
          </a>
          <Link href="/login">
            <button className="text-sm bg-white/5 border border-white/10 px-4 py-2 text-white hover:bg-white/10 transition-colors flex items-center gap-2" data-testid="button-admin-login">
              <Lock className="w-3 h-3" /> Admin
            </button>
          </Link>
        </div>
      </nav>
      
      <div className="relative z-10 container mx-auto px-4 py-20 flex flex-col items-center justify-center">
        
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16 space-y-4"
        >
          <div className="inline-block border border-primary/30 px-3 py-1 text-xs text-primary tracking-widest uppercase mb-4 bg-primary/5">
            The Operating System for the Metaverse
          </div>
          <h1 className="text-6xl md:text-8xl font-display font-bold tracking-tighter uppercase text-white mb-2 text-glow">
            AeThex
          </h1>
          <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto font-tech">
            We train Architects. We build the Shield. We define the Law.
          </p>
        </motion.div>

        {/* Live Metrics */}
        {metrics && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16 w-full max-w-4xl"
          >
            <div className="text-center p-4 border border-white/5 bg-card/30">
              <div className="text-3xl font-display font-bold text-primary">{metrics.totalProfiles}</div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider">Architects</div>
            </div>
            <div className="text-center p-4 border border-white/5 bg-card/30">
              <div className="text-3xl font-display font-bold text-secondary">{metrics.totalProjects}</div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider">Projects</div>
            </div>
            <div className="text-center p-4 border border-white/5 bg-card/30">
              <div className="text-3xl font-display font-bold text-green-500">{metrics.onlineUsers}</div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider">Online Now</div>
            </div>
            <div className="text-center p-4 border border-white/5 bg-card/30">
              <div className="text-3xl font-display font-bold text-white">{metrics.totalXP?.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider">Total XP</div>
            </div>
          </motion.div>
        )}

        {/* The Trinity Cards */}
        <div className="grid md:grid-cols-3 gap-6 w-full max-w-6xl">
          
          {/* Axiom -> Pitch */}
          <Link href="/pitch">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="group relative border border-white/10 bg-card/50 p-8 hover:border-primary/50 transition-colors duration-300 cursor-pointer overflow-hidden h-full"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex justify-between items-start mb-6">
                <Shield className="w-12 h-12 text-muted-foreground group-hover:text-primary transition-colors" />
                <BarChart3 className="w-6 h-6 text-muted-foreground/30 group-hover:text-primary/50 transition-colors" />
              </div>
              <h2 className="text-2xl font-display text-white mb-4">Axiom</h2>
              <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                <span className="text-primary font-bold">The Law.</span> Our dual-entity protocol creates a self-sustaining ecosystem. The Foundation trains; the Corporation secures.
              </p>
              <div className="flex items-center text-primary hover:text-primary/80 text-sm font-bold uppercase tracking-wider mt-auto">
                View Investor Pitch <ChevronRight className="w-4 h-4 ml-1" />
              </div>
            </motion.div>
          </Link>

          {/* Codex -> Foundation */}
          <a href="https://aethex.foundation" target="_blank" rel="noopener noreferrer" className="block">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="group relative border border-white/10 bg-card/50 p-8 hover:border-secondary/50 transition-colors duration-300 cursor-pointer overflow-hidden h-full"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-secondary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex justify-between items-start mb-6">
                <FileCode className="w-12 h-12 text-muted-foreground group-hover:text-secondary transition-colors" />
                <Network className="w-6 h-6 text-muted-foreground/30 group-hover:text-secondary/50 transition-colors" />
              </div>
              <h2 className="text-2xl font-display text-white mb-4">Codex</h2>
              <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                <span className="text-secondary font-bold">The Standard.</span> Elite training through gamified curriculum. Certifications that employers trust. The Passport to the Metaverse.
              </p>
              <div className="flex items-center text-secondary hover:text-secondary/80 text-sm font-bold uppercase tracking-wider mt-auto">
                Enter Foundation <ExternalLink className="w-4 h-4 ml-1" />
              </div>
            </motion.div>
          </a>

          {/* Aegis -> Studio */}
          <a href="https://aethex.studio" target="_blank" rel="noopener noreferrer" className="block">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="group relative border border-white/10 bg-card/50 p-8 hover:border-destructive/50 transition-colors duration-300 cursor-pointer overflow-hidden h-full"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-destructive/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <TerminalIcon className="w-12 h-12 text-muted-foreground group-hover:text-destructive mb-6 transition-colors" />
              <h2 className="text-2xl font-display text-white mb-4">Aegis</h2>
              <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                <span className="text-destructive font-bold">The Shield.</span> Real-time security for the build environment. PII scrubbing. Threat intervention. Protection for every line of code.
              </p>
              <div className="flex items-center text-destructive hover:text-destructive/80 text-sm font-bold uppercase tracking-wider mt-auto">
                Launch Studio <ExternalLink className="w-4 h-4 ml-1" />
              </div>
            </motion.div>
          </a>

        </div>

        {/* Demo Links */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-16 flex flex-wrap justify-center gap-4"
        >
          <Link href="/passport">
            <button className="text-sm border border-white/10 px-6 py-3 text-muted-foreground hover:text-white hover:border-white/30 transition-colors">
              View Sample Passport
            </button>
          </Link>
          <Link href="/terminal">
            <button className="text-sm border border-white/10 px-6 py-3 text-muted-foreground hover:text-white hover:border-white/30 transition-colors">
              Try Terminal Demo
            </button>
          </Link>
          <Link href="/curriculum">
            <button className="text-sm border border-white/10 px-6 py-3 text-muted-foreground hover:text-white hover:border-white/30 transition-colors">
              Explore Tech Tree
            </button>
          </Link>
        </motion.div>

        {/* Footer */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-24 text-center text-xs text-muted-foreground/50 uppercase tracking-widest"
        >
          AeThex Foundry © 2025 // Building the Future of the Metaverse
        </motion.div>

      </div>
    </div>
  );
}
