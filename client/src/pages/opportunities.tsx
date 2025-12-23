import { motion } from "framer-motion";
import { Link } from "wouter";
import { ArrowLeft, Briefcase, DollarSign, Clock, MapPin, Loader2, Building2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import gridBg from '@assets/generated_images/dark_subtle_digital_grid_texture.png';

export default function Opportunities() {
  const { data: opportunities, isLoading } = useQuery<any[]>({
    queryKey: ["/api/opportunities"],
  });

  const formatSalary = (min?: number, max?: number) => {
    if (!min && !max) return "Competitive";
    if (min && max) return `$${(min / 1000).toFixed(0)}k - $${(max / 1000).toFixed(0)}k`;
    if (min) return `$${(min / 1000).toFixed(0)}k+`;
    return `Up to $${(max! / 1000).toFixed(0)}k`;
  };

  const getArmColor = (arm: string) => {
    switch (arm) {
      case 'axiom': return 'text-blue-400 border-blue-400/30 bg-blue-500/10';
      case 'codex': return 'text-yellow-400 border-yellow-400/30 bg-yellow-500/10';
      case 'aegis': return 'text-red-400 border-red-400/30 bg-red-500/10';
      default: return 'text-cyan-400 border-cyan-400/30 bg-cyan-500/10';
    }
  };

  return (
    <div className="min-h-screen bg-black text-foreground font-mono relative p-4 md:p-8">
      {/* Background */}
      <div 
        className="absolute inset-0 opacity-10 pointer-events-none z-0"
        style={{ backgroundImage: `url(${gridBg})`, backgroundSize: 'cover' }}
      />

      <div className="relative z-10 max-w-6xl mx-auto">
        <Link href="/">
          <button className="mb-8 text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 uppercase text-xs tracking-widest">
            <ArrowLeft className="w-4 h-4" /> Return to Axiom
          </button>
        </Link>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-display font-bold text-white tracking-widest uppercase mb-2">
            Opportunities
          </h1>
          <p className="text-primary text-sm uppercase tracking-wider">
            Join the AeThex Ecosystem · {opportunities?.length || 0} Open Positions
          </p>
        </motion.div>

        {isLoading ? (
          <div className="flex items-center justify-center gap-2 text-primary py-12">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span>Loading opportunities...</span>
          </div>
        ) : !opportunities || opportunities.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Briefcase className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p className="text-lg">No opportunities available yet.</p>
            <p className="text-sm mt-2">Check back soon for new positions!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {opportunities.map((opp: any, index: number) => (
              <motion.div
                key={opp.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-card border border-white/10 p-6 hover:border-primary/30 transition-all hover:shadow-lg hover:shadow-primary/10"
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="flex-shrink-0 w-12 h-12 bg-primary/10 border border-primary/30 flex items-center justify-center">
                        <Briefcase className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-white mb-1">{opp.title}</h3>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Building2 className="w-4 h-4" />
                            {opp.job_type || 'Full-time'}
                          </span>
                          {opp.experience_level && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {opp.experience_level}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                      {opp.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-3">
                      <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wider border ${getArmColor(opp.arm_affiliation)}`}>
                        {opp.arm_affiliation}
                      </span>
                      {opp.status === 'open' && (
                        <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider border border-green-400/30 bg-green-500/10 text-green-400">
                          Open
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary flex items-center gap-1">
                        <DollarSign className="w-5 h-5" />
                        {formatSalary(opp.salary_min, opp.salary_max)}
                      </div>
                      <div className="text-xs text-muted-foreground uppercase tracking-wider">
                        Per Year
                      </div>
                    </div>
                    <button className="px-4 py-2 bg-primary text-black font-bold uppercase tracking-wider hover:bg-primary/90 transition-colors text-sm">
                      Apply Now
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
