import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import { ArrowLeft, AlertTriangle, Shield, Activity, Lock, Terminal as TerminalIcon, FileCode } from "lucide-react";

export default function Terminal() {
  const [logs, setLogs] = useState<string[]>([
    "> SYSTEM DIAGNOSTICS...",
    "> CHECKING DEPENDENCIES...",
    "> AEGIS CORE: ........................... [ ACTIVE ]",
    "> PII SCRUBBER: ......................... [ ENGAGED ]",
    "> SHADOW LOGGING: ....................... [ RECORDING ]"
  ]);

  const [showError, setShowError] = useState(false);

  useEffect(() => {
    // Simulate typing/loading effect
    const timer = setTimeout(() => {
      setLogs(prev => [...prev, "! WARNING: Line 45 detects potential phone number input."]);
      setShowError(true);
    }, 2000);

    const timer2 = setTimeout(() => {
        if(showError) {
             setLogs(prev => [...prev, "> AEGIS INTERVENTION: Input blocked."]);
        }
    }, 3500);

    return () => { clearTimeout(timer); clearTimeout(timer2); };
  }, [showError]);

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-[#a9b7c6] font-mono flex flex-col overflow-hidden">
      
      {/* Top Bar (IDE Style) */}
      <div className="h-12 bg-[#1e1f22] border-b border-[#2b2d30] flex items-center px-4 justify-between select-none">
        <div className="flex items-center gap-4">
          <Link href="/">
             <button className="text-muted-foreground hover:text-white transition-colors">
               <ArrowLeft className="w-4 h-4" />
             </button>
          </Link>
          <div className="flex items-center gap-2 text-sm">
             <TerminalIcon className="w-4 h-4 text-primary" />
             <span className="font-bold text-white">AeThex Terminal v4.2</span>
             <span className="text-xs text-green-500 bg-green-500/10 px-2 py-0.5 rounded ml-2">[ STATUS: ONLINE ]</span>
          </div>
        </div>
        <div className="flex items-center gap-6 text-xs text-muted-foreground">
           <div className="flex items-center gap-2">
             <span>PROJECT:</span>
             <span className="text-white">Project_Titan</span>
           </div>
           <div className="flex items-center gap-2">
             <span>ENGINE:</span>
             <span className="text-white">Fortnite UEFN (Verse)</span>
           </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 bg-[#1e1f22] border-r border-[#2b2d30] hidden md:flex flex-col">
           <div className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Explorer</div>
           <div className="px-2 space-y-1">
              <div className="px-2 py-1 bg-[#2b2d30] text-white text-sm rounded cursor-pointer">Project_Titan</div>
              <div className="px-4 py-1 text-muted-foreground text-sm cursor-pointer hover:text-white">src</div>
              <div className="px-6 py-1 text-primary text-sm cursor-pointer hover:text-white flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-primary rounded-full"></span> main.verse
              </div>
              <div className="px-6 py-1 text-muted-foreground text-sm cursor-pointer hover:text-white">utils.verse</div>
              <div className="px-4 py-1 text-muted-foreground text-sm cursor-pointer hover:text-white">assets</div>
           </div>
           
           <div className="mt-auto p-4 border-t border-[#2b2d30]">
             <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Security Layer</div>
             <div className="space-y-3">
               <div className="flex items-center justify-between text-xs">
                 <span className="text-muted-foreground">Aegis Core</span>
                 <span className="text-green-500 font-bold flex items-center gap-1"><Shield className="w-3 h-3" /> ACTIVE</span>
               </div>
               <div className="flex items-center justify-between text-xs">
                 <span className="text-muted-foreground">PII Scrubber</span>
                 <span className="text-green-500 font-bold flex items-center gap-1"><Lock className="w-3 h-3" /> ENGAGED</span>
               </div>
               <div className="flex items-center justify-between text-xs">
                 <span className="text-muted-foreground">Shadow Log</span>
                 <span className="text-primary font-bold flex items-center gap-1"><Activity className="w-3 h-3 animate-pulse" /> REC</span>
               </div>
             </div>
           </div>
        </div>

        {/* Main Editor Area */}
        <div className="flex-1 flex flex-col bg-[#1e1f22]">
           
           {/* Code Editor Mockup */}
           <div className="flex-1 p-6 font-mono text-sm relative overflow-y-auto bg-[#0a0a0c]">
             <div className="absolute left-0 top-0 bottom-0 w-12 border-r border-[#2b2d30] bg-[#1e1f22] flex flex-col items-end pr-3 pt-6 text-muted-foreground/50 select-none">
               {Array.from({length: 20}).map((_, i) => (
                 <div key={i} className="leading-6">{i + 30}</div>
               ))}
             </div>
             <div className="pl-12 pt-0 space-y-1">
                <div className="text-gray-500"># User Input Handler</div>
                <div><span className="text-purple-400">class</span> <span className="text-yellow-200">InputHandler</span>:</div>
                <div className="pl-4"><span className="text-purple-400">def</span> <span className="text-blue-400">HandleUserInput</span>(Input: <span className="text-orange-400">string</span>): <span className="text-orange-400">void</span> = </div>
                <div className="pl-8 text-gray-500"># Validate input length</div>
                <div className="pl-8"><span className="text-purple-400">if</span> (Input.Length &gt; 100):</div>
                <div className="pl-12"><span className="text-purple-400">return</span></div>
                <div className="pl-8"></div>
                <div className="pl-8 text-gray-500"># Process user data</div>
                <div className="pl-8"><span className="text-white">LogUserActivity(Input)</span></div>
                <div className="pl-8"></div>
                
                {/* Error Line */}
                <div className="pl-8 relative group">
                   <div className={`absolute -left-16 w-full h-full bg-destructive/10 border border-destructive/30 z-0 ${showError ? 'opacity-100' : 'opacity-0'} transition-opacity duration-500`}></div>
                   <span className="relative z-10 text-white">StorePhoneNumber(Input) <span className="text-gray-500"># Collecting user contact</span></span>
                </div>
                
                <div className="pl-8"></div>
                <div className="pl-8"><span className="text-purple-400">return</span></div>
             </div>
           </div>

           {/* Terminal Output */}
           <div className="h-48 bg-[#0f1011] border-t border-[#2b2d30] p-4 font-mono text-xs overflow-y-auto">
             <div className="flex items-center gap-4 mb-2 border-b border-white/10 pb-2">
               <span className="text-white font-bold border-b-2 border-primary pb-2 px-1">TERMINAL</span>
               <span className="text-muted-foreground pb-2 px-1">OUTPUT</span>
               <span className="text-muted-foreground pb-2 px-1">PROBLEMS</span>
             </div>
             
             <div className="space-y-1">
               {logs.map((log, i) => (
                 <motion.div 
                    key={i} 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`${log.includes("WARNING") || log.includes("BLOCKED") ? "text-destructive font-bold" : "text-muted-foreground"}`}
                 >
                   {log.includes("WARNING") && <AlertTriangle className="w-3 h-3 inline mr-2" />}
                   {log}
                 </motion.div>
               ))}
               {showError && (
                 <motion.div 
                   initial={{ opacity: 0 }}
                   animate={{ opacity: 1 }}
                   className="mt-2 p-2 bg-destructive/10 border border-destructive/30 text-destructive rounded flex items-center gap-2"
                 >
                   <Shield className="w-4 h-4" />
                   <span>AEGIS INTERVENTION: PII violation detected. Write operation blocked.</span>
                 </motion.div>
               )}
             </div>
           </div>

        </div>
      </div>

      {/* Footer Status */}
      <div className="h-8 bg-[#2b85e4] text-white flex items-center px-4 justify-between text-xs font-bold">
        <div className="flex items-center gap-4">
          <span>BUILD: SUCCESS</span>
          <span>DEPLOY: READY</span>
        </div>
        <Link href="/passport">
          <div className="flex items-center gap-2 cursor-pointer hover:bg-white/10 px-2 py-1 rounded transition-colors">
             <FileCode className="w-3 h-3" />
             VIEW CODEX CREDENTIALS
          </div>
        </Link>
      </div>

    </div>
  );
}
