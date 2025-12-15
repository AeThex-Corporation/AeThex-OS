import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import { ArrowLeft, AlertTriangle, Shield, Activity, Lock, Terminal as TerminalIcon, FileCode, Zap, AlertOctagon, Skull } from "lucide-react";

export default function Terminal() {
  const [logs, setLogs] = useState<string[]>([
    "> SYSTEM DIAGNOSTICS...",
    "> CHECKING DEPENDENCIES...",
    "> AEGIS CORE: ........................... [ ACTIVE ]",
    "> PII SCRUBBER: ......................... [ ENGAGED ]",
    "> SHADOW LOGGING: ....................... [ RECORDING ]"
  ]);

  const [mode, setMode] = useState<"normal" | "attack" | "quarantined">("normal");
  const logsEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [logs]);

  const triggerAttack = () => {
    setMode("attack");
    setLogs(prev => [...prev, "", "!!! UNKNOWN SIGNAL DETECTED !!!", "> ANALYZING PACKET...", "> SOURCE: EXTERNAL IP"]);
    
    // Simulate rapid attack logs
    let count = 0;
    const interval = setInterval(() => {
        count++;
        if (count < 8) {
            const threats = [
                "! MALICIOUS PAYLOAD: SQL INJECTION ATTEMPT",
                "! UNAUTHORIZED PORT ACCESS: 8080",
                "! PII EXFILTRATION DETECTED",
                "! MEMORY OVERFLOW IMMINENT"
            ];
            setLogs(prev => [...prev, threats[Math.floor(Math.random() * threats.length)]]);
        } else {
            clearInterval(interval);
            setTimeout(() => {
                setMode("quarantined");
                setLogs(prev => [
                    ...prev, 
                    "", 
                    "> AEGIS INTERVENTION: PROTOCOL OMEGA", 
                    "> THREAT ISOLATED.", 
                    "> CONNECTION SEVERED.",
                    "> SYSTEM RESTORED TO SAFE STATE."
                ]);
            }, 1000);
        }
    }, 300);
  };

  const resetSystem = () => {
      setMode("normal");
      setLogs([
        "> SYSTEM REBOOT...",
        "> AEGIS CORE: ........................... [ ACTIVE ]",
        "> READY."
      ]);
  };

  return (
    <div className={`min-h-screen font-mono flex flex-col overflow-hidden transition-colors duration-1000 ${
        mode === "attack" ? "bg-red-950/20 text-red-500" : 
        mode === "quarantined" ? "bg-orange-950/20 text-orange-400" : 
        "bg-[#0a0a0c] text-[#a9b7c6]"
    }`}>
      
      {/* Top Bar (IDE Style) */}
      <div className={`h-12 border-b flex items-center px-4 justify-between select-none transition-colors duration-500 ${
          mode === "attack" ? "bg-red-900/20 border-red-500/30" : 
          "bg-[#1e1f22] border-[#2b2d30]"
      }`}>
        <div className="flex items-center gap-4">
          <Link href="/">
             <button className="text-muted-foreground hover:text-white transition-colors">
               <ArrowLeft className="w-4 h-4" />
             </button>
          </Link>
          <div className="flex items-center gap-2 text-sm">
             <TerminalIcon className={`w-4 h-4 ${mode === 'attack' ? 'text-red-500 animate-pulse' : 'text-primary'}`} />
             <span className={`font-bold ${mode === 'attack' ? 'text-red-500' : 'text-white'}`}>
                {mode === "attack" ? "AEGIS ALERT // UNDER ATTACK" : "AeThex Terminal v4.2"}
             </span>
             {mode === "normal" && <span className="text-xs text-green-500 bg-green-500/10 px-2 py-0.5 rounded ml-2">[ STATUS: ONLINE ]</span>}
             {mode === "attack" && <span className="text-xs text-red-500 bg-red-500/10 px-2 py-0.5 rounded ml-2 animate-pulse">[ STATUS: CRITICAL ]</span>}
             {mode === "quarantined" && <span className="text-xs text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded ml-2">[ STATUS: SECURE ]</span>}
          </div>
        </div>
        
        {/* Simulation Controls */}
        <div className="flex items-center gap-2">
            {mode === "normal" && (
                <button 
                    onClick={triggerAttack}
                    className="flex items-center gap-2 bg-destructive/10 hover:bg-destructive/20 text-destructive border border-destructive/30 px-3 py-1 text-xs font-bold uppercase tracking-wider rounded transition-all"
                >
                    <Skull className="w-3 h-3" /> Simulate Threat
                </button>
            )}
            {mode === "quarantined" && (
                <button 
                    onClick={resetSystem}
                    className="flex items-center gap-2 bg-green-500/10 hover:bg-green-500/20 text-green-500 border border-green-500/30 px-3 py-1 text-xs font-bold uppercase tracking-wider rounded transition-all"
                >
                    <Shield className="w-3 h-3" /> Reset System
                </button>
            )}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Red Alert Overlay */}
        <AnimatePresence>
            {mode === "attack" && (
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-50 pointer-events-none bg-red-500/10 flex items-center justify-center"
                >
                    <div className="w-full h-[1px] bg-red-500/50 absolute top-1/2 animate-ping" />
                    <div className="h-full w-[1px] bg-red-500/50 absolute left-1/2 animate-ping" />
                    <div className="border-2 border-red-500 text-red-500 px-10 py-4 text-4xl font-display font-bold uppercase tracking-widest bg-black/80 backdrop-blur-sm animate-pulse">
                        Threat Detected
                    </div>
                </motion.div>
            )}
        </AnimatePresence>

        {/* Sidebar */}
        <div className={`w-64 border-r hidden md:flex flex-col transition-colors duration-500 ${
            mode === "attack" ? "bg-red-950/10 border-red-500/30" : 
            "bg-[#1e1f22] border-[#2b2d30]"
        }`}>
           <div className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Explorer</div>
           <div className="px-2 space-y-1">
              <div className="px-2 py-1 bg-[#2b2d30] text-white text-sm rounded cursor-pointer opacity-50">Project_Titan</div>
              <div className="px-4 py-1 text-muted-foreground text-sm opacity-50">src</div>
              <div className="px-6 py-1 text-primary text-sm opacity-50 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-primary rounded-full"></span> main.verse
              </div>
           </div>
           
           <div className={`mt-auto p-4 border-t ${mode === 'attack' ? 'border-red-500/30' : 'border-[#2b2d30]'}`}>
             <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Security Layer</div>
             <div className="space-y-3">
               <div className="flex items-center justify-between text-xs">
                 <span className="text-muted-foreground">Aegis Core</span>
                 <span className={`font-bold flex items-center gap-1 ${mode === 'attack' ? 'text-red-500 animate-pulse' : 'text-green-500'}`}>
                    {mode === 'attack' ? <AlertOctagon className="w-3 h-3" /> : <Shield className="w-3 h-3" />} 
                    {mode === 'attack' ? 'INTERVENING' : 'ACTIVE'}
                 </span>
               </div>
             </div>
           </div>
        </div>

        {/* Main Editor Area */}
        <div className={`flex-1 flex flex-col transition-colors duration-500 ${
             mode === "attack" ? "bg-red-950/10" : "bg-[#1e1f22]"
        }`}>
           
           {/* Code Editor Mockup */}
           <div className={`flex-1 p-6 font-mono text-sm relative overflow-y-auto transition-colors duration-500 ${
               mode === "attack" ? "bg-red-950/20" : "bg-[#0a0a0c]"
           }`}>
             <div className={`absolute left-0 top-0 bottom-0 w-12 border-r flex flex-col items-end pr-3 pt-6 text-muted-foreground/50 select-none ${
                 mode === "attack" ? "bg-red-950/30 border-red-500/20" : "bg-[#1e1f22] border-[#2b2d30]"
             }`}>
               {Array.from({length: 20}).map((_, i) => (
                 <div key={i} className="leading-6">{i + 30}</div>
               ))}
             </div>
             
             {/* Code Content */}
             <div className={`pl-12 pt-0 space-y-1 ${mode === "attack" ? "blur-[2px] opacity-50 transition-all duration-300" : ""}`}>
                <div className="text-gray-500"># User Input Handler</div>
                <div><span className="text-purple-400">class</span> <span className="text-yellow-200">InputHandler</span>:</div>
                <div className="pl-4"><span className="text-purple-400">def</span> <span className="text-blue-400">HandleUserInput</span>(Input: <span className="text-orange-400">string</span>): <span className="text-orange-400">void</span> = </div>
                <div className="pl-8 text-gray-500"># Validate input length</div>
                <div className="pl-8"><span className="text-purple-400">if</span> (Input.Length &gt; 100):</div>
                <div className="pl-12"><span className="text-purple-400">return</span></div>
                <div className="pl-8"></div>
                <div className="pl-8 text-gray-500"># Process user data</div>
                <div className="pl-8"><span className="text-white">LogUserActivity(Input)</span></div>
             </div>

             {mode === "quarantined" && (
                 <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute inset-0 flex items-center justify-center pointer-events-none"
                 >
                     <div className="bg-[#0a0a0c] border border-orange-500/50 p-6 rounded-lg shadow-2xl shadow-orange-500/20 max-w-md text-center">
                         <Shield className="w-12 h-12 text-orange-500 mx-auto mb-4" />
                         <h3 className="text-orange-500 font-bold text-xl mb-2">THREAT NEUTRALIZED</h3>
                         <p className="text-muted-foreground text-sm">
                             Malicious code injection prevented by Aegis Core. 
                             The session has been sanitized.
                         </p>
                     </div>
                 </motion.div>
             )}
           </div>

           {/* Terminal Output */}
           <div className={`h-48 border-t p-4 font-mono text-xs overflow-y-auto transition-colors duration-500 ${
               mode === "attack" ? "bg-black border-red-500/50" : "bg-[#0f1011] border-[#2b2d30]"
           }`}>
             <div className="flex items-center gap-4 mb-2 border-b border-white/10 pb-2">
               <span className={`font-bold border-b-2 pb-2 px-1 ${mode === 'attack' ? 'text-red-500 border-red-500' : 'text-white border-primary'}`}>TERMINAL</span>
             </div>
             
             <div className="space-y-1">
               {logs.map((log, i) => (
                 <motion.div 
                    key={i} 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`${
                        log.includes("!!!") || log.includes("MALICIOUS") ? "text-red-500 font-bold bg-red-500/10 p-1" : 
                        log.includes("AEGIS") ? "text-orange-400 font-bold" :
                        "text-muted-foreground"
                    }`}
                 >
                   {log}
                 </motion.div>
               ))}
               <div ref={logsEndRef} />
             </div>
           </div>

        </div>
      </div>
    </div>
  );
}
