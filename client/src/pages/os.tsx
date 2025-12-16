import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Terminal, FileText, IdCard, Music, Settings, Globe,
  X, Minus, Square, Maximize2, Volume2, Wifi, Battery,
  ChevronUp
} from "lucide-react";

interface WindowState {
  id: string;
  title: string;
  icon: React.ReactNode;
  content: React.ReactNode;
  x: number;
  y: number;
  width: number;
  height: number;
  minimized: boolean;
  maximized: boolean;
  zIndex: number;
}

interface DesktopApp {
  id: string;
  title: string;
  icon: React.ReactNode;
  content: React.ReactNode;
  defaultWidth: number;
  defaultHeight: number;
}

export default function AeThexOS() {
  const [windows, setWindows] = useState<WindowState[]>([]);
  const [activeWindowId, setActiveWindowId] = useState<string | null>(null);
  const [maxZIndex, setMaxZIndex] = useState(1);
  const [showStartMenu, setShowStartMenu] = useState(false);
  const [time, setTime] = useState(new Date());
  const desktopRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const apps: DesktopApp[] = [
    {
      id: "terminal",
      title: "Terminal",
      icon: <Terminal className="w-8 h-8" />,
      defaultWidth: 700,
      defaultHeight: 450,
      content: <TerminalApp />
    },
    {
      id: "passport",
      title: "Passport Viewer",
      icon: <IdCard className="w-8 h-8" />,
      defaultWidth: 500,
      defaultHeight: 600,
      content: <PassportApp />
    },
    {
      id: "manifesto",
      title: "Manifesto",
      icon: <FileText className="w-8 h-8" />,
      defaultWidth: 600,
      defaultHeight: 500,
      content: <ManifestoApp />
    },
    {
      id: "music",
      title: "Ambient",
      icon: <Music className="w-8 h-8" />,
      defaultWidth: 400,
      defaultHeight: 300,
      content: <MusicApp />
    },
    {
      id: "browser",
      title: "Nexus",
      icon: <Globe className="w-8 h-8" />,
      defaultWidth: 800,
      defaultHeight: 600,
      content: <BrowserApp />
    },
    {
      id: "settings",
      title: "System",
      icon: <Settings className="w-8 h-8" />,
      defaultWidth: 500,
      defaultHeight: 400,
      content: <SettingsApp />
    }
  ];

  const openApp = useCallback((app: DesktopApp) => {
    const existingWindow = windows.find(w => w.id === app.id);
    if (existingWindow) {
      if (existingWindow.minimized) {
        setWindows(prev => prev.map(w => 
          w.id === app.id ? { ...w, minimized: false, zIndex: maxZIndex + 1 } : w
        ));
      } else {
        setWindows(prev => prev.map(w => 
          w.id === app.id ? { ...w, zIndex: maxZIndex + 1 } : w
        ));
      }
      setMaxZIndex(prev => prev + 1);
      setActiveWindowId(app.id);
      return;
    }

    const offsetX = (windows.length % 5) * 40 + 100;
    const offsetY = (windows.length % 5) * 40 + 50;

    const newWindow: WindowState = {
      id: app.id,
      title: app.title,
      icon: app.icon,
      content: app.content,
      x: offsetX,
      y: offsetY,
      width: app.defaultWidth,
      height: app.defaultHeight,
      minimized: false,
      maximized: false,
      zIndex: maxZIndex + 1
    };

    setWindows(prev => [...prev, newWindow]);
    setMaxZIndex(prev => prev + 1);
    setActiveWindowId(app.id);
    setShowStartMenu(false);
  }, [windows, maxZIndex]);

  const closeWindow = useCallback((id: string) => {
    setWindows(prev => prev.filter(w => w.id !== id));
    if (activeWindowId === id) {
      setActiveWindowId(null);
    }
  }, [activeWindowId]);

  const minimizeWindow = useCallback((id: string) => {
    setWindows(prev => prev.map(w => 
      w.id === id ? { ...w, minimized: true } : w
    ));
  }, []);

  const toggleMaximize = useCallback((id: string) => {
    setWindows(prev => prev.map(w => 
      w.id === id ? { ...w, maximized: !w.maximized } : w
    ));
  }, []);

  const focusWindow = useCallback((id: string) => {
    setWindows(prev => prev.map(w => 
      w.id === id ? { ...w, zIndex: maxZIndex + 1 } : w
    ));
    setMaxZIndex(prev => prev + 1);
    setActiveWindowId(id);
  }, [maxZIndex]);

  return (
    <div 
      className="h-screen w-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 overflow-hidden select-none"
      style={{
        backgroundImage: `
          radial-gradient(circle at 20% 80%, rgba(0, 255, 170, 0.05) 0%, transparent 40%),
          radial-gradient(circle at 80% 20%, rgba(0, 200, 255, 0.05) 0%, transparent 40%),
          linear-gradient(to bottom right, #0f172a, #1e1b4b, #0f172a)
        `
      }}
    >
      <div 
        ref={desktopRef}
        className="h-[calc(100vh-48px)] w-full relative"
        onClick={() => setShowStartMenu(false)}
      >
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,170,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,170,0.02)_1px,transparent_1px)] bg-[size:50px_50px]" />
        </div>

        <div className="grid grid-cols-1 gap-2 p-4 w-24">
          {apps.map((app) => (
            <DesktopIcon
              key={app.id}
              icon={app.icon}
              label={app.title}
              onClick={() => openApp(app)}
            />
          ))}
        </div>

        <AnimatePresence>
          {windows.filter(w => !w.minimized).map((window) => (
            <Window
              key={window.id}
              window={window}
              isActive={activeWindowId === window.id}
              onClose={() => closeWindow(window.id)}
              onMinimize={() => minimizeWindow(window.id)}
              onMaximize={() => toggleMaximize(window.id)}
              onFocus={() => focusWindow(window.id)}
              onMove={(x, y) => {
                setWindows(prev => prev.map(w => 
                  w.id === window.id ? { ...w, x, y } : w
                ));
              }}
              onResize={(width, height) => {
                setWindows(prev => prev.map(w => 
                  w.id === window.id ? { ...w, width, height } : w
                ));
              }}
              desktopRef={desktopRef}
            />
          ))}
        </AnimatePresence>
      </div>

      <Taskbar 
        windows={windows}
        activeWindowId={activeWindowId}
        apps={apps}
        time={time}
        showStartMenu={showStartMenu}
        onToggleStartMenu={() => setShowStartMenu(!showStartMenu)}
        onWindowClick={(id) => {
          const window = windows.find(w => w.id === id);
          if (window?.minimized) {
            setWindows(prev => prev.map(w => 
              w.id === id ? { ...w, minimized: false, zIndex: maxZIndex + 1 } : w
            ));
            setMaxZIndex(prev => prev + 1);
          }
          focusWindow(id);
        }}
        onAppClick={openApp}
      />
    </div>
  );
}

function DesktopIcon({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onDoubleClick={onClick}
      className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-white/10 transition-colors cursor-pointer group"
      data-testid={`desktop-icon-${label.toLowerCase().replace(/\s/g, '-')}`}
    >
      <div className="text-cyan-400 group-hover:text-cyan-300 transition-colors">
        {icon}
      </div>
      <span className="text-xs text-white/80 text-center leading-tight font-mono">
        {label}
      </span>
    </motion.button>
  );
}

interface WindowProps {
  window: WindowState;
  isActive: boolean;
  onClose: () => void;
  onMinimize: () => void;
  onMaximize: () => void;
  onFocus: () => void;
  onMove: (x: number, y: number) => void;
  onResize: (width: number, height: number) => void;
  desktopRef: React.RefObject<HTMLDivElement | null>;
}

function Window({ window, isActive, onClose, onMinimize, onMaximize, onFocus, onMove, onResize, desktopRef }: WindowProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, windowX: 0, windowY: 0 });
  const resizeStart = useRef({ x: 0, y: 0, width: 0, height: 0 });

  const handleDragStart = (e: React.MouseEvent) => {
    if (window.maximized) return;
    e.preventDefault();
    setIsDragging(true);
    dragStart.current = {
      x: e.clientX,
      y: e.clientY,
      windowX: window.x,
      windowY: window.y
    };
    onFocus();
  };

  const handleResizeStart = (e: React.MouseEvent) => {
    if (window.maximized) return;
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    resizeStart.current = {
      x: e.clientX,
      y: e.clientY,
      width: window.width,
      height: window.height
    };
  };

  useEffect(() => {
    if (!isDragging && !isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const dx = e.clientX - dragStart.current.x;
        const dy = e.clientY - dragStart.current.y;
        onMove(dragStart.current.windowX + dx, Math.max(0, dragStart.current.windowY + dy));
      }
      if (isResizing) {
        const dx = e.clientX - resizeStart.current.x;
        const dy = e.clientY - resizeStart.current.y;
        onResize(
          Math.max(300, resizeStart.current.width + dx),
          Math.max(200, resizeStart.current.height + dy)
        );
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, isResizing, onMove, onResize]);

  const style = window.maximized 
    ? { top: 0, left: 0, width: "100%", height: "100%", zIndex: window.zIndex }
    : { top: window.y, left: window.x, width: window.width, height: window.height, zIndex: window.zIndex };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.15 }}
      className={`absolute flex flex-col overflow-hidden ${
        isActive 
          ? 'ring-1 ring-cyan-400/50 shadow-lg shadow-cyan-500/20' 
          : 'ring-1 ring-white/10'
      }`}
      style={{
        ...style,
        background: 'linear-gradient(to bottom, rgba(15, 23, 42, 0.98), rgba(15, 23, 42, 0.95))',
        backdropFilter: 'blur(20px)',
        borderRadius: window.maximized ? 0 : '8px'
      }}
      onMouseDown={onFocus}
      data-testid={`window-${window.id}`}
    >
      <div 
        className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-slate-800/80 to-slate-900/80 border-b border-white/5 cursor-move"
        onMouseDown={handleDragStart}
      >
        <div className="flex items-center gap-2">
          <div className="text-cyan-400 w-4 h-4 flex items-center justify-center">
            {window.icon}
          </div>
          <span className="text-sm font-mono text-white/90">{window.title}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onMinimize}
            className="w-6 h-6 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 rounded transition-colors"
            data-testid={`window-minimize-${window.id}`}
          >
            <Minus className="w-3 h-3" />
          </button>
          <button
            onClick={onMaximize}
            className="w-6 h-6 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 rounded transition-colors"
            data-testid={`window-maximize-${window.id}`}
          >
            {window.maximized ? <Square className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
          </button>
          <button
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center text-white/60 hover:text-red-400 hover:bg-red-400/20 rounded transition-colors"
            data-testid={`window-close-${window.id}`}
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {window.content}
      </div>

      {!window.maximized && (
        <div
          className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
          onMouseDown={handleResizeStart}
        >
          <div className="absolute bottom-1 right-1 w-2 h-2 border-r-2 border-b-2 border-cyan-400/40" />
        </div>
      )}
    </motion.div>
  );
}

interface TaskbarProps {
  windows: WindowState[];
  activeWindowId: string | null;
  apps: DesktopApp[];
  time: Date;
  showStartMenu: boolean;
  onToggleStartMenu: () => void;
  onWindowClick: (id: string) => void;
  onAppClick: (app: DesktopApp) => void;
}

function Taskbar({ windows, activeWindowId, apps, time, showStartMenu, onToggleStartMenu, onWindowClick, onAppClick }: TaskbarProps) {
  return (
    <>
      <AnimatePresence>
        {showStartMenu && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-12 left-2 w-64 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-lg overflow-hidden shadow-2xl"
            style={{ zIndex: 9999 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-3 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">A</span>
                </div>
                <div>
                  <div className="text-white font-mono text-sm">AeThex OS</div>
                  <div className="text-white/50 text-xs">v1.0.0</div>
                </div>
              </div>
            </div>
            <div className="p-2">
              {apps.map(app => (
                <button
                  key={app.id}
                  onClick={() => onAppClick(app)}
                  className="w-full flex items-center gap-3 px-3 py-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                  data-testid={`start-menu-${app.id}`}
                >
                  <div className="text-cyan-400 w-5 h-5">{app.icon}</div>
                  <span className="text-sm font-mono">{app.title}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="h-12 bg-slate-900/80 backdrop-blur-xl border-t border-white/10 flex items-center px-2 gap-2">
        <button
          onClick={onToggleStartMenu}
          className={`h-9 px-4 flex items-center gap-2 rounded-lg transition-colors ${
            showStartMenu ? 'bg-cyan-500/20 text-cyan-400' : 'hover:bg-white/10 text-white/80'
          }`}
          data-testid="start-button"
        >
          <div className="w-5 h-5 bg-gradient-to-br from-cyan-500 to-purple-600 rounded flex items-center justify-center">
            <ChevronUp className="w-3 h-3 text-white" />
          </div>
          <span className="text-sm font-mono hidden sm:inline">AeThex</span>
        </button>

        <div className="w-px h-6 bg-white/10" />

        <div className="flex-1 flex items-center gap-1 overflow-x-auto">
          {windows.map(window => (
            <button
              key={window.id}
              onClick={() => onWindowClick(window.id)}
              className={`h-8 px-3 flex items-center gap-2 rounded transition-colors min-w-0 ${
                activeWindowId === window.id && !window.minimized
                  ? 'bg-cyan-500/20 text-cyan-400 border-b-2 border-cyan-400'
                  : window.minimized
                    ? 'bg-white/5 text-white/40 hover:bg-white/10'
                    : 'bg-white/10 text-white/80 hover:bg-white/15'
              }`}
              data-testid={`taskbar-${window.id}`}
            >
              <div className="w-4 h-4 flex-shrink-0">{window.icon}</div>
              <span className="text-xs font-mono truncate max-w-[100px]">{window.title}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 text-white/60">
          <Wifi className="w-4 h-4" />
          <Volume2 className="w-4 h-4" />
          <Battery className="w-4 h-4" />
          <div className="text-xs font-mono px-2">
            {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>
    </>
  );
}

function TerminalApp() {
  const [history, setHistory] = useState<string[]>([
    "AeThex Terminal v1.0.0",
    "Type 'help' for available commands.",
    ""
  ]);
  const [input, setInput] = useState("");

  const commands: Record<string, () => string[]> = {
    help: () => ["Available commands:", "  help     - Show this message", "  status   - System status", "  whoami   - Current user", "  clear    - Clear terminal", "  matrix   - Enter the matrix", ""],
    status: () => ["SYSTEM STATUS", "  Aegis Shield: ACTIVE", "  Threat Level: LOW", "  Architects Online: 47", "  Projects Active: 156", ""],
    whoami: () => ["architect@aethex:~$ You are a Metaverse Architect", ""],
    clear: () => [],
    matrix: () => ["Wake up, Architect...", "The Matrix has you...", "Follow the white rabbit.", ""]
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = input.trim().toLowerCase();
    const output = commands[cmd]?.() || [`Command not found: ${input}`, "Type 'help' for available commands.", ""];
    
    if (cmd === "clear") {
      setHistory([]);
    } else {
      setHistory(prev => [...prev, `$ ${input}`, ...output]);
    }
    setInput("");
  };

  return (
    <div className="h-full bg-black p-4 font-mono text-sm text-green-400 overflow-auto">
      {history.map((line, i) => (
        <div key={i} className="whitespace-pre-wrap">{line}</div>
      ))}
      <form onSubmit={handleSubmit} className="flex items-center">
        <span className="text-cyan-400">$</span>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 ml-2 bg-transparent outline-none text-green-400"
          autoFocus
          data-testid="terminal-input"
        />
      </form>
    </div>
  );
}

function PassportApp() {
  return (
    <div className="h-full p-6 bg-gradient-to-b from-slate-900 to-slate-950">
      <div className="border border-cyan-400/30 rounded-lg p-6 bg-slate-900/50">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 mb-4">
            <IdCard className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-xl font-display text-white uppercase tracking-wider">AeThex Passport</h2>
          <p className="text-cyan-400 text-sm font-mono mt-1">Architect Credentials</p>
        </div>

        <div className="space-y-4 font-mono text-sm">
          <div className="flex justify-between border-b border-white/10 pb-2">
            <span className="text-white/50">Status</span>
            <span className="text-green-400">VERIFIED</span>
          </div>
          <div className="flex justify-between border-b border-white/10 pb-2">
            <span className="text-white/50">Passport ID</span>
            <span className="text-white">AX-2025-0001</span>
          </div>
          <div className="flex justify-between border-b border-white/10 pb-2">
            <span className="text-white/50">Tier</span>
            <span className="text-purple-400">ARCHITECT</span>
          </div>
          <div className="flex justify-between border-b border-white/10 pb-2">
            <span className="text-white/50">XP</span>
            <span className="text-cyan-400">12,450</span>
          </div>
          <div className="flex justify-between border-b border-white/10 pb-2">
            <span className="text-white/50">Level</span>
            <span className="text-yellow-400">15</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/50">Skills</span>
            <span className="text-white">7 Certified</span>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-white/10">
          <div className="text-center text-xs text-white/30">
            Issued by Codex Certification Authority
          </div>
        </div>
      </div>
    </div>
  );
}

function ManifestoApp() {
  return (
    <div className="h-full p-6 bg-slate-950 overflow-auto">
      <div className="max-w-lg mx-auto font-mono text-sm leading-relaxed">
        <h1 className="text-2xl font-display text-cyan-400 uppercase tracking-wider mb-6">
          The AeThex Manifesto
        </h1>
        
        <div className="space-y-4 text-white/80">
          <p>We are the architects of tomorrow.</p>
          
          <p>In a world where the digital and physical converge, we stand at the frontier of a new reality. The Metaverse is not just a destination - it is a canvas for human potential.</p>
          
          <p className="text-cyan-400 font-bold">Our Three Pillars:</p>
          
          <p><span className="text-purple-400">AXIOM</span> - The foundational truths that guide our work. We believe in decentralization, transparency, and the power of community-driven innovation.</p>
          
          <p><span className="text-yellow-400">CODEX</span> - The certification of excellence. Through rigorous training and real-world application, we transform talent into verified Metaverse Architects.</p>
          
          <p><span className="text-green-400">AEGIS</span> - The shield that protects. Security is not an afterthought but a fundamental principle woven into everything we create.</p>
          
          <p className="mt-6 text-white italic">
            "Build. Certify. Protect. This is the way of the Architect."
          </p>
        </div>
      </div>
    </div>
  );
}

function MusicApp() {
  const [isPlaying, setIsPlaying] = useState(false);
  
  const tracks = [
    { name: "Neon Dreams", artist: "Synth Collective" },
    { name: "Digital Rain", artist: "Matrix OST" },
    { name: "Architect's Theme", artist: "AeThex Audio" },
  ];

  return (
    <div className="h-full p-4 bg-gradient-to-b from-purple-950/50 to-slate-950">
      <div className="text-center mb-4">
        <div className="w-24 h-24 mx-auto bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center mb-3">
          <Music className="w-12 h-12 text-white" />
        </div>
        <div className="text-white font-mono">Ambient Player</div>
        <div className="text-white/50 text-xs">v1.0</div>
      </div>

      <div className="space-y-2">
        {tracks.map((track, i) => (
          <button
            key={i}
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-full flex items-center gap-3 p-2 rounded hover:bg-white/10 transition-colors text-left"
          >
            <div className="w-8 h-8 bg-purple-500/20 rounded flex items-center justify-center">
              <Music className="w-4 h-4 text-purple-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-white text-sm truncate">{track.name}</div>
              <div className="text-white/50 text-xs truncate">{track.artist}</div>
            </div>
          </button>
        ))}
      </div>

      <div className="mt-4 p-3 bg-white/5 rounded-lg">
        <div className="text-center text-white/50 text-xs">
          Audio playback coming soon
        </div>
      </div>
    </div>
  );
}

function BrowserApp() {
  return (
    <div className="h-full flex flex-col bg-slate-950">
      <div className="flex items-center gap-2 p-2 bg-slate-900 border-b border-white/10">
        <div className="flex-1 bg-slate-800 rounded px-3 py-1.5 text-white/60 text-sm font-mono">
          nexus://aethex.local
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <Globe className="w-16 h-16 text-cyan-400/50 mx-auto mb-4" />
          <h2 className="text-xl font-display text-white uppercase tracking-wider mb-2">
            Nexus Browser
          </h2>
          <p className="text-white/50 text-sm max-w-sm">
            The decentralized web browser for the Metaverse. Coming soon to AeThex OS.
          </p>
        </div>
      </div>
    </div>
  );
}

function SettingsApp() {
  return (
    <div className="h-full p-6 bg-slate-950">
      <h2 className="text-lg font-display text-white uppercase tracking-wider mb-6">
        System Settings
      </h2>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
          <div>
            <div className="text-white text-sm">Dark Mode</div>
            <div className="text-white/50 text-xs">Always on in AeThex OS</div>
          </div>
          <div className="w-10 h-6 bg-cyan-500 rounded-full relative">
            <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
          </div>
        </div>
        
        <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
          <div>
            <div className="text-white text-sm">Notifications</div>
            <div className="text-white/50 text-xs">System alerts and updates</div>
          </div>
          <div className="w-10 h-6 bg-cyan-500 rounded-full relative">
            <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
          </div>
        </div>
        
        <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
          <div>
            <div className="text-white text-sm">Sound Effects</div>
            <div className="text-white/50 text-xs">UI interaction sounds</div>
          </div>
          <div className="w-10 h-6 bg-slate-600 rounded-full relative">
            <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full" />
          </div>
        </div>
        
        <div className="mt-6 p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
          <div className="text-cyan-400 text-sm font-mono">AeThex OS v1.0.0</div>
          <div className="text-white/50 text-xs mt-1">Build 2025.12.16</div>
        </div>
      </div>
    </div>
  );
}
