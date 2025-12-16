import { useState, useRef, useCallback, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { getIcon } from "@/lib/iconMap";
import { 
  Terminal, FileText, IdCard, Music, Settings, Globe,
  X, Minus, Square, Maximize2, Volume2, Wifi, Battery,
  ChevronUp, FolderOpen, Award, MessageCircle, Send,
  ExternalLink, User, LogOut, BarChart3, Loader2,
  Presentation, Bell, Image, Monitor, Play, Pause, ChevronRight
} from "lucide-react";

interface WindowState {
  id: string;
  title: string;
  icon: React.ReactNode;
  component: string;
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
  component: string;
  defaultWidth: number;
  defaultHeight: number;
}

interface ContextMenuState {
  x: number;
  y: number;
  type: 'desktop' | 'icon';
  appId?: string;
}

const WALLPAPERS = [
  { id: 'default', name: 'Cyber Grid', bg: 'linear-gradient(to bottom right, #0f172a, #1e1b4b, #0f172a)' },
  { id: 'matrix', name: 'Matrix', bg: 'linear-gradient(to bottom, #001100, #002200, #001100)' },
  { id: 'sunset', name: 'Neon Sunset', bg: 'linear-gradient(to bottom, #1a0533, #4a1942, #0f172a)' },
  { id: 'ocean', name: 'Deep Ocean', bg: 'linear-gradient(to bottom, #0a1628, #0d3b66, #0a1628)' },
];

export default function AeThexOS() {
  const [isBooting, setIsBooting] = useState(true);
  const [bootProgress, setBootProgress] = useState(0);
  const [bootStep, setBootStep] = useState('');
  const [windows, setWindows] = useState<WindowState[]>([]);
  const [activeWindowId, setActiveWindowId] = useState<string | null>(null);
  const [maxZIndex, setMaxZIndex] = useState(1);
  const [showStartMenu, setShowStartMenu] = useState(false);
  const [time, setTime] = useState(new Date());
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [wallpaper, setWallpaper] = useState(WALLPAPERS[0]);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [showScreensaver, setShowScreensaver] = useState(false);
  const [notifications, setNotifications] = useState<string[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const desktopRef = useRef<HTMLDivElement>(null);
  const idleTimer = useRef<NodeJS.Timeout | null>(null);
  const { user, isAuthenticated, logout } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    const bootSequence = async () => {
      const steps = [
        { text: 'Initializing AeThex OS...', progress: 10 },
        { text: 'Loading kernel modules...', progress: 25 },
        { text: 'Mounting file systems...', progress: 40 },
        { text: 'Starting Aegis security layer...', progress: 55 },
        { text: 'Connecting to Nexus network...', progress: 70 },
        { text: 'Loading user profile...', progress: 85 },
        { text: 'Welcome, Architect.', progress: 100 },
      ];
      
      for (const step of steps) {
        setBootStep(step.text);
        setBootProgress(step.progress);
        await new Promise(r => setTimeout(r, 400));
      }
      
      await new Promise(r => setTimeout(r, 500));
      setIsBooting(false);
    };
    
    bootSequence();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await fetch('/api/os/notifications');
        const data = await res.json();
        if (Array.isArray(data)) {
          setNotifications(data.map((n: any) => n.message));
        }
      } catch {}
    };
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const resetIdle = () => {
      if (showScreensaver) setShowScreensaver(false);
      if (idleTimer.current) clearTimeout(idleTimer.current);
      idleTimer.current = setTimeout(() => setShowScreensaver(true), 5 * 60 * 1000);
    };
    
    window.addEventListener('mousemove', resetIdle);
    window.addEventListener('keydown', resetIdle);
    resetIdle();
    
    return () => {
      window.removeEventListener('mousemove', resetIdle);
      window.removeEventListener('keydown', resetIdle);
      if (idleTimer.current) clearTimeout(idleTimer.current);
    };
  }, [showScreensaver]);

  const apps: DesktopApp[] = [
    { id: "terminal", title: "Terminal", icon: <Terminal className="w-8 h-8" />, component: "terminal", defaultWidth: 700, defaultHeight: 450 },
    { id: "passport", title: "Passport", icon: <IdCard className="w-8 h-8" />, component: "passport", defaultWidth: 500, defaultHeight: 600 },
    { id: "files", title: "Projects", icon: <FolderOpen className="w-8 h-8" />, component: "files", defaultWidth: 700, defaultHeight: 500 },
    { id: "achievements", title: "Achievements", icon: <Award className="w-8 h-8" />, component: "achievements", defaultWidth: 600, defaultHeight: 500 },
    { id: "chat", title: "Chat", icon: <MessageCircle className="w-8 h-8" />, component: "chat", defaultWidth: 400, defaultHeight: 500 },
    { id: "manifesto", title: "Manifesto", icon: <FileText className="w-8 h-8" />, component: "manifesto", defaultWidth: 600, defaultHeight: 500 },
    { id: "music", title: "Ambient", icon: <Music className="w-8 h-8" />, component: "music", defaultWidth: 400, defaultHeight: 350 },
    { id: "pitch", title: "Pitch Deck", icon: <Presentation className="w-8 h-8" />, component: "pitch", defaultWidth: 500, defaultHeight: 400 },
    { id: "settings", title: "Settings", icon: <Settings className="w-8 h-8" />, component: "settings", defaultWidth: 550, defaultHeight: 500 },
  ];

  const playSound = useCallback((type: 'open' | 'close' | 'minimize' | 'click') => {
    if (!soundEnabled) return;
    // Visual feedback instead of actual sound
    const flash = document.createElement('div');
    flash.className = 'fixed inset-0 bg-cyan-400/5 pointer-events-none z-[99999]';
    document.body.appendChild(flash);
    setTimeout(() => flash.remove(), 50);
  }, [soundEnabled]);

  const openApp = useCallback((app: DesktopApp) => {
    playSound('open');
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
      component: app.component,
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
  }, [windows, maxZIndex, playSound]);

  const closeWindow = useCallback((id: string) => {
    playSound('close');
    setWindows(prev => prev.filter(w => w.id !== id));
    if (activeWindowId === id) setActiveWindowId(null);
  }, [activeWindowId, playSound]);

  const minimizeWindow = useCallback((id: string) => {
    playSound('minimize');
    setWindows(prev => prev.map(w => w.id === id ? { ...w, minimized: true } : w));
  }, [playSound]);

  const toggleMaximize = useCallback((id: string) => {
    setWindows(prev => prev.map(w => w.id === id ? { ...w, maximized: !w.maximized } : w));
  }, []);

  const focusWindow = useCallback((id: string) => {
    setWindows(prev => prev.map(w => w.id === id ? { ...w, zIndex: maxZIndex + 1 } : w));
    setMaxZIndex(prev => prev + 1);
    setActiveWindowId(id);
  }, [maxZIndex]);

  const handleDesktopClick = (e: React.MouseEvent) => {
    setShowStartMenu(false);
    setContextMenu(null);
  };

  const handleDesktopContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, type: 'desktop' });
  };

  const handleIconContextMenu = (e: React.MouseEvent, appId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, type: 'icon', appId });
  };

  const handleWindowSnap = useCallback((id: string, x: number, y: number, width: number, height: number) => {
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight - 48;
    
    if (x <= 10) {
      setWindows(prev => prev.map(w => w.id === id ? { ...w, x: 0, y: 0, width: screenWidth / 2, height: screenHeight } : w));
      return true;
    }
    if (x + width >= screenWidth - 10) {
      setWindows(prev => prev.map(w => w.id === id ? { ...w, x: screenWidth / 2, y: 0, width: screenWidth / 2, height: screenHeight } : w));
      return true;
    }
    if (y <= 10) {
      setWindows(prev => prev.map(w => w.id === id ? { ...w, x: 0, y: 0, width: screenWidth, height: screenHeight, maximized: true } : w));
      return true;
    }
    return false;
  }, []);

  const handleLogout = async () => {
    await logout();
    setLocation("/");
  };

  const renderAppContent = (component: string) => {
    switch (component) {
      case 'terminal': return <TerminalApp />;
      case 'passport': return <PassportApp />;
      case 'files': return <FilesApp />;
      case 'achievements': return <AchievementsApp />;
      case 'chat': return <ChatApp />;
      case 'manifesto': return <ManifestoApp />;
      case 'music': return <MusicApp />;
      case 'pitch': return <PitchApp onNavigate={() => setLocation('/pitch')} />;
      case 'settings': return <SettingsApp wallpaper={wallpaper} setWallpaper={setWallpaper} soundEnabled={soundEnabled} setSoundEnabled={setSoundEnabled} />;
      default: return null;
    }
  };

  if (isBooting) {
    return (
      <div className="h-screen w-screen bg-black flex flex-col items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <div className="w-24 h-24 mx-auto mb-8 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-xl animate-pulse" />
            <div className="absolute inset-2 bg-black rounded-lg flex items-center justify-center">
              <span className="text-4xl font-display font-bold text-white">A</span>
            </div>
          </div>
          
          <div className="text-cyan-400 font-mono text-sm mb-8 h-6">{bootStep}</div>
          
          <div className="w-64 h-1 bg-slate-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-cyan-500 to-purple-600"
              initial={{ width: 0 }}
              animate={{ width: `${bootProgress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          
          <div className="text-white/30 text-xs mt-4 font-mono">AeThex OS v1.0.0</div>
        </motion.div>
      </div>
    );
  }

  if (showScreensaver) {
    return (
      <div 
        className="h-screen w-screen bg-black flex items-center justify-center cursor-pointer"
        onClick={() => setShowScreensaver(false)}
      >
        <motion.div
          animate={{
            x: [0, 100, -100, 50, -50, 0],
            y: [0, -50, 50, -25, 25, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="text-center"
        >
          <div className="text-6xl font-display font-bold bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 text-transparent bg-clip-text">
            AeThex
          </div>
          <div className="text-white/30 text-sm mt-2 font-mono">Click to wake</div>
        </motion.div>
      </div>
    );
  }

  return (
    <div 
      className="h-screen w-screen overflow-hidden select-none relative"
      style={{ background: wallpaper.bg }}
    >
      <div 
        ref={desktopRef}
        className="h-[calc(100vh-48px)] w-full relative"
        onClick={handleDesktopClick}
        onContextMenu={handleDesktopContextMenu}
      >
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,170,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,170,0.02)_1px,transparent_1px)] bg-[size:50px_50px] pointer-events-none" />

        <DesktopWidgets time={time} />

        <div className="absolute top-4 left-4 grid grid-cols-2 gap-2 w-48">
          {apps.slice(0, 9).map((app) => (
            <DesktopIcon
              key={app.id}
              icon={app.icon}
              label={app.title}
              onClick={() => openApp(app)}
              onContextMenu={(e) => handleIconContextMenu(e, app.id)}
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
              onMove={(x, y) => setWindows(prev => prev.map(w => w.id === window.id ? { ...w, x, y } : w))}
              onResize={(width, height) => setWindows(prev => prev.map(w => w.id === window.id ? { ...w, width, height } : w))}
              onSnap={(x, y) => handleWindowSnap(window.id, x, y, window.width, window.height)}
              content={renderAppContent(window.component)}
            />
          ))}
        </AnimatePresence>

        <AnimatePresence>
          {contextMenu && (
            <ContextMenuComponent
              menu={contextMenu}
              apps={apps}
              onClose={() => setContextMenu(null)}
              onOpenApp={openApp}
              onRefresh={() => window.location.reload()}
              onChangeWallpaper={() => {
                const idx = WALLPAPERS.findIndex(w => w.id === wallpaper.id);
                setWallpaper(WALLPAPERS[(idx + 1) % WALLPAPERS.length]);
                setContextMenu(null);
              }}
            />
          )}
        </AnimatePresence>
      </div>

      <Taskbar 
        windows={windows}
        activeWindowId={activeWindowId}
        apps={apps}
        time={time}
        showStartMenu={showStartMenu}
        user={user}
        isAuthenticated={isAuthenticated}
        notifications={notifications}
        showNotifications={showNotifications}
        onToggleStartMenu={() => setShowStartMenu(!showStartMenu)}
        onToggleNotifications={() => setShowNotifications(!showNotifications)}
        onWindowClick={(id) => {
          const window = windows.find(w => w.id === id);
          if (window?.minimized) {
            setWindows(prev => prev.map(w => w.id === id ? { ...w, minimized: false, zIndex: maxZIndex + 1 } : w));
            setMaxZIndex(prev => prev + 1);
          }
          focusWindow(id);
        }}
        onAppClick={openApp}
        onLogout={handleLogout}
        onNavigate={setLocation}
      />
    </div>
  );
}

function DesktopWidgets({ time }: { time: Date }) {
  const { data: metrics } = useQuery({
    queryKey: ['os-metrics'],
    queryFn: async () => {
      const res = await fetch('/api/metrics');
      return res.json();
    },
    refetchInterval: 30000,
  });

  return (
    <div className="absolute top-4 right-4 space-y-3">
      <div className="bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-lg p-4 w-48">
        <div className="text-3xl font-mono text-white font-bold">
          {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
        <div className="text-xs text-white/50 font-mono">
          {time.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}
        </div>
      </div>
      
      {metrics && (
        <div className="bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-lg p-4 w-48">
          <div className="text-xs text-white/50 uppercase tracking-wider mb-2">System Status</div>
          <div className="space-y-1 text-xs font-mono">
            <div className="flex justify-between">
              <span className="text-white/60">Architects</span>
              <span className="text-cyan-400">{metrics.totalProfiles || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/60">Projects</span>
              <span className="text-purple-400">{metrics.totalProjects || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/60">Online</span>
              <span className="text-green-400">{metrics.onlineUsers || 0}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DesktopIcon({ icon, label, onClick, onContextMenu }: { 
  icon: React.ReactNode; 
  label: string; 
  onClick: () => void;
  onContextMenu?: (e: React.MouseEvent) => void;
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onDoubleClick={onClick}
      onContextMenu={onContextMenu}
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

function ContextMenuComponent({ menu, apps, onClose, onOpenApp, onRefresh, onChangeWallpaper }: {
  menu: ContextMenuState;
  apps: DesktopApp[];
  onClose: () => void;
  onOpenApp: (app: DesktopApp) => void;
  onRefresh: () => void;
  onChangeWallpaper: () => void;
}) {
  const app = menu.appId ? apps.find(a => a.id === menu.appId) : null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-lg py-1 shadow-2xl min-w-[160px]"
      style={{ left: menu.x, top: menu.y, zIndex: 99999 }}
      onClick={(e) => e.stopPropagation()}
    >
      {menu.type === 'icon' && app ? (
        <>
          <MenuItem icon={<ChevronRight className="w-4 h-4" />} label="Open" onClick={() => { onOpenApp(app); onClose(); }} />
          <div className="border-t border-white/10 my-1" />
          <MenuItem icon={<Image className="w-4 h-4" />} label="Properties" onClick={onClose} />
        </>
      ) : (
        <>
          <MenuItem icon={<Monitor className="w-4 h-4" />} label="Refresh" onClick={() => { onRefresh(); onClose(); }} />
          <MenuItem icon={<Image className="w-4 h-4" />} label="Change Wallpaper" onClick={onChangeWallpaper} />
          <div className="border-t border-white/10 my-1" />
          <MenuItem icon={<Settings className="w-4 h-4" />} label="Settings" onClick={() => {
            const settingsApp = apps.find(a => a.id === 'settings');
            if (settingsApp) onOpenApp(settingsApp);
            onClose();
          }} />
        </>
      )}
    </motion.div>
  );
}

function MenuItem({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-3 py-2 text-sm text-white/80 hover:text-white hover:bg-white/10 transition-colors"
    >
      {icon}
      {label}
    </button>
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
  onSnap: (x: number, y: number) => boolean;
  content: React.ReactNode;
}

function Window({ window, isActive, onClose, onMinimize, onMaximize, onFocus, onMove, onResize, onSnap, content }: WindowProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, windowX: 0, windowY: 0 });
  const resizeStart = useRef({ x: 0, y: 0, width: 0, height: 0 });

  const handleDragStart = (e: React.MouseEvent) => {
    if (window.maximized) return;
    e.preventDefault();
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY, windowX: window.x, windowY: window.y };
    onFocus();
  };

  const handleResizeStart = (e: React.MouseEvent) => {
    if (window.maximized) return;
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    resizeStart.current = { x: e.clientX, y: e.clientY, width: window.width, height: window.height };
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
        onResize(Math.max(300, resizeStart.current.width + dx), Math.max(200, resizeStart.current.height + dy));
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (isDragging) {
        const newX = dragStart.current.windowX + (e.clientX - dragStart.current.x);
        const newY = Math.max(0, dragStart.current.windowY + (e.clientY - dragStart.current.y));
        onSnap(newX, newY);
      }
      setIsDragging(false);
      setIsResizing(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, isResizing, onMove, onResize, onSnap]);

  const style = window.maximized 
    ? { top: 0, left: 0, width: "100%", height: "calc(100vh - 48px)", zIndex: window.zIndex }
    : { top: window.y, left: window.x, width: window.width, height: window.height, zIndex: window.zIndex };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.15 }}
      className={`absolute flex flex-col overflow-hidden ${isActive ? 'ring-1 ring-cyan-400/50 shadow-lg shadow-cyan-500/20' : 'ring-1 ring-white/10'}`}
      style={{ ...style, background: 'linear-gradient(to bottom, rgba(15, 23, 42, 0.98), rgba(15, 23, 42, 0.95))', backdropFilter: 'blur(20px)', borderRadius: window.maximized ? 0 : '8px' }}
      onMouseDown={onFocus}
      data-testid={`window-${window.id}`}
    >
      <div 
        className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-slate-800/80 to-slate-900/80 border-b border-white/5 cursor-move"
        onMouseDown={handleDragStart}
      >
        <div className="flex items-center gap-2">
          <div className="text-cyan-400 w-4 h-4 flex items-center justify-center">{window.icon}</div>
          <span className="text-sm font-mono text-white/90">{window.title}</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={onMinimize} className="w-6 h-6 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 rounded transition-colors">
            <Minus className="w-3 h-3" />
          </button>
          <button onClick={onMaximize} className="w-6 h-6 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 rounded transition-colors">
            {window.maximized ? <Square className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
          </button>
          <button onClick={onClose} className="w-6 h-6 flex items-center justify-center text-white/60 hover:text-red-400 hover:bg-red-400/20 rounded transition-colors">
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-auto">{content}</div>
      {!window.maximized && (
        <div className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize" onMouseDown={handleResizeStart}>
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
  user: any;
  isAuthenticated: boolean;
  notifications: string[];
  showNotifications: boolean;
  onToggleStartMenu: () => void;
  onToggleNotifications: () => void;
  onWindowClick: (id: string) => void;
  onAppClick: (app: DesktopApp) => void;
  onLogout: () => void;
  onNavigate: (path: string) => void;
}

function Taskbar({ windows, activeWindowId, apps, time, showStartMenu, user, isAuthenticated, notifications, showNotifications, onToggleStartMenu, onToggleNotifications, onWindowClick, onAppClick, onLogout, onNavigate }: TaskbarProps) {
  return (
    <>
      <AnimatePresence>
        {showStartMenu && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-12 left-2 w-72 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-lg overflow-hidden shadow-2xl"
            style={{ zIndex: 9999 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-3 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-lg flex items-center justify-center">
                  {isAuthenticated ? <User className="w-5 h-5 text-white" /> : <span className="text-white font-bold text-lg">A</span>}
                </div>
                <div className="flex-1">
                  <div className="text-white font-mono text-sm">{isAuthenticated ? user?.username : 'Guest'}</div>
                  <div className="text-white/50 text-xs">{isAuthenticated ? (user?.isAdmin ? 'Administrator' : 'Architect') : 'Not logged in'}</div>
                </div>
                {isAuthenticated && (
                  <button onClick={onLogout} className="p-2 text-white/50 hover:text-red-400 transition-colors">
                    <LogOut className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
            
            <div className="p-2 max-h-64 overflow-y-auto">
              {apps.map(app => (
                <button key={app.id} onClick={() => onAppClick(app)} className="w-full flex items-center gap-3 px-3 py-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors" data-testid={`start-menu-${app.id}`}>
                  <div className="text-cyan-400 w-5 h-5">{app.icon}</div>
                  <span className="text-sm font-mono">{app.title}</span>
                </button>
              ))}
            </div>

            {isAuthenticated && user?.isAdmin && (
              <div className="p-2 border-t border-white/10">
                <div className="text-xs text-white/30 uppercase tracking-wider px-3 py-1">Admin</div>
                <button onClick={() => onNavigate('/admin')} className="w-full flex items-center gap-3 px-3 py-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                  <BarChart3 className="w-5 h-5 text-cyan-400" />
                  <span className="text-sm font-mono">Command Center</span>
                  <ExternalLink className="w-3 h-3 ml-auto text-white/30" />
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="h-12 bg-slate-900/80 backdrop-blur-xl border-t border-white/10 flex items-center px-2 gap-2">
        <button onClick={onToggleStartMenu} className={`h-9 px-4 flex items-center gap-2 rounded-lg transition-colors ${showStartMenu ? 'bg-cyan-500/20 text-cyan-400' : 'hover:bg-white/10 text-white/80'}`} data-testid="start-button">
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
                  : window.minimized ? 'bg-white/5 text-white/40 hover:bg-white/10' : 'bg-white/10 text-white/80 hover:bg-white/15'
              }`}
              data-testid={`taskbar-${window.id}`}
            >
              <div className="w-4 h-4 flex-shrink-0">{window.icon}</div>
              <span className="text-xs font-mono truncate max-w-[100px]">{window.title}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-white/60">
          <button onClick={onToggleNotifications} className="p-1.5 hover:bg-white/10 rounded transition-colors relative">
            <Bell className="w-4 h-4" />
            {notifications.length > 0 && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full text-[8px] text-white flex items-center justify-center">
                {notifications.length}
              </div>
            )}
          </button>
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
  const [history, setHistory] = useState<string[]>(["AeThex Terminal v2.0.0", "Type 'help' for available commands.", ""]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const runCommand = async (cmd: string): Promise<string[]> => {
    switch (cmd) {
      case 'help':
        return ["Available commands:", "  help       - Show this message", "  status     - System status from server", "  architects - List architects in network", "  projects   - List active projects", "  whoami     - Current user info", "  clear      - Clear terminal", "  matrix     - Enter the matrix", ""];
      case 'status':
        try {
          const res = await fetch('/api/metrics');
          const data = await res.json();
          return ["SYSTEM STATUS", `  Total Architects: ${data.totalProfiles || 0}`, `  Total Projects: ${data.totalProjects || 0}`, `  Online Users: ${data.onlineUsers || 0}`, `  Verified Users: ${data.verifiedUsers || 0}`, `  Total XP: ${data.totalXP || 0}`, ""];
        } catch {
          return ["Error fetching status", ""];
        }
      case 'architects':
        try {
          const res = await fetch('/api/os/architects');
          const data = await res.json();
          if (!data.length) return ["No architects found in network.", ""];
          const lines = ["ARCHITECTS IN NETWORK:", ""];
          data.forEach((a: any) => {
            lines.push(`  ${a.username || 'Unknown'} - Level ${a.level} (${a.xp} XP)${a.verified ? ' [VERIFIED]' : ''}`);
          });
          lines.push("");
          return lines;
        } catch {
          return ["Error fetching architects", ""];
        }
      case 'projects':
        try {
          const res = await fetch('/api/os/projects');
          const data = await res.json();
          if (!data.length) return ["No projects found.", ""];
          const lines = ["ACTIVE PROJECTS:", ""];
          data.forEach((p: any) => {
            lines.push(`  ${p.title} [${p.status || 'unknown'}]${p.engine ? ` - ${p.engine}` : ''}`);
          });
          lines.push("");
          return lines;
        } catch {
          return ["Error fetching projects", ""];
        }
      case 'whoami':
        return ["architect@aethex-os", "Role: Metaverse Architect", ""];
      case 'matrix':
        return ["Wake up, Architect...", "The Matrix has you...", "Follow the white rabbit.", ""];
      default:
        return [`Command not found: ${cmd}`, "Type 'help' for available commands.", ""];
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = input.trim().toLowerCase();
    setInput("");
    
    if (cmd === 'clear') {
      setHistory([]);
      return;
    }
    
    setHistory(prev => [...prev, `$ ${input}`]);
    setIsLoading(true);
    
    const output = await runCommand(cmd);
    setHistory(prev => [...prev, ...output]);
    setIsLoading(false);
  };

  return (
    <div className="h-full bg-black p-4 font-mono text-sm text-green-400 overflow-auto">
      {history.map((line, i) => <div key={i} className="whitespace-pre-wrap">{line}</div>)}
      {isLoading && <div className="text-cyan-400 animate-pulse">Processing...</div>}
      <form onSubmit={handleSubmit} className="flex items-center">
        <span className="text-cyan-400">$</span>
        <input value={input} onChange={(e) => setInput(e.target.value)} className="flex-1 ml-2 bg-transparent outline-none text-green-400" autoFocus disabled={isLoading} data-testid="terminal-input" />
      </form>
    </div>
  );
}

function PassportApp() {
  const { user, isAuthenticated } = useAuth();
  const { data: profile, isLoading } = useQuery({
    queryKey: ['os-user-profile'],
    queryFn: async () => {
      const res = await fetch('/api/metrics');
      return res.json();
    },
    enabled: true,
  });

  return (
    <div className="h-full p-6 bg-gradient-to-b from-slate-900 to-slate-950 overflow-auto">
      <div className="border border-cyan-400/30 rounded-lg p-6 bg-slate-900/50">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 mb-4">
            {isAuthenticated ? <User className="w-10 h-10 text-white" /> : <IdCard className="w-10 h-10 text-white" />}
          </div>
          <h2 className="text-xl font-display text-white uppercase tracking-wider">AeThex Passport</h2>
          <p className="text-cyan-400 text-sm font-mono mt-1">{isAuthenticated ? user?.username : 'Guest Access'}</p>
        </div>

        <div className="space-y-4 font-mono text-sm">
          <div className="flex justify-between border-b border-white/10 pb-2">
            <span className="text-white/50">Status</span>
            <span className={isAuthenticated ? "text-green-400" : "text-yellow-400"}>{isAuthenticated ? 'VERIFIED' : 'GUEST'}</span>
          </div>
          <div className="flex justify-between border-b border-white/10 pb-2">
            <span className="text-white/50">Role</span>
            <span className="text-purple-400">{isAuthenticated ? (user?.isAdmin ? 'ADMIN' : 'ARCHITECT') : 'VISITOR'}</span>
          </div>
          {profile && (
            <>
              <div className="flex justify-between border-b border-white/10 pb-2">
                <span className="text-white/50">Network</span>
                <span className="text-white">{profile.totalProfiles || 0} Architects</span>
              </div>
              <div className="flex justify-between border-b border-white/10 pb-2">
                <span className="text-white/50">Projects</span>
                <span className="text-cyan-400">{profile.totalProjects || 0}</span>
              </div>
            </>
          )}
        </div>

        <div className="mt-6 pt-4 border-t border-white/10 text-center text-xs text-white/30">
          Issued by Codex Certification Authority
        </div>
      </div>
    </div>
  );
}

function FilesApp() {
  const { data: projects, isLoading } = useQuery({
    queryKey: ['os-projects-list'],
    queryFn: async () => {
      const res = await fetch('/api/os/projects');
      return res.json();
    },
  });

  const { data: metrics } = useQuery({
    queryKey: ['os-metrics'],
    queryFn: async () => {
      const res = await fetch('/api/metrics');
      return res.json();
    },
  });

  return (
    <div className="h-full bg-slate-950 flex flex-col">
      <div className="flex items-center gap-2 p-2 bg-slate-900 border-b border-white/10">
        <div className="flex-1 bg-slate-800 rounded px-3 py-1.5 text-white/60 text-sm font-mono">
          /home/architect/projects
        </div>
      </div>
      <div className="flex-1 p-4 overflow-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <FolderOpen className="w-6 h-6 text-cyan-400 mb-2" />
                <div className="text-xs text-white/50">Total Projects</div>
                <div className="text-xl font-bold text-white">{metrics?.totalProjects || 0}</div>
              </div>
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <User className="w-6 h-6 text-purple-400 mb-2" />
                <div className="text-xs text-white/50">Architects</div>
                <div className="text-xl font-bold text-white">{metrics?.totalProfiles || 0}</div>
              </div>
            </div>
            
            <div className="text-xs text-white/50 uppercase tracking-wider">Project Files</div>
            {projects?.length > 0 ? (
              <div className="space-y-2">
                {projects.map((p: any) => (
                  <div key={p.id} className="flex items-center gap-3 p-2 bg-white/5 rounded border border-white/10 hover:border-cyan-500/30 transition-colors">
                    <FolderOpen className="w-5 h-5 text-cyan-400" />
                    <div className="flex-1 min-w-0">
                      <div className="text-white text-sm truncate">{p.title}</div>
                      <div className="text-white/40 text-xs">{p.engine || 'Unknown engine'}</div>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded ${p.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-white/10 text-white/50'}`}>
                      {p.status || 'unknown'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-white/50 text-sm text-center py-4">No projects found</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function AchievementsApp() {
  const { data: achievements, isLoading } = useQuery({
    queryKey: ['os-achievements-real'],
    queryFn: async () => {
      try {
        const res = await fetch('/api/os/achievements');
        const data = await res.json();
        if (data.length > 0) return data;
      } catch {}
      return [
        { id: 1, name: 'First Steps', description: 'Complete your profile', icon: 'footprints' },
        { id: 2, name: 'Code Warrior', description: 'Submit your first project', icon: 'code' },
        { id: 3, name: 'Community Builder', description: 'Connect with 10 architects', icon: 'users' },
        { id: 4, name: 'Rising Star', description: 'Reach level 10', icon: 'star' },
        { id: 5, name: 'Certified Pro', description: 'Earn your first certification', icon: 'award' },
      ];
    },
  });

  return (
    <div className="h-full bg-slate-950 p-4 overflow-auto">
      <div className="flex items-center gap-2 mb-4">
        <Award className="w-6 h-6 text-yellow-400" />
        <h2 className="text-lg font-display text-white uppercase tracking-wider">Achievements</h2>
      </div>
      
      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
        </div>
      ) : (
        <div className="space-y-3">
          {achievements?.map((achievement: any) => (
            <div key={achievement.id} className={`flex items-center gap-4 p-3 rounded-lg border ${achievement.unlocked ? 'bg-cyan-500/10 border-cyan-500/30' : 'bg-white/5 border-white/10 opacity-50'}`}>
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${achievement.unlocked ? 'bg-cyan-500/20' : 'bg-white/10'}`}>
                {getIcon(achievement.icon)}
              </div>
              <div className="flex-1">
                <div className={`font-mono text-sm ${achievement.unlocked ? 'text-white' : 'text-white/50'}`}>{achievement.name}</div>
                <div className="text-xs text-white/40">{achievement.description}</div>
              </div>
              {achievement.unlocked && <div className="text-green-400 text-xs font-mono">UNLOCKED</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ChatApp() {
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([
    { role: 'assistant', content: "Hi! I'm the AeThex assistant. How can I help you today?" }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;
    
    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ message: userMsg, history: messages.slice(-10) }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.response || "I'm having trouble responding right now." }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I encountered an error. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full bg-slate-950 flex flex-col">
      <div className="flex-1 p-4 overflow-auto space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-3 rounded-lg text-sm ${msg.role === 'user' ? 'bg-cyan-500/20 text-white' : 'bg-white/10 text-white/80'}`}>
              {msg.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white/10 p-3 rounded-lg">
              <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
            </div>
          </div>
        )}
      </div>
      <div className="p-3 border-t border-white/10">
        <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-cyan-500/50"
            disabled={isLoading}
          />
          <button type="submit" disabled={isLoading} className="bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 p-2 rounded-lg transition-colors">
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}

function ManifestoApp() {
  return (
    <div className="h-full p-6 bg-slate-950 overflow-auto">
      <div className="max-w-lg mx-auto font-mono text-sm leading-relaxed">
        <h1 className="text-2xl font-display text-cyan-400 uppercase tracking-wider mb-6">The AeThex Manifesto</h1>
        <div className="space-y-4 text-white/80">
          <p>We are the architects of tomorrow.</p>
          <p>In a world where the digital and physical converge, we stand at the frontier of a new reality. The Metaverse is not just a destination - it is a canvas for human potential.</p>
          <p className="text-cyan-400 font-bold">Our Three Pillars:</p>
          <p><span className="text-purple-400">AXIOM</span> - The foundational truths that guide our work.</p>
          <p><span className="text-yellow-400">CODEX</span> - The certification of excellence.</p>
          <p><span className="text-green-400">AEGIS</span> - The shield that protects.</p>
          <p className="mt-6 text-white italic">"Build. Certify. Protect. This is the way of the Architect."</p>
        </div>
      </div>
    </div>
  );
}

function MusicApp() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(0);
  const tracks = [
    { name: "Neon Dreams", artist: "Synth Collective", duration: "3:42" },
    { name: "Digital Rain", artist: "Matrix OST", duration: "4:15" },
    { name: "Architect's Theme", artist: "AeThex Audio", duration: "5:01" },
  ];

  return (
    <div className="h-full p-4 bg-gradient-to-b from-purple-950/50 to-slate-950 flex flex-col">
      <div className="text-center mb-4">
        <div className="w-20 h-20 mx-auto bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center mb-3">
          <Music className="w-10 h-10 text-white" />
        </div>
        <div className="text-white font-mono text-sm">{tracks[currentTrack].name}</div>
        <div className="text-white/50 text-xs">{tracks[currentTrack].artist}</div>
      </div>

      <div className="flex items-center justify-center gap-4 mb-4">
        <button onClick={() => setCurrentTrack((currentTrack - 1 + tracks.length) % tracks.length)} className="p-2 text-white/60 hover:text-white transition-colors">
          <ChevronUp className="w-5 h-5 rotate-[270deg]" />
        </button>
        <button onClick={() => setIsPlaying(!isPlaying)} className="w-12 h-12 bg-purple-500 hover:bg-purple-400 rounded-full flex items-center justify-center transition-colors">
          {isPlaying ? <Pause className="w-5 h-5 text-white" /> : <Play className="w-5 h-5 text-white ml-0.5" />}
        </button>
        <button onClick={() => setCurrentTrack((currentTrack + 1) % tracks.length)} className="p-2 text-white/60 hover:text-white transition-colors">
          <ChevronUp className="w-5 h-5 rotate-90" />
        </button>
      </div>

      <div className="flex-1 overflow-auto">
        {tracks.map((track, i) => (
          <button key={i} onClick={() => { setCurrentTrack(i); setIsPlaying(true); }} className={`w-full flex items-center gap-3 p-2 rounded hover:bg-white/10 transition-colors text-left ${i === currentTrack ? 'bg-white/10' : ''}`}>
            <div className="w-8 h-8 bg-purple-500/20 rounded flex items-center justify-center">
              <Music className="w-4 h-4 text-purple-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-white text-sm truncate">{track.name}</div>
              <div className="text-white/50 text-xs truncate">{track.artist}</div>
            </div>
            <div className="text-white/30 text-xs">{track.duration}</div>
          </button>
        ))}
      </div>
      <div className="mt-2 p-2 bg-white/5 rounded text-center text-white/40 text-xs">Audio playback simulated</div>
    </div>
  );
}

function PitchApp({ onNavigate }: { onNavigate: () => void }) {
  return (
    <div className="h-full p-6 bg-slate-950 flex flex-col items-center justify-center">
      <Presentation className="w-16 h-16 text-cyan-400 mb-4" />
      <h2 className="text-xl font-display text-white uppercase tracking-wider mb-2">Investor Pitch Deck</h2>
      <p className="text-white/50 text-sm text-center mb-6 max-w-sm">
        View the complete AeThex investor presentation with metrics, projections, and the dual-entity model.
      </p>
      <button onClick={onNavigate} className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-purple-600 text-white px-6 py-3 rounded-lg hover:opacity-90 transition-opacity">
        Open Full Pitch <ExternalLink className="w-4 h-4" />
      </button>
    </div>
  );
}

function SettingsApp({ wallpaper, setWallpaper, soundEnabled, setSoundEnabled }: { 
  wallpaper: typeof WALLPAPERS[0]; 
  setWallpaper: (w: typeof WALLPAPERS[0]) => void;
  soundEnabled: boolean;
  setSoundEnabled: (v: boolean) => void;
}) {
  return (
    <div className="h-full p-6 bg-slate-950 overflow-auto">
      <h2 className="text-lg font-display text-white uppercase tracking-wider mb-6">System Settings</h2>
      
      <div className="space-y-6">
        <div>
          <div className="text-xs text-white/50 uppercase tracking-wider mb-3">Appearance</div>
          <div className="grid grid-cols-2 gap-2">
            {WALLPAPERS.map(wp => (
              <button
                key={wp.id}
                onClick={() => setWallpaper(wp)}
                className={`p-3 rounded-lg border transition-colors ${wallpaper.id === wp.id ? 'border-cyan-500 bg-cyan-500/10' : 'border-white/10 hover:border-white/20'}`}
              >
                <div className="w-full h-12 rounded mb-2" style={{ background: wp.bg }} />
                <div className="text-xs text-white/80">{wp.name}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <div className="text-xs text-white/50 uppercase tracking-wider">System</div>
          
          <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
            <div>
              <div className="text-white text-sm">Sound Effects</div>
              <div className="text-white/50 text-xs">UI interaction feedback</div>
            </div>
            <button onClick={() => setSoundEnabled(!soundEnabled)} className={`w-10 h-6 rounded-full relative transition-colors ${soundEnabled ? 'bg-cyan-500' : 'bg-slate-600'}`}>
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${soundEnabled ? 'right-1' : 'left-1'}`} />
            </button>
          </div>

          <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
            <div>
              <div className="text-white text-sm">Dark Mode</div>
              <div className="text-white/50 text-xs">Always enabled</div>
            </div>
            <div className="w-10 h-6 bg-cyan-500 rounded-full relative">
              <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
            </div>
          </div>
        </div>
        
        <div className="p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
          <div className="text-cyan-400 text-sm font-mono">AeThex OS v2.0.0</div>
          <div className="text-white/50 text-xs mt-1">Build 2025.12.16</div>
        </div>
      </div>
    </div>
  );
}
