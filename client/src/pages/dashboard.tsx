import { motion } from "framer-motion";
import { Link } from "wouter";
import { ArrowLeft, Users, ShieldAlert, Globe, Activity, TrendingUp, Target } from "lucide-react";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, LineChart, Line } from "recharts";
import mapBg from '@assets/generated_images/abstract_holographic_world_map_data_visualization.png';

const MOCK_DATA = [
  { name: "Mon", value: 400 },
  { name: "Tue", value: 300 },
  { name: "Wed", value: 550 },
  { name: "Thu", value: 450 },
  { name: "Fri", value: 700 },
  { name: "Sat", value: 600 },
  { name: "Sun", value: 800 },
];

const THREAT_DATA = [
  { name: "00:00", value: 12 },
  { name: "04:00", value: 8 },
  { name: "08:00", value: 45 },
  { name: "12:00", value: 120 },
  { name: "16:00", value: 90 },
  { name: "20:00", value: 35 },
];

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-background text-foreground font-mono relative overflow-hidden">
      
      {/* Background Map */}
      <div 
        className="absolute inset-0 opacity-15 pointer-events-none z-0 mix-blend-screen"
        style={{ backgroundImage: `url(${mapBg})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
      />
      
      <div className="relative z-10 p-6 md:p-10 flex flex-col min-h-screen">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
          <div>
            <Link href="/">
                <button className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 uppercase text-xs tracking-widest mb-2">
                <ArrowLeft className="w-4 h-4" /> Return to Home
                </button>
            </Link>
            <h1 className="text-3xl font-display font-bold uppercase text-white tracking-widest flex items-center gap-3">
              <Globe className="w-8 h-8 text-primary" />
              Axiom Command
            </h1>
            <p className="text-muted-foreground text-sm font-tech">Global Ecosystem Status // Real-time Telemetry</p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right">
                <div className="text-xs text-muted-foreground uppercase">System Status</div>
                <div className="text-green-500 font-bold flex items-center gap-2 justify-end">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" /> OPERATIONAL
                </div>
            </div>
          </div>
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
            <Card title="Active Architects" value="12,405" change="+12%" icon={<Users className="w-5 h-5 text-primary" />} />
            <Card title="Threats Blocked" value="1.2M" change="+5%" icon={<ShieldAlert className="w-5 h-5 text-destructive" />} />
            <Card title="Projects Deployed" value="8,932" change="+24%" icon={<Activity className="w-5 h-5 text-secondary" />} />
            <Card title="Avg. Skill Rating" value="94.2" change="+1.2" icon={<Target className="w-5 h-5 text-white" />} />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1">
            
            {/* Map / Main Viz (Placeholder for now, using background) */}
            <div className="md:col-span-2 bg-card/50 border border-white/10 p-6 backdrop-blur-sm flex flex-col relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/80 pointer-events-none" />
                <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-6 flex items-center gap-2 relative z-10">
                    <Globe className="w-4 h-4" /> Global Deployment Heatmap
                </h3>
                
                {/* Fake Map Markers */}
                <div className="flex-1 relative min-h-[300px] border border-white/5 bg-black/20 rounded-lg overflow-hidden">
                    <div className="absolute top-1/4 left-1/4 w-3 h-3 bg-primary rounded-full animate-ping" />
                    <div className="absolute top-1/4 left-1/4 w-3 h-3 bg-primary rounded-full" />
                    
                    <div className="absolute top-1/3 left-1/2 w-3 h-3 bg-secondary rounded-full animate-ping delay-300" />
                    <div className="absolute top-1/3 left-1/2 w-3 h-3 bg-secondary rounded-full" />

                    <div className="absolute bottom-1/3 right-1/4 w-3 h-3 bg-destructive rounded-full animate-ping delay-700" />
                    <div className="absolute bottom-1/3 right-1/4 w-3 h-3 bg-destructive rounded-full" />
                    
                    {/* Grid Overlay */}
                    <div className="absolute inset-0 bg-[url(@assets/generated_images/dark_subtle_digital_grid_texture.png)] opacity-30 mix-blend-overlay" />
                </div>
            </div>

            {/* Side Charts */}
            <div className="space-y-6">
                <div className="bg-card/50 border border-white/10 p-6 backdrop-blur-sm h-[200px] flex flex-col">
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">Recruitment Velocity</h3>
                    <div className="flex-1 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={MOCK_DATA}>
                                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[2, 2, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-card/50 border border-white/10 p-6 backdrop-blur-sm h-[200px] flex flex-col">
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">Threat Vectors (24h)</h3>
                    <div className="flex-1 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={THREAT_DATA}>
                                <Line type="monotone" dataKey="value" stroke="hsl(var(--destructive))" strokeWidth={2} dot={false} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

        </div>

      </div>
    </div>
  );
}

function Card({ title, value, change, icon }: { title: string, value: string, change: string, icon: React.ReactNode }) {
    return (
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card/50 border border-white/10 p-6 backdrop-blur-sm hover:border-primary/30 transition-colors"
        >
            <div className="flex justify-between items-start mb-4">
                <div className="text-xs text-muted-foreground uppercase tracking-widest font-bold">{title}</div>
                {icon}
            </div>
            <div className="flex items-end justify-between">
                <div className="text-3xl font-display font-bold text-white">{value}</div>
                <div className="text-xs text-green-500 font-bold mb-1">{change}</div>
            </div>
        </motion.div>
    )
}
