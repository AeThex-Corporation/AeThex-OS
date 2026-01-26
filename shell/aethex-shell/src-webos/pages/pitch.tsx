import { motion } from "framer-motion";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Shield, FileCode, Terminal, ChevronRight, Building, GraduationCap, Users, Activity, TrendingUp, Target, Zap, Globe, DollarSign, CheckCircle } from "lucide-react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import gridBg from '@assets/generated_images/dark_subtle_digital_grid_texture.png';

const growthData = [
  { month: 'Jan', architects: 12, projects: 3 },
  { month: 'Feb', architects: 28, projects: 7 },
  { month: 'Mar', architects: 45, projects: 12 },
  { month: 'Apr', architects: 67, projects: 18 },
  { month: 'May', architects: 89, projects: 24 },
  { month: 'Jun', architects: 120, projects: 31 },
];

const revenueStreams = [
  { name: 'Aegis Licenses', value: 45 },
  { name: 'Enterprise Support', value: 25 },
  { name: 'Certification Fees', value: 20 },
  { name: 'API Access', value: 10 },
];

const COLORS = ['#eab308', '#22c55e', '#3b82f6', '#8b5cf6'];

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

      <div className="relative z-10 container mx-auto px-4 py-12 max-w-6xl">
        
        <Link href="/">
          <button className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 uppercase text-xs tracking-widest mb-12" data-testid="button-return-home">
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

        {/* Growth Charts */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="mb-20"
        >
          <h2 className="text-center text-sm font-bold text-muted-foreground uppercase tracking-widest mb-8">
            <TrendingUp className="w-4 h-4 inline mr-2" />
            Growth Trajectory
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-card/50 border border-white/10 p-6">
              <h3 className="text-xs text-muted-foreground uppercase tracking-widest mb-4">Architect Enrollment</h3>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={growthData}>
                  <defs>
                    <linearGradient id="colorArchitects" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="month" stroke="#666" fontSize={10} />
                  <YAxis stroke="#666" fontSize={10} />
                  <Tooltip 
                    contentStyle={{ background: '#1a1a1a', border: '1px solid #333' }}
                    labelStyle={{ color: '#fff' }}
                  />
                  <Area type="monotone" dataKey="architects" stroke="#22c55e" fillOpacity={1} fill="url(#colorArchitects)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            
            <div className="bg-card/50 border border-white/10 p-6">
              <h3 className="text-xs text-muted-foreground uppercase tracking-widest mb-4">Protected Projects</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={growthData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="month" stroke="#666" fontSize={10} />
                  <YAxis stroke="#666" fontSize={10} />
                  <Tooltip 
                    contentStyle={{ background: '#1a1a1a', border: '1px solid #333' }}
                    labelStyle={{ color: '#fff' }}
                  />
                  <Bar dataKey="projects" fill="#eab308" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </motion.div>

        {/* Revenue Model */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mb-20"
        >
          <h2 className="text-center text-sm font-bold text-muted-foreground uppercase tracking-widest mb-8">
            <DollarSign className="w-4 h-4 inline mr-2" />
            Revenue Model
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="bg-card/50 border border-white/10 p-6">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={revenueStreams}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {revenueStreams.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ background: '#1a1a1a', border: '1px solid #333' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="space-y-4">
              {revenueStreams.map((stream, i) => (
                <div key={stream.name} className="flex items-center gap-4 p-4 bg-card/30 border border-white/5">
                  <div className="w-3 h-3 rounded-full" style={{ background: COLORS[i] }} />
                  <div className="flex-1">
                    <div className="text-white font-bold">{stream.name}</div>
                    <div className="text-xs text-muted-foreground">{stream.value}% of projected revenue</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* The Pitch Quote */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45 }}
          className="bg-primary/5 border border-primary/30 p-10 mb-20"
        >
          <blockquote className="text-xl md:text-2xl text-white leading-relaxed font-display italic">
            "We take raw talent, train them on our laws, and arm them with our weapons. 
            <span className="text-primary"> The Foundation creates the workforce; The Corporation sells the security.</span>"
          </blockquote>
        </motion.div>

        {/* Why Invest */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mb-20"
        >
          <h2 className="text-center text-sm font-bold text-muted-foreground uppercase tracking-widest mb-8">
            <Target className="w-4 h-4 inline mr-2" />
            Why Invest
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 border border-white/10 bg-card/30">
              <Zap className="w-8 h-8 text-primary mb-4" />
              <h3 className="font-display text-white uppercase mb-2 text-sm">First Mover</h3>
              <p className="text-xs text-muted-foreground">Building the security standard before the Metaverse matures.</p>
            </div>
            <div className="p-6 border border-white/10 bg-card/30">
              <Users className="w-8 h-8 text-secondary mb-4" />
              <h3 className="font-display text-white uppercase mb-2 text-sm">Talent Pipeline</h3>
              <p className="text-xs text-muted-foreground">Self-sustaining workforce trained on proprietary methods.</p>
            </div>
            <div className="p-6 border border-white/10 bg-card/30">
              <Globe className="w-8 h-8 text-blue-500 mb-4" />
              <h3 className="font-display text-white uppercase mb-2 text-sm">Platform Agnostic</h3>
              <p className="text-xs text-muted-foreground">Works across any metaverse, game engine, or virtual world.</p>
            </div>
            <div className="p-6 border border-white/10 bg-card/30">
              <Shield className="w-8 h-8 text-destructive mb-4" />
              <h3 className="font-display text-white uppercase mb-2 text-sm">B2B Revenue</h3>
              <p className="text-xs text-muted-foreground">Enterprise licensing model with recurring revenue.</p>
            </div>
          </div>
        </motion.div>

        {/* Live Metrics */}
        {metrics && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.55 }}
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
                <div className="text-4xl font-display font-bold text-green-500">{metrics.verifiedUsers}</div>
                <div className="text-xs text-muted-foreground uppercase mt-2">Verified</div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Team Section */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mb-20"
        >
          <h2 className="text-center text-sm font-bold text-muted-foreground uppercase tracking-widest mb-8">
            Leadership Team
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6 border border-white/10 bg-card/30">
              <div className="w-20 h-20 bg-primary/20 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl font-display text-primary">MP</span>
              </div>
              <h3 className="font-display text-white uppercase mb-1">MrPigLr</h3>
              <div className="text-xs text-primary uppercase tracking-wider mb-3">Founder & CEO</div>
              <p className="text-xs text-muted-foreground">Visionary behind the AeThex ecosystem. 10+ years in game development and metaverse architecture.</p>
            </div>
            <div className="text-center p-6 border border-white/10 bg-card/30">
              <div className="w-20 h-20 bg-secondary/20 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl font-display text-secondary">AX</span>
              </div>
              <h3 className="font-display text-white uppercase mb-1">Axiom Lead</h3>
              <div className="text-xs text-secondary uppercase tracking-wider mb-3">Chief Architect</div>
              <p className="text-xs text-muted-foreground">Protocol design and ecosystem governance. Former enterprise software architect.</p>
            </div>
            <div className="text-center p-6 border border-white/10 bg-card/30">
              <div className="w-20 h-20 bg-destructive/20 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl font-display text-destructive">AG</span>
              </div>
              <h3 className="font-display text-white uppercase mb-1">Aegis Lead</h3>
              <div className="text-xs text-destructive uppercase tracking-wider mb-3">Head of Security</div>
              <p className="text-xs text-muted-foreground">Security engineering and threat intelligence. Background in cybersecurity and AI.</p>
            </div>
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.65 }}
          className="text-center"
        >
          <p className="text-muted-foreground mb-6">
            Ready to learn more about investment opportunities?
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="mailto:invest@aethex.dev" 
              className="inline-block bg-primary text-background px-8 py-4 font-bold uppercase tracking-wider hover:bg-primary/90 transition-colors"
              data-testid="button-contact-team"
            >
              Contact Our Team
            </a>
            <Link href="/terminal">
              <button className="inline-block border border-white/20 text-white px-8 py-4 font-bold uppercase tracking-wider hover:bg-white/5 transition-colors" data-testid="button-see-aegis">
                See Aegis Demo
              </button>
            </Link>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
