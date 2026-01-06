import { motion } from "framer-motion";
import { Sparkles, Orbit } from "lucide-react";
import { isMobile } from "@/lib/platform";

export function Mobile3DScene() {
  if (!isMobile()) return null;

  const cards = [
    { title: "Spatial", accent: "from-cyan-500 to-emerald-500", delay: 0 },
    { title: "Realtime", accent: "from-purple-500 to-pink-500", delay: 0.08 },
    { title: "Secure", accent: "from-amber-500 to-orange-500", delay: 0.16 },
  ];

  return (
    <div className="relative my-4 px-4">
      <div className="overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-950 via-slate-900 to-black p-4 shadow-2xl" style={{ perspective: "900px" }}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(56,189,248,0.25),transparent_35%),radial-gradient(circle_at_80%_10%,rgba(168,85,247,0.2),transparent_30%),radial-gradient(circle_at_50%_80%,rgba(16,185,129,0.18),transparent_30%)] blur-3xl" />

        <div className="relative flex items-center justify-between text-xs uppercase tracking-[0.2em] text-cyan-200 font-mono mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            <span>3D Surface</span>
          </div>
          <div className="flex items-center gap-2 text-emerald-200">
            <Orbit className="w-4 h-4" />
            <span>Live</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 transform-style-3d">
          {cards.map((card, idx) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, rotateX: -15, rotateY: 8, z: -30 }}
              animate={{ opacity: 1, rotateX: -6, rotateY: 6, z: -12 }}
              transition={{ duration: 0.9, delay: card.delay, ease: "easeOut" }}
              whileHover={{ rotateX: 0, rotateY: 0, z: 0, scale: 1.04 }}
              className={`relative h-28 rounded-2xl bg-gradient-to-br ${card.accent} p-3 text-white shadow-xl shadow-black/40 border border-white/10`}
              style={{ transformStyle: "preserve-3d" }}
            >
              <div className="text-[11px] font-semibold uppercase tracking-wide opacity-80">{card.title}</div>
              <div className="text-[10px] text-white/80 mt-1">AeThex OS</div>
              <div className="absolute bottom-2 right-2 text-[9px] font-mono text-white/70">3D</div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="relative mt-4 rounded-2xl border border-cyan-400/40 bg-white/5 px-3 py-2 text-[11px] text-cyan-50 font-mono"
        >
          <span className="text-emerald-300 font-semibold">Immersive Mode:</span> Haptics + live network + native toasts are active.
        </motion.div>
      </div>
    </div>
  );
}
