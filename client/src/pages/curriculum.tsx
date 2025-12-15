import { motion } from "framer-motion";
import { Link } from "wouter";
import { ArrowLeft, Lock, CheckCircle2, Circle } from "lucide-react";
import circuitBg from '@assets/generated_images/dark_digital_circuit_board_background.png';

const TECH_TREE = [
  {
    id: "foundation",
    title: "The Foundation",
    nodes: [
      { id: 1, name: "Data Ethics", status: "completed" },
      { id: 2, name: "Logic Gates", status: "completed" },
      { id: 3, name: "System Architecture", status: "completed" },
    ]
  },
  {
    id: "verse",
    title: "Verse Mastery",
    nodes: [
      { id: 4, name: "Input Sanitization", status: "completed" },
      { id: 5, name: "Concurrency", status: "active" },
      { id: 6, name: "Spatial Logic", status: "locked" },
    ]
  },
  {
    id: "security",
    title: "Aegis Protocols",
    nodes: [
      { id: 7, name: "Threat Detection", status: "locked" },
      { id: 8, name: "Kill-Gate Implementation", status: "locked" },
      { id: 9, name: "Zero Trust Models", status: "locked" },
    ]
  }
];

export default function Curriculum() {
  return (
    <div className="min-h-screen bg-background text-foreground font-mono relative overflow-hidden flex flex-col items-center">
      
      {/* Background */}
      <div 
        className="absolute inset-0 opacity-10 pointer-events-none z-0"
        style={{ backgroundImage: `url(${circuitBg})`, backgroundSize: 'cover' }}
      />

      <div className="relative z-10 w-full max-w-5xl px-4 py-10 flex flex-col h-full">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-16">
             <Link href="/">
                <button className="text-muted-foreground hover:text-secondary transition-colors flex items-center gap-2 uppercase text-xs tracking-widest">
                <ArrowLeft className="w-4 h-4" /> Return to Codex
                </button>
            </Link>
            <div className="text-right">
                <h1 className="text-2xl font-display font-bold uppercase text-white tracking-widest">
                    Codex Tech Tree
                </h1>
                <p className="text-xs text-secondary font-bold uppercase tracking-[0.2em]">
                    Current Rank: Architect (Gold)
                </p>
            </div>
        </div>

        {/* Tree Container */}
        <div className="flex-1 flex flex-col md:flex-row justify-between items-center gap-10 relative">
            
            {/* Connecting Line (Horizontal on Desktop) */}
            <div className="absolute top-1/2 left-0 w-full h-1 bg-white/5 hidden md:block -z-10" />
            
            {TECH_TREE.map((section, index) => (
                <div key={section.id} className="w-full md:w-1/3 flex flex-col items-center relative group">
                    
                    {/* Section Title */}
                    <div className="mb-8 text-center">
                        <h2 className="text-lg font-display text-white uppercase tracking-wider mb-1">{section.title}</h2>
                        <div className="text-[10px] text-muted-foreground uppercase">Module 0{index + 1}</div>
                    </div>

                    {/* Nodes */}
                    <div className="space-y-6 w-full max-w-[240px]">
                        {section.nodes.map((node) => (
                            <Node key={node.id} data={node} />
                        ))}
                    </div>

                    {/* Vertical Line for Section */}
                    <div className="absolute top-16 bottom-0 w-[1px] bg-gradient-to-b from-white/10 to-transparent -z-10" />
                </div>
            ))}

        </div>

        <div className="mt-16 text-center">
             <Link href="/passport">
                <button className="bg-secondary/10 hover:bg-secondary/20 text-secondary border border-secondary/50 px-8 py-3 uppercase font-bold tracking-widest text-sm transition-all hover:scale-105">
                    View Verified Credential
                </button>
             </Link>
        </div>

      </div>
    </div>
  );
}

function Node({ data }: { data: { name: string, status: string } }) {
    const isCompleted = data.status === "completed";
    const isActive = data.status === "active";
    const isLocked = data.status === "locked";

    return (
        <motion.div 
            whileHover={{ scale: isLocked ? 1 : 1.05 }}
            className={`
                relative p-4 border transition-all duration-300 backdrop-blur-sm cursor-default
                ${isCompleted ? "bg-secondary/10 border-secondary/50 text-white" : ""}
                ${isActive ? "bg-primary/10 border-primary text-white shadow-[0_0_15px_-5px_rgba(234,179,8,0.5)]" : ""}
                ${isLocked ? "bg-black/40 border-white/5 text-muted-foreground/50" : ""}
            `}
        >
            <div className="flex justify-between items-center">
                <span className="font-bold text-xs uppercase tracking-wider">{data.name}</span>
                {isCompleted && <CheckCircle2 className="w-4 h-4 text-secondary" />}
                {isActive && <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />}
                {isLocked && <Lock className="w-3 h-3" />}
            </div>

            {/* Progress Bar for Active */}
            {isActive && (
                <div className="mt-3 w-full h-1 bg-white/10 overflow-hidden">
                    <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: "65%" }}
                        className="h-full bg-primary"
                    />
                </div>
            )}
        </motion.div>
    )
}
