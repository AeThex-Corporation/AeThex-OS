import { motion } from "framer-motion";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Shield, FileCode, Terminal, ChevronRight, Building, GraduationCap, Users, Activity } from "lucide-react";
import gridBg from '@assets/generated_images/dark_subtle_digital_grid_texture.png';

export default function Pitch() {
  const { data: metrics } = useQuery({
    queryKey: ["metrics"],
    queryFn: async () => {
      const res = await fetch("/api/metrics");
      return res.json();
    },
  });

  return (
    <div className="min-h-screen bg-background text-foreground font-mono relative overflow-hidden">
      <div 
        className="absolute inset-0 opacity-10 pointer-events-none z-0"
        style={{ backgroundImage: `url(${gridBg})`, backgroundSize: 'cover' }}
      />

      <div className="relative z-10 container mx-auto px-4 py-12 max-w-5xl">
        
        <Link href="/">
          <button className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 uppercase text-xs tracking-widest mb-12">
            <ArrowLeft className="w-4 h-4" /> Return Home
          </button>
        </Link>

        {/* Title */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <div className="inline-block border border-primary/30 px-3 py-1 text-xs text-primary tracking-widest uppercase mb-6 bg-primary/5">
            The Axiom Protocol
          </div>
          <h1 className="text-4xl md:text-6xl font-display font-bold text-white uppercase tracking-tight mb-4">
            Investor Brief
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            AeThex is a self-sustaining ecosystem built on a dual-entity model that transforms raw talent into certified Metaverse Architects.
          </p>
        </motion.div>

        {/* The Dual Entity Model */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="grid md:grid-cols-2 gap-8 mb-20"
        >
          {/* Foundation */}
          <div className="bg-card/50 border border-secondary/30 p-8 relative overflow-hidden group hover:border-secondary/50 transition-colors">
            <div className="absolute top-0 left-0 w-full h-1 bg-secondary/50" />
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-secondary" />
              </div>
              <div>
                <div className="text-xs text-secondary uppercase tracking-widest font-bold">Non-Profit</div>
                <h3 className="text-xl font-display text-white uppercase">The Foundation</h3>
              </div>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed mb-6">
              Uses <span className="text-secondary font-bold">The Codex</span> to train elite Architects. 
              Gamified curriculum, verified certifications, and a clear path from beginner to master.
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <FileCode className="w-4 h-4 text-secondary" />
                Codex Standard Certification
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="w-4 h-4 text-secondary" />
                {metrics?.totalProfiles || 0} Active Architects
              </div>
            </div>
          </div>

          {/* Corporation */}
          <div className="bg-card/50 border border-primary/30 p-8 relative overflow-hidden group hover:border-primary/50 transition-colors">
            <div className="absolute top-0 left-0 w-full h-1 bg-primary/50" />
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <Building className="w-6 h-6 text-primary" />
              </div>
              <div>
                <div className="text-xs text-primary uppercase tracking-widest font-bold">For-Profit</div>
                <h3 className="text-xl font-display text-white uppercase">The Corporation</h3>
              </div>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed mb-6">
              Builds <span className="text-primary font-bold">The Aegis</span> to secure the Metaverse. 
              Enterprise security layer, PII scrubbing, threat intervention—sold to platforms and publishers.
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Shield className="w-4 h-4 text-primary" />
                Real-time Security Layer
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Activity className="w-4 h-4 text-primary" />
                {metrics?.totalProjects || 0} Protected Projects
              </div>
            </div>
          </div>
        </motion.div>

        {/* The Holy Trinity */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mb-20"
        >
          <h2 className="text-center text-sm font-bold text-muted-foreground uppercase tracking-widest mb-8">
            The Holy Trinity
          </h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center p-6 border border-white/10 bg-card/30">
              <Shield className="w-10 h-10 text-primary mx-auto mb-4" />
              <h3 className="font-display text-white uppercase mb-2">Axiom</h3>
              <p className="text-xs text-muted-foreground">The Law. The foundational protocol governing the ecosystem.</p>
            </div>
            <div className="text-center p-6 border border-white/10 bg-card/30">
              <FileCode className="w-10 h-10 text-secondary mx-auto mb-4" />
              <h3 className="font-display text-white uppercase mb-2">Codex</h3>
              <p className="text-xs text-muted-foreground">The Standard. Certification that proves mastery.</p>
            </div>
            <div className="text-center p-6 border border-white/10 bg-card/30">
              <Terminal className="w-10 h-10 text-destructive mx-auto mb-4" />
              <h3 className="font-display text-white uppercase mb-2">Aegis</h3>
              <p className="text-xs text-muted-foreground">The Shield. Real-time protection for builders.</p>
            </div>
          </div>
        </motion.div>

        {/* The Pitch Quote */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-primary/5 border border-primary/30 p-10 mb-20"
        >
          <blockquote className="text-xl md:text-2xl text-white leading-relaxed font-display italic">
            "We take raw talent, train them on our laws, and arm them with our weapons. 
            <span className="text-primary"> The Foundation creates the workforce; The Corporation sells the security.</span>"
          </blockquote>
        </motion.div>

        {/* Live Metrics */}
        {metrics && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mb-20"
          >
            <h2 className="text-center text-sm font-bold text-muted-foreground uppercase tracking-widest mb-8">
              Live Ecosystem Metrics
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center p-6 border border-white/10 bg-card/30">
                <div className="text-4xl font-display font-bold text-primary">{metrics.totalProfiles}</div>
                <div className="text-xs text-muted-foreground uppercase mt-2">Architects</div>
              </div>
              <div className="text-center p-6 border border-white/10 bg-card/30">
                <div className="text-4xl font-display font-bold text-secondary">{metrics.totalProjects}</div>
                <div className="text-xs text-muted-foreground uppercase mt-2">Projects</div>
              </div>
              <div className="text-center p-6 border border-white/10 bg-card/30">
                <div className="text-4xl font-display font-bold text-white">{metrics.totalXP?.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground uppercase mt-2">Total XP</div>
              </div>
              <div className="text-center p-6 border border-white/10 bg-card/30">
                <div className="text-4xl font-display font-bold text-green-500">{metrics.onlineUsers}</div>
                <div className="text-xs text-muted-foreground uppercase mt-2">Online Now</div>
              </div>
            </div>
          </motion.div>
        )}

        {/* CTA */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center"
        >
          <p className="text-muted-foreground mb-6">
            Ready to learn more about investment opportunities?
          </p>
          <a 
            href="mailto:invest@aethex.dev" 
            className="inline-block bg-primary text-background px-8 py-4 font-bold uppercase tracking-wider hover:bg-primary/90 transition-colors"
          >
            Contact Our Team
          </a>
        </motion.div>

      </div>
    </div>
  );
}
