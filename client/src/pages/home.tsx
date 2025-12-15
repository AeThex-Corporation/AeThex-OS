import { motion } from "framer-motion";
import { Link } from "wouter";
import { Shield, FileCode, Terminal as TerminalIcon, ChevronRight, BarChart3, Network } from "lucide-react";
import gridBg from '@assets/generated_images/dark_subtle_digital_grid_texture.png';

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground font-mono selection:bg-primary selection:text-background relative overflow-hidden">
      {/* Background Texture */}
      <div 
        className="absolute inset-0 opacity-20 pointer-events-none z-0"
        style={{ backgroundImage: `url(${gridBg})`, backgroundSize: 'cover' }}
      />
      
      <div className="relative z-10 container mx-auto px-4 py-20 flex flex-col items-center justify-center min-h-screen">
        
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16 space-y-4"
        >
          <div className="inline-block border border-primary/30 px-3 py-1 text-xs text-primary tracking-widest uppercase mb-4 bg-primary/5">
            System Online: v4.2
          </div>
          <h1 className="text-6xl md:text-8xl font-display font-bold tracking-tighter uppercase text-white mb-2 text-glow">
            AeThex
          </h1>
          <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto font-tech">
            The Operating System for the Metaverse.
          </p>
        </motion.div>

        {/* The Trinity Cards */}
        <div className="grid md:grid-cols-3 gap-6 w-full max-w-6xl">
          
          {/* Axiom -> Dashboard */}
          <Link href="/dashboard">
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
                The Foundation. View the global command center, active architect metrics, and ecosystem health.
              </p>
              <div className="flex items-center text-primary hover:text-primary/80 text-sm font-bold uppercase tracking-wider mt-auto">
                Open Dashboard <ChevronRight className="w-4 h-4 ml-1" />
              </div>
            </motion.div>
          </Link>

          {/* Codex -> Curriculum (with Passport link inside) */}
          <Link href="/curriculum">
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
                The Standard. Explore the skill tree, mastery nodes, and view your Architect Credential.
              </p>
              <div className="flex items-center text-secondary hover:text-secondary/80 text-sm font-bold uppercase tracking-wider mt-auto">
                View Tech Tree <ChevronRight className="w-4 h-4 ml-1" />
              </div>
            </motion.div>
          </Link>

          {/* Aegis -> Terminal */}
          <Link href="/terminal">
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
                The Shield. Enter the secure build environment. <span className="text-destructive font-bold">New:</span> Live Threat Simulation available.
              </p>
              <div className="flex items-center text-destructive hover:text-destructive/80 text-sm font-bold uppercase tracking-wider mt-auto">
                Launch Terminal <ChevronRight className="w-4 h-4 ml-1" />
              </div>
            </motion.div>
          </Link>

        </div>

        {/* Footer */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-24 text-center text-xs text-muted-foreground/50 uppercase tracking-widest"
        >
          AeThex Foundry © 2025 // Authorized Personnel Only
        </motion.div>

      </div>
    </div>
  );
}
