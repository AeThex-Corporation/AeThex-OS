import { useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { 
  Shield, FileCode, Terminal as TerminalIcon, ChevronRight, BarChart3, Network, 
  ExternalLink, Lock, Zap, Users, Globe, CheckCircle, ArrowRight, Star,
  Award, Cpu, Building, Sparkles, Monitor
} from "lucide-react";
import gridBg from '@assets/generated_images/dark_subtle_digital_grid_texture.png';
import { useTutorial, homeTutorialSteps, TutorialButton } from "@/components/Tutorial";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function Home() {
  const { startTutorial, hasCompletedTutorial, isActive } = useTutorial();
  
  const { data: metrics } = useQuery({
    queryKey: ["metrics"],
    queryFn: async () => {
      const res = await fetch("/api/metrics");
      return res.json();
    },
  });

  return (
    <div className="min-h-screen bg-background text-foreground font-mono selection:bg-primary selection:text-background relative overflow-hidden">
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
            className="text-sm text-muted-foreground hover:text-white transition-colors flex items-center gap-1 hidden md:flex"
          >
            Foundation <ExternalLink className="w-3 h-3" />
          </a>
          <a 
            href="https://aethex.studio" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-sm text-muted-foreground hover:text-white transition-colors flex items-center gap-1 hidden md:flex"
          >
            Studio <ExternalLink className="w-3 h-3" />
          </a>
          <Link href="/pitch">
            <button className="text-sm text-muted-foreground hover:text-primary transition-colors" data-testid="button-investors">
              Investors
            </button>
          </Link>
          <Link href="/login">
            <button className="text-sm bg-primary/10 border border-primary/30 px-4 py-2 text-primary hover:bg-primary/20 transition-colors flex items-center gap-2" data-testid="button-admin-login">
              <Lock className="w-3 h-3" /> Admin
            </button>
          </Link>
          <ThemeToggle />
        </div>
      </nav>
      
      <div className="relative z-10">
        
        {/* Hero Section */}
        <div className="container mx-auto px-4 py-20 flex flex-col items-center justify-center">
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
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
              <Link href="/os">
                <button className="bg-gradient-to-r from-cyan-500 to-purple-600 text-white px-8 py-4 font-bold uppercase tracking-wider hover:from-cyan-400 hover:to-purple-500 transition-all flex items-center gap-2 shadow-lg shadow-cyan-500/30" data-testid="button-launch-os">
                  Launch AeThex OS <Monitor className="w-4 h-4" />
                </button>
              </Link>
              <Link href="/pitch">
                <button className="bg-primary text-background px-8 py-4 font-bold uppercase tracking-wider hover:bg-primary/90 transition-colors flex items-center gap-2" data-testid="button-learn-more">
                  Learn More <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
              <Link href="/network">
                <button className="border border-cyan-500/30 text-cyan-500 px-8 py-4 font-bold uppercase tracking-wider hover:bg-cyan-500/10 transition-colors flex items-center gap-2" data-testid="button-view-network">
                  View The Network <Network className="w-4 h-4" />
                </button>
              </Link>
            </div>
          </motion.div>

          {/* Live Metrics */}
          {metrics && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16 w-full max-w-4xl"
              data-tutorial="metrics-section"
            >
              <div className="text-center p-4 border border-white/5 bg-card/30 hover:border-primary/30 transition-colors">
                <div className="text-3xl font-display font-bold text-primary">{metrics.totalProfiles}</div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider">Architects</div>
              </div>
              <div className="text-center p-4 border border-white/5 bg-card/30 hover:border-secondary/30 transition-colors">
                <div className="text-3xl font-display font-bold text-secondary">{metrics.totalProjects}</div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider">Projects</div>
              </div>
              <div className="text-center p-4 border border-white/5 bg-card/30 hover:border-green-500/30 transition-colors">
                <div className="text-3xl font-display font-bold text-green-500">{metrics.onlineUsers}</div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider">Online Now</div>
              </div>
              <div className="text-center p-4 border border-white/5 bg-card/30 hover:border-white/30 transition-colors">
                <div className="text-3xl font-display font-bold text-white">{metrics.totalXP?.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider">Total XP</div>
              </div>
            </motion.div>
          )}
        </div>

        {/* The Trinity Cards */}
        <div className="container mx-auto px-4 pb-20">
          <div className="grid md:grid-cols-3 gap-6 w-full max-w-6xl mx-auto">
            
            <Link href="/pitch">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="group relative border border-white/10 bg-card/50 p-8 hover:border-primary/50 transition-colors duration-300 cursor-pointer overflow-hidden h-full"
                data-tutorial="axiom-card"
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

            <a href="https://aethex.foundation" target="_blank" rel="noopener noreferrer" className="block">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="group relative border border-white/10 bg-card/50 p-8 hover:border-secondary/50 transition-colors duration-300 cursor-pointer overflow-hidden h-full"
                data-tutorial="codex-card"
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

            <a href="https://aethex.studio" target="_blank" rel="noopener noreferrer" className="block" data-tutorial="aegis-card">
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
        </div>

        {/* Features Section */}
        <div className="border-y border-white/5 bg-card/20 py-20">
          <div className="container mx-auto px-4">
            <motion.div 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-4">Why AeThex</h2>
              <p className="text-3xl font-display text-white uppercase">Built for the Future</p>
            </motion.div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-display text-white uppercase mb-2">Real-Time Protection</h3>
                <p className="text-xs text-muted-foreground">Aegis monitors every interaction, scrubbing PII and blocking threats before they reach users.</p>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="text-center"
              >
                <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Award className="w-8 h-8 text-secondary" />
                </div>
                <h3 className="font-display text-white uppercase mb-2">Verified Credentials</h3>
                <p className="text-xs text-muted-foreground">Codex certifications are blockchain-verifiable and recognized across the industry.</p>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="text-center"
              >
                <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Globe className="w-8 h-8 text-blue-500" />
                </div>
                <h3 className="font-display text-white uppercase mb-2">Platform Agnostic</h3>
                <p className="text-xs text-muted-foreground">Works with any engine, any platform, any virtual world. One standard for all.</p>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="text-center"
              >
                <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-green-500" />
                </div>
                <h3 className="font-display text-white uppercase mb-2">Elite Community</h3>
                <p className="text-xs text-muted-foreground">Join a network of certified Metaverse Architects building the future together.</p>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Dual Entity Highlight */}
        <div className="py-20">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto items-center">
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <div className="text-xs text-secondary uppercase tracking-widest font-bold mb-2">Non-Profit Arm</div>
                <h2 className="text-3xl font-display text-white uppercase mb-4">The Foundation</h2>
                <p className="text-muted-foreground mb-6">
                  We believe the Metaverse should be built by trained professionals. The Foundation provides free education, 
                  gamified learning paths, and verifiable certifications to anyone with the drive to become an Architect.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-center gap-3 text-sm text-muted-foreground">
                    <CheckCircle className="w-4 h-4 text-secondary" /> Free curriculum access
                  </li>
                  <li className="flex items-center gap-3 text-sm text-muted-foreground">
                    <CheckCircle className="w-4 h-4 text-secondary" /> XP-based progression
                  </li>
                  <li className="flex items-center gap-3 text-sm text-muted-foreground">
                    <CheckCircle className="w-4 h-4 text-secondary" /> Industry-recognized certifications
                  </li>
                </ul>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <div className="text-xs text-primary uppercase tracking-widest font-bold mb-2">For-Profit Arm</div>
                <h2 className="text-3xl font-display text-white uppercase mb-4">The Corporation</h2>
                <p className="text-muted-foreground mb-6">
                  Security shouldn't be an afterthought. The Corporation builds Aegis - the enterprise security layer 
                  that protects builders and users alike. Real-time threat detection, PII scrubbing, and intervention systems.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-center gap-3 text-sm text-muted-foreground">
                    <CheckCircle className="w-4 h-4 text-primary" /> Enterprise licensing
                  </li>
                  <li className="flex items-center gap-3 text-sm text-muted-foreground">
                    <CheckCircle className="w-4 h-4 text-primary" /> 24/7 threat monitoring
                  </li>
                  <li className="flex items-center gap-3 text-sm text-muted-foreground">
                    <CheckCircle className="w-4 h-4 text-primary" /> API integration
                  </li>
                </ul>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Demo Links */}
        <div className="border-t border-white/5 py-20">
          <div className="container mx-auto px-4">
            <motion.div 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-4">Explore</h2>
              <p className="text-2xl font-display text-white uppercase">See It In Action</p>
            </motion.div>
            
            <div className="flex flex-wrap justify-center gap-4" data-tutorial="demo-section">
              <Link href="/passport">
                <button className="text-sm border border-white/10 px-6 py-3 text-muted-foreground hover:text-white hover:border-white/30 transition-colors" data-testid="button-sample-passport">
                  View Sample Passport
                </button>
              </Link>
              <Link href="/terminal">
                <button className="text-sm border border-white/10 px-6 py-3 text-muted-foreground hover:text-white hover:border-white/30 transition-colors" data-testid="button-terminal-demo">
                  Try Terminal Demo
                </button>
              </Link>
              <Link href="/curriculum">
                <button className="text-sm border border-white/10 px-6 py-3 text-muted-foreground hover:text-white hover:border-white/30 transition-colors" data-testid="button-tech-tree">
                  Explore Tech Tree
                </button>
              </Link>
              <Link href="/pitch">
                <button className="text-sm border border-primary/30 px-6 py-3 text-primary hover:bg-primary/10 transition-colors" data-testid="button-investor-deck">
                  Investor Deck
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-white/5 py-12">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="text-xl font-display font-bold text-white uppercase tracking-widest">
                AeThex
              </div>
              <div className="flex items-center gap-8 text-xs text-muted-foreground">
                <a href="https://aethex.foundation" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Foundation</a>
                <a href="https://aethex.studio" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Studio</a>
                <Link href="/pitch"><span className="hover:text-white transition-colors cursor-pointer">Investors</span></Link>
                <Link href="/login"><span className="hover:text-white transition-colors cursor-pointer">Admin</span></Link>
              </div>
              <div className="text-xs text-muted-foreground/50 uppercase tracking-widest">
                © 2025 AeThex Foundry
              </div>
            </div>
          </div>
        </div>

      </div>
      
      {/* Tutorial Button */}
      {!isActive && (
        <TutorialButton onClick={() => startTutorial(homeTutorialSteps)} />
      )}
    </div>
  );
}
