import { motion } from "framer-motion";
import { Link } from "wouter";
import { ArrowLeft, CheckCircle2, ShieldCheck, Fingerprint, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import sealImg from '@assets/generated_images/holographic_digital_security_seal_for_certification.png';
import gridBg from '@assets/generated_images/dark_subtle_digital_grid_texture.png';

export default function Passport() {
  const { user } = useAuth();

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["/api/me/profile"],
    enabled: !!user
  });

  const { data: passport, isLoading: passportLoading } = useQuery({
    queryKey: ["/api/me/passport"],
    enabled: !!user
  });

  const { data: achievements, isLoading: achievementsLoading } = useQuery({
    queryKey: ["/api/me/achievements"],
    enabled: !!user
  });

  const isLoading = profileLoading || passportLoading || achievementsLoading;

  if (!user) {
    return (
      <div className="min-h-screen bg-black text-foreground font-mono flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Please log in to view your passport</p>
          <Link href="/login">
            <button className="px-4 py-2 bg-primary text-black font-bold uppercase tracking-wider hover:bg-primary/90 transition-colors">
              Login
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-foreground font-mono relative flex items-center justify-center p-4">
       {/* Background */}
       <div 
        className="absolute inset-0 opacity-10 pointer-events-none z-0"
        style={{ backgroundImage: `url(${gridBg})`, backgroundSize: 'cover' }}
      />

      <Link href="/">
        <button className="absolute top-8 left-8 text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 uppercase text-xs tracking-widest z-50">
          <ArrowLeft className="w-4 h-4" /> Return to Axiom
        </button>
      </Link>

      {isLoading ? (
        <div className="flex items-center gap-2 text-primary">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading passport...</span>
        </div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="relative w-full max-w-2xl bg-card border border-primary/20 shadow-[0_0_50px_-12px_rgba(234,179,8,0.2)] overflow-hidden"
        >
          {/* Holographic Overlay Effect */}
          <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-secondary/5 pointer-events-none z-10" />
          <div className="absolute top-0 left-0 w-full h-1 bg-primary/50 z-20" />
          
          {/* Header */}
          <div className="bg-black/40 p-6 border-b border-primary/20 flex justify-between items-start relative z-20">
            <div>
              <h1 className="text-xl md:text-2xl font-display font-bold text-white tracking-widest uppercase">
                AeThex Foundry
              </h1>
              <p className="text-primary text-xs uppercase tracking-[0.2em] mt-1">
                Architect Credential
              </p>
            </div>
            <img src={sealImg} alt="Seal" className="w-16 h-16 opacity-80 animate-pulse" />
          </div>

          {/* Content Grid */}
          <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8 relative z-20">
            
            {/* Left Column: ID Info */}
            <div className="space-y-6">
              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground uppercase tracking-widest">ID Number</label>
                <div className="text-xl font-tech text-white tracking-wider">
                  {passport?.id?.slice(0, 12) || profile?.aethex_passport_id || 'AX-PENDING'}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground uppercase tracking-widest">Name</label>
                <div className="text-lg font-bold text-white uppercase">
                  {profile?.full_name || profile?.username || user.username}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground uppercase tracking-widest">Rank</label>
                <div className="flex items-center gap-2 text-primary font-bold uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4" /> 
                  {profile?.role === 'admin' || profile?.role === 'oversee' ? 'Overseer' : 
                   profile?.role === 'architect' ? 'Architect' : 'Member'}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground uppercase tracking-widest">Clearance</label>
                <div className="inline-block bg-primary/10 text-primary border border-primary/30 px-3 py-1 text-xs font-bold uppercase tracking-wider">
                  Level {profile?.level || 1}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground uppercase tracking-widest">Total XP</label>
                <div className="text-lg font-bold text-primary">
                  {profile?.total_xp?.toLocaleString() || 0}
                </div>
              </div>
            </div>

            {/* Right Column: Certification */}
            <div className="space-y-6 border-l border-white/10 md:pl-8">
               <div className="mb-4">
                  <h3 className="text-sm font-bold text-white uppercase tracking-widest border-b border-white/10 pb-2 mb-4">
                    Achievements ({achievements?.length || 0})
                  </h3>
                
                {achievements && achievements.length > 0 ? (
                  <ul className="space-y-3 max-h-64 overflow-y-auto">
                    {achievements.map((item: any, index: number) => (
                      <li key={index} className="flex justify-between items-center text-sm">
                        <div className="flex-1">
                          <div className="text-muted-foreground font-semibold">{item.title}</div>
                          {item.description && (
                            <div className="text-xs text-muted-foreground/60 mt-0.5">{item.description}</div>
                          )}
                        </div>
                        <span className="text-secondary font-bold flex items-center gap-1 text-xs uppercase tracking-wider ml-2">
                          <CheckCircle2 className="w-3 h-3" /> +{item.xp_reward || 0} XP
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-xs text-muted-foreground italic py-4 text-center">
                    No achievements yet. Keep building!
                  </div>
                )}
             </div>

             <div className="pt-4 border-t border-white/10 opacity-70">
               <div className="flex items-center gap-3">
                 <Fingerprint className="w-8 h-8 text-primary/50" />
                 <div className="text-[10px] text-muted-foreground font-tech">
                   <div className="uppercase">Immutable Ledger Hash</div>
                   <div className="truncate w-32">0x7f23b9c02a9</div>
                 </div>
               </div>
               <div className="mt-2 text-[10px] italic text-muted-foreground/60 text-right">
                 Verified by The AeThex Foundry
               </div>
             </div>
          </div>

        </div>

        {/* Footer Bar */}
        <div className="bg-primary/5 p-2 text-center border-t border-primary/20">
          <div className="text-[10px] text-primary/60 tracking-[0.3em] uppercase">
             Official Certification Document // Do Not Copy
          </div>
        </div>

      </motion.div>
    </div>
  );
}
