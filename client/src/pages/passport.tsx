import { motion } from "framer-motion";
import { Link } from "wouter";
import { ArrowLeft, CheckCircle2, ShieldCheck, Fingerprint } from "lucide-react";
import sealImg from '@assets/generated_images/holographic_digital_security_seal_for_certification.png';
import gridBg from '@assets/generated_images/dark_subtle_digital_grid_texture.png';

export default function Passport() {
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
              <div className="text-xl font-tech text-white tracking-wider">AX-2025-001-GLD</div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-muted-foreground uppercase tracking-widest">Name</label>
              <div className="text-lg font-bold text-white uppercase">Alex "Cipher" Chen</div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-muted-foreground uppercase tracking-widest">Rank</label>
              <div className="flex items-center gap-2 text-primary font-bold uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4" /> Architect (Gold Stamp)
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-muted-foreground uppercase tracking-widest">Clearance</label>
              <div className="inline-block bg-primary/10 text-primary border border-primary/30 px-3 py-1 text-xs font-bold uppercase tracking-wider">
                Level 5 (Full Trust)
              </div>
            </div>
          </div>

          {/* Right Column: Certification */}
          <div className="space-y-6 border-l border-white/10 md:pl-8">
             <div className="mb-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-widest border-b border-white/10 pb-2 mb-4">
                  The Codex Standard v1.0
                </h3>
                
                <ul className="space-y-3">
                  <li className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Data Ethics & PII Law</span>
                    <span className="text-secondary font-bold flex items-center gap-1 text-xs uppercase tracking-wider">
                      <CheckCircle2 className="w-3 h-3" /> Passed
                    </span>
                  </li>
                  <li className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Input Sanitization</span>
                    <span className="text-secondary font-bold flex items-center gap-1 text-xs uppercase tracking-wider">
                      <CheckCircle2 className="w-3 h-3" /> Passed
                    </span>
                  </li>
                  <li className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">The Kill-Gate Protocol</span>
                    <span className="text-secondary font-bold flex items-center gap-1 text-xs uppercase tracking-wider">
                      <CheckCircle2 className="w-3 h-3" /> Passed
                    </span>
                  </li>
                </ul>
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
