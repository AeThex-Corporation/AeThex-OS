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
  Presentation, Bell, Image, Monitor, Play, Pause, ChevronRight,
  Network, Activity, Code2, Radio, Newspaper, Gamepad2,
  Users, Trophy, Calculator, StickyNote, Cpu, Camera,
  Eye, Shield, Zap, Skull, Lock, Unlock, Server, Database,
  TrendingUp, ArrowUp, ArrowDown, Hash, Key
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
  accentColor?: string;
  desktopId: number;
}

interface Toast {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

interface ThemeSettings {
  mode: 'dark' | 'light' | 'system';
  accentColor: string;
  transparency: number;
}

interface DesktopLayout {
  name: string;
  windows: Array<{ appId: string; x: number; y: number; width: number; height: number }>;
  desktop: number;
}

const ACCENT_COLORS = [
  { id: 'cyan', name: 'Cyan', color: '#06b6d4', ring: 'ring-cyan-400/50', shadow: 'shadow-cyan-500/20', bg: 'bg-cyan-500' },
  { id: 'purple', name: 'Purple', color: '#a855f7', ring: 'ring-purple-400/50', shadow: 'shadow-purple-500/20', bg: 'bg-purple-500' },
  { id: 'green', name: 'Green', color: '#22c55e', ring: 'ring-green-400/50', shadow: 'shadow-green-500/20', bg: 'bg-green-500' },
  { id: 'orange', name: 'Orange', color: '#f97316', ring: 'ring-orange-400/50', shadow: 'shadow-orange-500/20', bg: 'bg-orange-500' },
  { id: 'pink', name: 'Pink', color: '#ec4899', ring: 'ring-pink-400/50', shadow: 'shadow-pink-500/20', bg: 'bg-pink-500' },
  { id: 'red', name: 'Red', color: '#ef4444', ring: 'ring-red-400/50', shadow: 'shadow-red-500/20', bg: 'bg-red-500' },
];

type ClearanceMode = 'foundation' | 'corp';

interface ClearanceTheme {
  id: ClearanceMode;
  name: string;
  title: string;
  subtitle: string;
  primary: string;
  secondary: string;
  accent: string;
  accentSecondary: string;
  wallpaper: string;
  borderStyle: string;
  fontStyle: string;
}

const DAILY_TIPS = [
  { title: "Quick Launch", tip: "Press Ctrl+Space to open Spotlight search and quickly find apps." },
  { title: "Virtual Desktops", tip: "Use the numbered buttons (1-4) in the taskbar to switch between virtual desktops." },
  { title: "Window Management", tip: "Double-click a window title bar to maximize/restore it." },
  { title: "Keyboard Shortcuts", tip: "Ctrl+T opens Terminal, Ctrl+S opens Settings, Ctrl+F opens Files." },
  { title: "Theme Switching", tip: "Click the Start menu and use 'Switch Clearance' to change between Foundation and Corp modes." },
  { title: "Sound Settings", tip: "Toggle system sounds in Settings to enable audio feedback for actions." },
  { title: "Dock Apps", tip: "Your most-used apps are pinned to the quick-launch dock for easy access." },
  { title: "Right-Click Menu", tip: "Right-click on the desktop to access quick options like refresh and settings." },
  { title: "Calculator", tip: "Need quick math? Open Calculator from the app menu or dock." },
  { title: "Notifications", tip: "Click the bell icon in the taskbar to view system notifications." },
];

const PINNED_APPS = ['terminal', 'networkneighborhood', 'calculator', 'settings'];

const CLEARANCE_THEMES: Record<ClearanceMode, ClearanceTheme> = {
  foundation: {
    id: 'foundation',
    name: 'The Foundation',
    title: 'FOUNDATION',
    subtitle: 'The Architect\'s Domain',
    primary: '#DC2626',
    secondary: '#D4AF37',
    accent: '#DC2626',
    accentSecondary: '#D4AF37',
    wallpaper: 'radial-gradient(ellipse at 30% 20%, #4a1515 0%, #1a0505 40%, #0a0202 100%)',
    borderStyle: 'border-yellow-600/40',
    fontStyle: 'font-mono',
  },
  corp: {
    id: 'corp',
    name: 'The Corp',
    title: 'CORPORATION',
    subtitle: 'Executive Operations',
    primary: '#0F172A',
    secondary: '#C0C0C0',
    accent: '#3B82F6',
    accentSecondary: '#C0C0C0',
    wallpaper: 'radial-gradient(ellipse at 70% 80%, #1e3a5f 0%, #0f172a 40%, #050a14 100%)',
    borderStyle: 'border-slate-400/30',
    fontStyle: 'font-sans',
  },
};

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
  { id: 'default', name: 'Cyber Grid', bg: 'linear-gradient(to bottom right, #0f172a, #1e1b4b, #0f172a)', secret: false },
  { id: 'matrix', name: 'Matrix', bg: 'linear-gradient(to bottom, #001100, #002200, #001100)', secret: false },
  { id: 'sunset', name: 'Neon Sunset', bg: 'linear-gradient(to bottom, #1a0533, #4a1942, #0f172a)', secret: false },
  { id: 'ocean', name: 'Deep Ocean', bg: 'linear-gradient(to bottom, #0a1628, #0d3b66, #0a1628)', secret: false },
  { id: 'vaporwave', name: '⚡ Vaporwave', bg: 'linear-gradient(135deg, #ff71ce, #01cdfe, #05ffa1, #b967ff)', secret: true },
  { id: 'bloodmoon', name: '🔥 Blood Moon', bg: 'linear-gradient(to bottom, #1a0000, #4a0000, #1a0000)', secret: true },
  { id: 'galaxy', name: '🌌 Galaxy', bg: 'radial-gradient(ellipse at center, #1b2735 0%, #090a0f 100%)', secret: true },
];

const KONAMI_CODE = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];

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
  const [secretsUnlocked, setSecretsUnlocked] = useState(false);
  const [konamiProgress, setKonamiProgress] = useState<string[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [showSpotlight, setShowSpotlight] = useState(false);
  const [spotlightQuery, setSpotlightQuery] = useState('');
  const [currentDesktop, setCurrentDesktop] = useState(0);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [desktopIcons, setDesktopIcons] = useState<string[]>([]);
  const [theme, setTheme] = useState<ThemeSettings>(() => {
    const saved = localStorage.getItem('aethex-theme');
    return saved ? JSON.parse(saved) : { mode: 'dark', accentColor: 'cyan', transparency: 80 };
  });
  const [savedLayouts, setSavedLayouts] = useState<DesktopLayout[]>(() => {
    const saved = localStorage.getItem('aethex-layouts');
    return saved ? JSON.parse(saved) : [];
  });
  const [clearanceMode, setClearanceMode] = useState<ClearanceMode>(() => {
    const saved = localStorage.getItem('aethex-clearance');
    return (saved as ClearanceMode) || 'foundation';
  });
  const [isSwitchingClearance, setIsSwitchingClearance] = useState(false);
  const [showDailyTip, setShowDailyTip] = useState(false);
  const [dailyTip, setDailyTip] = useState(DAILY_TIPS[0]);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const audioContextRef = useRef<AudioContext | null>(null);
  const clearanceTheme = CLEARANCE_THEMES[clearanceMode];
  const desktopRef = useRef<HTMLDivElement>(null);
  const idleTimer = useRef<NodeJS.Timeout | null>(null);
  const spotlightRef = useRef<HTMLInputElement>(null);
  const { user, isAuthenticated, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [activeTrayPanel, setActiveTrayPanel] = useState<'wifi' | 'volume' | 'battery' | 'notifications' | null>(null);
  const [volume, setVolume] = useState(75);
  const [isMuted, setIsMuted] = useState(false);
  const [batteryInfo, setBatteryInfo] = useState<{ level: number; charging: boolean } | null>(null);

  useEffect(() => {
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        setBatteryInfo({ level: Math.round(battery.level * 100), charging: battery.charging });
        battery.addEventListener('levelchange', () => {
          setBatteryInfo(prev => prev ? { ...prev, level: Math.round(battery.level * 100) } : null);
        });
        battery.addEventListener('chargingchange', () => {
          setBatteryInfo(prev => prev ? { ...prev, charging: battery.charging } : null);
        });
      });
    }
  }, []);

  const { data: weatherData, isFetching: weatherFetching } = useQuery({
    queryKey: ['weather'],
    queryFn: async () => {
      const res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=40.7128&longitude=-74.0060&current_weather=true&temperature_unit=fahrenheit');
      return res.json();
    },
    refetchInterval: 600000,
    staleTime: 300000,
  });

  const addToast = useCallback((message: string, type: Toast['type'] = 'info') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  useEffect(() => {
    localStorage.setItem('aethex-theme', JSON.stringify(theme));
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('aethex-layouts', JSON.stringify(savedLayouts));
  }, [savedLayouts]);

  useEffect(() => {
    localStorage.setItem('aethex-clearance', clearanceMode);
  }, [clearanceMode]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

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
      
      const randomTip = DAILY_TIPS[Math.floor(Math.random() * DAILY_TIPS.length)];
      setDailyTip(randomTip);
      setTimeout(() => setShowDailyTip(true), 1000);
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

  useEffect(() => {
    const handleKonami = (e: KeyboardEvent) => {
      setKonamiProgress(prev => {
        const newProgress = [...prev, e.key].slice(-10);
        if (newProgress.length === 10 && newProgress.every((k, i) => k === KONAMI_CODE[i])) {
          setSecretsUnlocked(true);
          setNotifications(prev => ['🎮 SECRETS UNLOCKED! Check Settings for new wallpapers.', ...prev]);
          return [];
        }
        return newProgress;
      });
    };
    const handleTerminalUnlock = () => {
      setSecretsUnlocked(true);
      setNotifications(prev => ['🔓 Terminal unlock activated! Check Settings.', ...prev]);
    };
    window.addEventListener('keydown', handleKonami);
    window.addEventListener('aethex-unlock-secrets', handleTerminalUnlock);
    return () => {
      window.removeEventListener('keydown', handleKonami);
      window.removeEventListener('aethex-unlock-secrets', handleTerminalUnlock);
    };
  }, []);

  useEffect(() => {
    if (showSpotlight && spotlightRef.current) {
      spotlightRef.current.focus();
    }
  }, [showSpotlight]);

  useEffect(() => {
    const saved = localStorage.getItem('aethex-window-positions');
    if (saved) {
      try {
        const positions = JSON.parse(saved);
        setWindows(prev => prev.map(w => {
          const savedPos = positions[w.id];
          return savedPos ? { ...w, ...savedPos } : w;
        }));
      } catch {}
    }
    const hasVisited = localStorage.getItem('aethex-visited');
    if (!hasVisited) {
      setShowOnboarding(true);
      localStorage.setItem('aethex-visited', 'true');
    }
  }, []);

  useEffect(() => {
    if (windows.length > 0) {
      const positions: Record<string, { x: number; y: number; width: number; height: number }> = {};
      windows.forEach(w => {
        positions[w.id] = { x: w.x, y: w.y, width: w.width, height: w.height };
      });
      localStorage.setItem('aethex-window-positions', JSON.stringify(positions));
    }
  }, [windows]);

  const foundationApps: DesktopApp[] = [
    { id: "networkneighborhood", title: "Network Neighborhood", icon: <Network className="w-8 h-8" />, component: "networkneighborhood", defaultWidth: 500, defaultHeight: 450 },
    { id: "mission", title: "README.TXT", icon: <FileText className="w-8 h-8" />, component: "mission", defaultWidth: 500, defaultHeight: 500 },
    { id: "foundry", title: "FOUNDRY.EXE", icon: <Award className="w-8 h-8" />, component: "foundry", defaultWidth: 450, defaultHeight: 500 },
    { id: "chat", title: "AeThex AI", icon: <MessageCircle className="w-8 h-8" />, component: "chat", defaultWidth: 400, defaultHeight: 500 },
    { id: "terminal", title: "Terminal", icon: <Terminal className="w-8 h-8" />, component: "terminal", defaultWidth: 750, defaultHeight: 500 },
    { id: "metrics", title: "System Status", icon: <Activity className="w-8 h-8" />, component: "metrics", defaultWidth: 750, defaultHeight: 550 },
    { id: "passport", title: "LOGIN", icon: <Key className="w-8 h-8" />, component: "passport", defaultWidth: 500, defaultHeight: 600 },
    { id: "devtools", title: "Dev Tools", icon: <Code2 className="w-8 h-8" />, component: "devtools", defaultWidth: 450, defaultHeight: 400 },
    { id: "music", title: "Radio AeThex", icon: <Radio className="w-8 h-8" />, component: "music", defaultWidth: 400, defaultHeight: 350 },
    { id: "codeeditor", title: "The Lab", icon: <Code2 className="w-8 h-8" />, component: "codeeditor", defaultWidth: 700, defaultHeight: 500 },
    { id: "arcade", title: "Arcade", icon: <Gamepad2 className="w-8 h-8" />, component: "arcade", defaultWidth: 420, defaultHeight: 520 },
    { id: "calculator", title: "Calculator", icon: <Calculator className="w-8 h-8" />, component: "calculator", defaultWidth: 320, defaultHeight: 450 },
    { id: "settings", title: "Settings", icon: <Settings className="w-8 h-8" />, component: "settings", defaultWidth: 550, defaultHeight: 500 },
  ];

  const corpApps: DesktopApp[] = [
    { id: "networkneighborhood", title: "Network Neighborhood", icon: <Network className="w-8 h-8" />, component: "networkneighborhood", defaultWidth: 500, defaultHeight: 450 },
    { id: "mission", title: "README.TXT", icon: <FileText className="w-8 h-8" />, component: "mission", defaultWidth: 500, defaultHeight: 500 },
    { id: "foundry", title: "FOUNDRY.EXE", icon: <Award className="w-8 h-8" />, component: "foundry", defaultWidth: 450, defaultHeight: 500 },
    { id: "devtools", title: "Dev Tools", icon: <Code2 className="w-8 h-8" />, component: "devtools", defaultWidth: 450, defaultHeight: 400 },
    { id: "metrics", title: "System Status", icon: <Activity className="w-8 h-8" />, component: "metrics", defaultWidth: 750, defaultHeight: 550 },
    { id: "passport", title: "LOGIN", icon: <Key className="w-8 h-8" />, component: "passport", defaultWidth: 500, defaultHeight: 600 },
    { id: "network", title: "Global Ops", icon: <Globe className="w-8 h-8" />, component: "network", defaultWidth: 700, defaultHeight: 550 },
    { id: "files", title: "Asset Library", icon: <Database className="w-8 h-8" />, component: "files", defaultWidth: 700, defaultHeight: 500 },
    { id: "pitch", title: "Contracts", icon: <FileText className="w-8 h-8" />, component: "pitch", defaultWidth: 500, defaultHeight: 400 },
    { id: "sysmonitor", title: "Infrastructure", icon: <Server className="w-8 h-8" />, component: "sysmonitor", defaultWidth: 450, defaultHeight: 400 },
    { id: "leaderboard", title: "Performance", icon: <BarChart3 className="w-8 h-8" />, component: "leaderboard", defaultWidth: 500, defaultHeight: 550 },
    { id: "calculator", title: "Calculator", icon: <Calculator className="w-8 h-8" />, component: "calculator", defaultWidth: 320, defaultHeight: 450 },
    { id: "settings", title: "Settings", icon: <Settings className="w-8 h-8" />, component: "settings", defaultWidth: 550, defaultHeight: 500 },
  ];

  const apps = clearanceMode === 'foundation' ? foundationApps : corpApps;

  const playSound = useCallback((type: 'open' | 'close' | 'minimize' | 'click' | 'notification' | 'switch') => {
    if (!soundEnabled) return;
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
      }
      const ctx = audioContextRef.current;
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      const sounds: Record<string, { freq: number; duration: number; type: OscillatorType }> = {
        open: { freq: 523, duration: 0.1, type: 'sine' },
        close: { freq: 392, duration: 0.1, type: 'sine' },
        minimize: { freq: 330, duration: 0.08, type: 'sine' },
        click: { freq: 800, duration: 0.03, type: 'square' },
        notification: { freq: 880, duration: 0.15, type: 'sine' },
        switch: { freq: 440, duration: 0.2, type: 'sawtooth' },
      };
      
      const sound = sounds[type] || sounds.click;
      oscillator.type = sound.type;
      oscillator.frequency.setValueAtTime(sound.freq, ctx.currentTime);
      gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + sound.duration);
      
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + sound.duration);
    } catch (e) {
      console.log('Audio not available');
    }
  }, [soundEnabled]);

  const switchClearance = useCallback(() => {
    const newMode: ClearanceMode = clearanceMode === 'foundation' ? 'corp' : 'foundation';
    setIsSwitchingClearance(true);
    setShowStartMenu(false);
    playSound('switch');
    
    setTimeout(() => {
      setClearanceMode(newMode);
      setIsSwitchingClearance(false);
      addToast(`Switched to ${CLEARANCE_THEMES[newMode].name}`, 'success');
    }, 600);
  }, [clearanceMode, addToast, playSound]);

  const openApp = useCallback((app: DesktopApp) => {
    playSound('open');
    const existingWindow = windows.find(w => w.id === app.id);
    if (existingWindow) {
      setWindows(prev => prev.map(w => 
        w.id === app.id ? { ...w, minimized: false, zIndex: maxZIndex + 1, desktopId: currentDesktop } : w
      ));
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
      zIndex: maxZIndex + 1,
      desktopId: currentDesktop
    };

    setWindows(prev => [...prev, newWindow]);
    setMaxZIndex(prev => prev + 1);
    setActiveWindowId(app.id);
    setShowStartMenu(false);
  }, [windows, maxZIndex, playSound, currentDesktop]);

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

  useEffect(() => {
    const handleGlobalKeys = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === ' ') {
        e.preventDefault();
        setShowSpotlight(prev => !prev);
        setSpotlightQuery('');
      }
      if (e.key === 'Escape') {
        setShowSpotlight(false);
        setShowStartMenu(false);
        setContextMenu(null);
      }
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey) {
        const shortcuts: Record<string, string> = { 't': 'terminal', 'n': 'notes', 'e': 'codeeditor', 'p': 'passport', 'm': 'metrics' };
        if (shortcuts[e.key]) {
          e.preventDefault();
          const app = apps.find(a => a.id === shortcuts[e.key]);
          if (app) openApp(app);
        }
      }
      if ((e.metaKey || e.ctrlKey) && e.key >= '1' && e.key <= '4') {
        e.preventDefault();
        setCurrentDesktop(parseInt(e.key) - 1);
        addToast(`Switched to Desktop ${e.key}`, 'info');
      }
    };
    window.addEventListener('keydown', handleGlobalKeys);
    return () => window.removeEventListener('keydown', handleGlobalKeys);
  }, [apps, openApp, addToast]);

  const renderAppContent = (component: string) => {
    switch (component) {
      case 'terminal': return <TerminalApp />;
      case 'passport': return <PassportApp />;
      case 'files': return <FilesApp />;
      case 'network': return <NetworkMapApp />;
      case 'metrics': return <MetricsDashboardApp />;
      case 'codeeditor': return <CodeEditorApp />;
      case 'newsfeed': return <NewsFeedApp />;
      case 'arcade': return <ArcadeApp />;
      case 'profiles': return <ProfilesApp />;
      case 'leaderboard': return <LeaderboardApp />;
      case 'calculator': return <CalculatorApp />;
      case 'notes': return <NotesApp />;
      case 'sysmonitor': return <SystemMonitorApp />;
      case 'webcam': return <WebcamApp />;
      case 'achievements': return <AchievementsApp />;
      case 'chat': return <ChatApp />;
      case 'music': return <MusicApp />;
      case 'pitch': return <PitchApp onNavigate={() => setLocation('/pitch')} />;
      case 'networkneighborhood': return <NetworkNeighborhoodApp />;
      case 'foundry': return <FoundryApp />;
      case 'devtools': return <DevToolsApp />;
      case 'mission': return <MissionApp />;
      case 'settings': return <SettingsApp 
        wallpaper={wallpaper} 
        setWallpaper={setWallpaper} 
        soundEnabled={soundEnabled} 
        setSoundEnabled={setSoundEnabled} 
        secretsUnlocked={secretsUnlocked}
        theme={theme}
        setTheme={setTheme}
        savedLayouts={savedLayouts}
        onSaveLayout={(name) => {
          const layout: DesktopLayout = {
            name,
            windows: windows.map(w => ({ appId: w.component, x: w.x, y: w.y, width: w.width, height: w.height })),
            desktop: currentDesktop,
          };
          setSavedLayouts(prev => [...prev.filter(l => l.name !== name), layout]);
          addToast(`Layout "${name}" saved`, 'success');
        }}
        onLoadLayout={(layout) => {
          setWindows([]);
          setTimeout(() => {
            layout.windows.forEach((w, i) => {
              const app = apps.find(a => a.component === w.appId);
              if (app) {
                const windowId = `${app.id}-${Date.now()}-${i}`;
                setWindows(prev => [...prev, {
                  id: windowId,
                  title: app.title,
                  icon: app.icon,
                  component: app.component,
                  x: w.x,
                  y: w.y,
                  width: w.width,
                  height: w.height,
                  minimized: false,
                  maximized: false,
                  zIndex: i + 1,
                  desktopId: layout.desktop
                }]);
              }
            });
            setCurrentDesktop(layout.desktop);
            addToast(`Layout "${layout.name}" loaded`, 'success');
          }, 100);
        }}
        onDeleteLayout={(name) => {
          setSavedLayouts(prev => prev.filter(l => l.name !== name));
          addToast(`Layout "${name}" deleted`, 'info');
        }}
      />;
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

  const parallaxX = (mousePosition.x / window.innerWidth - 0.5) * 10;
  const parallaxY = (mousePosition.y / window.innerHeight - 0.5) * 10;

  return (
    <div 
      className="h-screen w-screen overflow-hidden select-none relative transition-all duration-700"
      style={{ 
        background: clearanceTheme.wallpaper,
        backgroundPosition: `${50 + parallaxX}% ${50 + parallaxY}%`,
        backgroundSize: '110% 110%'
      }}
    >
      <div 
        ref={desktopRef}
        className="h-[calc(100vh-48px)] w-full relative"
        onClick={handleDesktopClick}
        onContextMenu={handleDesktopContextMenu}
      >
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,170,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,170,0.02)_1px,transparent_1px)] bg-[size:50px_50px] pointer-events-none" />

        <DesktopWidgets time={time} weather={weatherData} notifications={notifications} />

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
          {windows.filter(w => !w.minimized && w.desktopId === currentDesktop).map((window) => (
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
        windows={windows.filter(w => w.desktopId === currentDesktop)}
        activeWindowId={activeWindowId}
        apps={apps}
        time={time}
        showStartMenu={showStartMenu}
        user={user}
        isAuthenticated={isAuthenticated}
        notifications={notifications}
        showNotifications={showNotifications}
        onToggleStartMenu={() => { setShowStartMenu(!showStartMenu); setActiveTrayPanel(null); }}
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
        currentDesktop={currentDesktop}
        onDesktopChange={(d) => {
          setCurrentDesktop(d);
          setActiveTrayPanel(null);
        }}
        clearanceTheme={clearanceTheme}
        onSwitchClearance={switchClearance}
        activeTrayPanel={activeTrayPanel}
        onTrayPanelToggle={(panel) => setActiveTrayPanel(activeTrayPanel === panel ? null : panel)}
        volume={volume}
        onVolumeChange={setVolume}
        isMuted={isMuted}
        onMuteToggle={() => setIsMuted(!isMuted)}
        batteryInfo={batteryInfo}
        onClearNotification={(idx) => setNotifications(prev => prev.filter((_, i) => i !== idx))}
        onClearAllNotifications={() => setNotifications([])}
        desktopWindowCounts={[0, 1, 2, 3].map(d => windows.filter(w => w.desktopId === d).length)}
      />

      <AnimatePresence>
        {isSwitchingClearance && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[99999] flex items-center justify-center"
            style={{ background: clearanceMode === 'foundation' ? '#0F172A' : '#1a0505' }}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.2, opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center"
                style={{ 
                  border: `3px solid ${clearanceMode === 'foundation' ? '#3B82F6' : '#D4AF37'}`,
                  borderTopColor: 'transparent'
                }}
              />
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="font-display text-2xl uppercase tracking-[0.3em]"
                style={{ color: clearanceMode === 'foundation' ? '#C0C0C0' : '#D4AF37' }}
              >
                {clearanceMode === 'foundation' ? 'Entering Corp' : 'Entering Foundation'}
              </motion.div>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="h-0.5 mt-4 mx-auto max-w-[200px]"
                style={{ background: `linear-gradient(90deg, transparent, ${clearanceMode === 'foundation' ? '#3B82F6' : '#DC2626'}, transparent)` }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ParticleField />

      <AnimatePresence>
        {showSpotlight && (
          <SpotlightSearch
            query={spotlightQuery}
            setQuery={setSpotlightQuery}
            apps={apps}
            onSelectApp={(app) => { openApp(app); setShowSpotlight(false); }}
            onClose={() => setShowSpotlight(false)}
            inputRef={spotlightRef}
          />
        )}
      </AnimatePresence>

      <ToastContainer toasts={toasts} />

      <AnimatePresence>
        {showDailyTip && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-20 right-4 z-[9998] w-80 rounded-xl overflow-hidden shadow-2xl"
            style={{ 
              background: clearanceTheme.id === 'foundation' ? 'rgba(26, 5, 5, 0.95)' : 'rgba(15, 23, 42, 0.95)',
              border: `1px solid ${clearanceTheme.accent}40`
            }}
          >
            <div 
              className="px-4 py-3 flex items-center justify-between"
              style={{ borderBottom: `1px solid ${clearanceTheme.accent}30` }}
            >
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4" style={{ color: clearanceTheme.accent }} />
                <span className="text-sm font-semibold text-white">Daily Tip</span>
              </div>
              <button 
                onClick={() => setShowDailyTip(false)}
                className="text-white/40 hover:text-white transition-colors"
                data-testid="close-daily-tip"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4">
              <div className="text-xs uppercase tracking-wider mb-2" style={{ color: clearanceTheme.accent }}>
                {dailyTip.title}
              </div>
              <p className="text-sm text-white/80 leading-relaxed">
                {dailyTip.tip}
              </p>
            </div>
            <div className="px-4 pb-4">
              <button
                onClick={() => setShowDailyTip(false)}
                className="w-full py-2 rounded-lg text-sm font-medium transition-all hover:scale-[1.02]"
                style={{ 
                  background: `${clearanceTheme.accent}20`,
                  color: clearanceTheme.accent,
                  border: `1px solid ${clearanceTheme.accent}40`
                }}
                data-testid="dismiss-daily-tip"
              >
                Got it!
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {weatherFetching && (
        <div className="fixed top-4 right-4 z-[9999] flex items-center gap-2 px-3 py-2 rounded-lg bg-black/50 backdrop-blur-sm" data-testid="loading-indicator">
          <Loader2 className="w-4 h-4 animate-spin" style={{ color: clearanceTheme.accent }} />
          <span className="text-xs text-white/60">Syncing...</span>
        </div>
      )}

      <AnimatePresence>
        {showOnboarding && (
          <OnboardingTour
            step={onboardingStep}
            onNext={() => setOnboardingStep(s => s + 1)}
            onClose={() => setShowOnboarding(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function DesktopWidgets({ time, weather, notifications }: { 
  time: Date; 
  weather?: { current_weather?: { temperature: number; windspeed: number; weathercode: number } };
  notifications?: string[];
}) {
  const { data: metrics } = useQuery({
    queryKey: ['os-metrics'],
    queryFn: async () => {
      const res = await fetch('/api/metrics');
      return res.json();
    },
    refetchInterval: 30000,
  });

  const getWeatherIcon = (code: number) => {
    if (code === 0) return '☀️';
    if (code <= 3) return '⛅';
    if (code <= 48) return '🌫️';
    if (code <= 67) return '🌧️';
    if (code <= 77) return '🌨️';
    if (code <= 82) return '🌧️';
    if (code <= 86) return '🌨️';
    return '⛈️';
  };

  return (
    <div className="absolute top-4 right-4 space-y-3 z-10">
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-lg p-4 w-52"
      >
        <div className="text-3xl font-mono text-white font-bold">
          {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
        <div className="text-xs text-white/50 font-mono">
          {time.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}
        </div>
      </motion.div>

      {weather?.current_weather && (
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-lg p-4 w-52"
        >
          <div className="text-xs text-white/50 uppercase tracking-wider mb-2">Weather</div>
          <div className="flex items-center gap-3">
            <span className="text-3xl">{getWeatherIcon(weather.current_weather.weathercode)}</span>
            <div>
              <div className="text-2xl font-mono text-white">{Math.round(weather.current_weather.temperature)}°F</div>
              <div className="text-xs text-white/50">Wind: {weather.current_weather.windspeed} mph</div>
            </div>
          </div>
        </motion.div>
      )}
      
      {metrics && (
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-lg p-4 w-52"
        >
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
        </motion.div>
      )}

      {notifications && notifications.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-lg p-4 w-52 max-h-32 overflow-hidden"
        >
          <div className="text-xs text-white/50 uppercase tracking-wider mb-2">Notifications</div>
          <div className="space-y-1 text-xs">
            {notifications.slice(0, 3).map((n, i) => (
              <div key={i} className="text-white/70 truncate">{n}</div>
            ))}
          </div>
        </motion.div>
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
  currentDesktop: number;
  onDesktopChange: (d: number) => void;
  clearanceTheme: ClearanceTheme;
  onSwitchClearance: () => void;
  activeTrayPanel: 'wifi' | 'volume' | 'battery' | 'notifications' | null;
  onTrayPanelToggle: (panel: 'wifi' | 'volume' | 'battery' | 'notifications') => void;
  volume: number;
  onVolumeChange: (v: number) => void;
  isMuted: boolean;
  onMuteToggle: () => void;
  batteryInfo: { level: number; charging: boolean } | null;
  onClearNotification: (index: number) => void;
  onClearAllNotifications: () => void;
  desktopWindowCounts: number[];
}

function Skeleton({ className = "", animate = true }: { className?: string; animate?: boolean }) {
  return (
    <div className={`bg-white/10 rounded ${animate ? 'animate-pulse' : ''} ${className}`} />
  );
}

function LoadingSkeleton() {
  return (
    <div className="p-4 space-y-4">
      <Skeleton className="h-8 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <div className="flex gap-4 mt-6">
        <Skeleton className="h-24 w-24 rounded-lg" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4 mt-4">
        <Skeleton className="h-20 rounded-lg" />
        <Skeleton className="h-20 rounded-lg" />
        <Skeleton className="h-20 rounded-lg" />
      </div>
    </div>
  );
}

function ParticleField() {
  const particles = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 2 + 1,
    duration: Math.random() * 20 + 10,
    delay: Math.random() * 5,
  }));

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
      {particles.map(p => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-cyan-400/20"
          style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size }}
          animate={{
            y: [0, -30, 0],
            opacity: [0.2, 0.5, 0.2],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

function SpotlightSearch({ query, setQuery, apps, onSelectApp, onClose, inputRef }: {
  query: string;
  setQuery: (q: string) => void;
  apps: DesktopApp[];
  onSelectApp: (app: DesktopApp) => void;
  onClose: () => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
}) {
  const filtered = apps.filter(a => a.title.toLowerCase().includes(query.toLowerCase()));

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: -20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -20 }}
      className="fixed inset-0 flex items-start justify-center pt-[20vh] z-[99999]"
      onClick={onClose}
    >
      <div 
        className="w-[500px] bg-slate-900/95 backdrop-blur-2xl border border-white/20 rounded-2xl shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-4 border-b border-white/10 flex items-center gap-3">
          <Globe className="w-5 h-5 text-cyan-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search apps... (Ctrl+Space)"
            className="flex-1 bg-transparent text-white text-lg outline-none placeholder:text-white/30"
            autoFocus
          />
          <kbd className="px-2 py-1 text-xs text-white/40 bg-white/5 rounded">ESC</kbd>
        </div>
        <div className="max-h-[300px] overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="p-4 text-center text-white/40">No apps found</div>
          ) : (
            filtered.map(app => (
              <button
                key={app.id}
                onClick={() => onSelectApp(app)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/10 transition-colors text-left"
              >
                <div className="w-8 h-8 bg-cyan-500/20 rounded-lg flex items-center justify-center text-cyan-400">
                  {app.icon}
                </div>
                <span className="text-white font-mono">{app.title}</span>
              </button>
            ))
          )}
        </div>
        <div className="p-2 border-t border-white/10 text-xs text-white/30 text-center">
          Ctrl+T Terminal • Ctrl+N Notes • Ctrl+E Code • Ctrl+P Passport
        </div>
      </div>
    </motion.div>
  );
}

function ToastContainer({ toasts }: { toasts: Toast[] }) {
  const colors = {
    info: 'border-cyan-500/50 bg-cyan-500/10',
    success: 'border-green-500/50 bg-green-500/10',
    warning: 'border-yellow-500/50 bg-yellow-500/10',
    error: 'border-red-500/50 bg-red-500/10',
  };

  return (
    <div className="fixed top-4 right-4 z-[99999] space-y-2" style={{ pointerEvents: 'none' }}>
      <AnimatePresence>
        {toasts.map(toast => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 100, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.9 }}
            className={`px-4 py-3 rounded-lg border backdrop-blur-xl ${colors[toast.type]}`}
            style={{ pointerEvents: 'auto' }}
          >
            <span className="text-white text-sm font-mono">{toast.message}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

function OnboardingTour({ step, onNext, onClose }: { step: number; onNext: () => void; onClose: () => void }) {
  const steps = [
    { title: 'Welcome to AeThex OS', content: 'Your operating system for the Metaverse. Double-click icons to open apps.' },
    { title: 'Desktop Navigation', content: 'Use Ctrl+Space to open Spotlight search. Press Ctrl+1-4 to switch desktops.' },
    { title: 'Keyboard Shortcuts', content: 'Ctrl+T for Terminal, Ctrl+N for Notes, Ctrl+E for Code Editor.' },
    { title: 'Discover Secrets', content: 'Try the Konami code or explore Terminal commands. There are hidden surprises!' },
  ];

  if (step >= steps.length) {
    onClose();
    return null;
  }

  const current = steps[step];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-[99999]"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="w-[400px] bg-slate-900 border border-cyan-500/30 rounded-xl p-6 shadow-2xl"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-lg font-display text-white uppercase tracking-wider">{current.title}</h3>
        </div>
        <p className="text-white/70 text-sm mb-6">{current.content}</p>
        <div className="flex items-center justify-between">
          <div className="flex gap-1">
            {steps.map((_, i) => (
              <div key={i} className={`w-2 h-2 rounded-full ${i === step ? 'bg-cyan-400' : 'bg-white/20'}`} />
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 text-white/60 hover:text-white transition-colors text-sm">
              Skip
            </button>
            <button onClick={onNext} className="px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors text-sm">
              {step === steps.length - 1 ? 'Get Started' : 'Next'}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function Taskbar({ windows, activeWindowId, apps, time, showStartMenu, user, isAuthenticated, notifications, showNotifications, onToggleStartMenu, onToggleNotifications, onWindowClick, onAppClick, onLogout, onNavigate, currentDesktop, onDesktopChange, clearanceTheme, onSwitchClearance, activeTrayPanel, onTrayPanelToggle, volume, onVolumeChange, isMuted, onMuteToggle, batteryInfo, onClearNotification, onClearAllNotifications, desktopWindowCounts }: TaskbarProps) {
  return (
    <>
      <AnimatePresence>
        {showStartMenu && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-12 left-2 w-72 backdrop-blur-xl rounded-lg overflow-hidden shadow-2xl transition-all duration-300"
            style={{ 
              zIndex: 9999,
              background: clearanceTheme.id === 'foundation' ? 'rgba(26, 5, 5, 0.95)' : 'rgba(15, 23, 42, 0.95)',
              border: `1px solid ${clearanceTheme.id === 'foundation' ? 'rgba(212, 175, 55, 0.3)' : 'rgba(192, 192, 192, 0.2)'}`
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-3" style={{ borderBottom: `1px solid ${clearanceTheme.id === 'foundation' ? 'rgba(212, 175, 55, 0.2)' : 'rgba(255,255,255,0.1)'}` }}>
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ background: `linear-gradient(135deg, ${clearanceTheme.accent}, ${clearanceTheme.accentSecondary})` }}
                >
                  {isAuthenticated ? <User className="w-5 h-5 text-white" /> : <span className="text-white font-bold text-lg">A</span>}
                </div>
                <div className="flex-1">
                  <div className={`text-white text-sm ${clearanceTheme.fontStyle}`}>{isAuthenticated ? user?.username : 'Guest'}</div>
                  <div className="text-xs" style={{ color: clearanceTheme.accentSecondary }}>
                    {clearanceTheme.title}
                  </div>
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
                <button 
                  key={app.id} 
                  onClick={() => onAppClick(app)} 
                  className={`w-full flex items-center gap-3 px-3 py-2 text-white/80 hover:text-white rounded-lg transition-colors ${clearanceTheme.fontStyle}`}
                  style={{ '--hover-bg': `${clearanceTheme.accent}20` } as any}
                  onMouseEnter={(e) => e.currentTarget.style.background = `${clearanceTheme.accent}20`}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  data-testid={`start-menu-${app.id}`}
                >
                  <div className="w-5 h-5" style={{ color: clearanceTheme.accent }}>{app.icon}</div>
                  <span className="text-sm">{app.title}</span>
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

            <div className="p-2 border-t border-white/10">
              <button 
                onClick={onSwitchClearance} 
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group"
                style={{ 
                  background: `linear-gradient(135deg, ${clearanceTheme.id === 'foundation' ? '#3B82F6' : '#DC2626'}20, ${clearanceTheme.id === 'foundation' ? '#C0C0C0' : '#D4AF37'}10)`,
                  border: `1px solid ${clearanceTheme.id === 'foundation' ? '#3B82F640' : '#D4AF3740'}`
                }}
                data-testid="switch-clearance-btn"
              >
                <div className="relative">
                  <Shield className="w-5 h-5" style={{ color: clearanceTheme.id === 'foundation' ? '#3B82F6' : '#D4AF37' }} />
                  <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full animate-pulse" style={{ background: clearanceTheme.id === 'foundation' ? '#3B82F6' : '#DC2626' }} />
                </div>
                <div className="flex-1 text-left">
                  <div className="text-xs uppercase tracking-wider font-bold" style={{ color: clearanceTheme.id === 'foundation' ? '#3B82F6' : '#D4AF37' }}>
                    Switch Clearance
                  </div>
                  <div className="text-[10px] text-white/40">
                    {clearanceTheme.id === 'foundation' ? 'Enter Corp Mode' : 'Enter Foundation Mode'}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-white/30 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>

            <div className="p-2 border-t border-white/10">
              <div className="flex items-center justify-center gap-4">
                <a 
                  href="https://twitter.com/aethex_hq" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-2 text-white/50 hover:text-cyan-400 transition-colors"
                  data-testid="social-twitter"
                >
                  <Globe className="w-4 h-4" />
                </a>
                <a 
                  href="https://discord.gg/aethex" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-2 text-white/50 hover:text-purple-400 transition-colors"
                  data-testid="social-discord"
                >
                  <MessageCircle className="w-4 h-4" />
                </a>
                <a 
                  href="https://github.com/aethex" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-2 text-white/50 hover:text-white transition-colors"
                  data-testid="social-github"
                >
                  <Code2 className="w-4 h-4" />
                </a>
              </div>
              <div className="text-center text-[10px] text-white/30 mt-1">
                AeThex OS v1.0.0
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div 
        className="h-12 backdrop-blur-xl border-t flex items-center px-2 gap-2 transition-all duration-500"
        style={{ 
          background: clearanceTheme.id === 'foundation' ? 'rgba(26, 5, 5, 0.9)' : 'rgba(15, 23, 42, 0.9)',
          borderColor: clearanceTheme.id === 'foundation' ? 'rgba(212, 175, 55, 0.2)' : 'rgba(192, 192, 192, 0.2)'
        }}
      >
        <button 
          onClick={onToggleStartMenu} 
          className={`h-9 px-4 flex items-center gap-2 rounded-lg transition-colors`}
          style={{
            background: showStartMenu ? `${clearanceTheme.accent}30` : 'transparent',
            color: showStartMenu ? clearanceTheme.accent : 'rgba(255,255,255,0.8)'
          }}
          data-testid="start-button"
        >
          <div 
            className="w-5 h-5 rounded flex items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${clearanceTheme.accent}, ${clearanceTheme.accentSecondary})` }}
          >
            <ChevronUp className="w-3 h-3 text-white" />
          </div>
          <span className={`text-sm hidden sm:inline ${clearanceTheme.fontStyle}`}>
            {clearanceTheme.id === 'foundation' ? 'Foundation' : 'Corp'}
          </span>
        </button>

        <div className="w-px h-6 bg-white/10" />

        <div className="flex items-center gap-1 px-1">
          {PINNED_APPS.map(appId => {
            const app = apps.find(a => a.id === appId);
            if (!app) return null;
            const isOpen = windows.some(w => w.id === appId);
            return (
              <motion.button
                key={appId}
                onClick={() => onAppClick(app)}
                whileHover={{ scale: 1.1, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="w-7 h-7 rounded-md flex items-center justify-center relative transition-colors"
                style={{ 
                  background: isOpen ? `${clearanceTheme.accent}20` : 'rgba(255,255,255,0.05)',
                  border: isOpen ? `1px solid ${clearanceTheme.accent}40` : '1px solid transparent'
                }}
                data-testid={`dock-${appId}`}
              >
                <div 
                  className="w-4 h-4 flex items-center justify-center [&>svg]:w-4 [&>svg]:h-4" 
                  style={{ color: isOpen ? clearanceTheme.accent : 'rgba(255,255,255,0.7)' }}
                >
                  {app.icon}
                </div>
                {isOpen && (
                  <div 
                    className="absolute -bottom-1 w-1 h-1 rounded-full"
                    style={{ background: clearanceTheme.accent }}
                  />
                )}
              </motion.button>
            );
          })}
        </div>

        <div className="w-px h-6 bg-white/10" />

        <div className="flex-1 flex items-center gap-1 overflow-x-auto">
          {windows.map(window => (
            <motion.button
              key={window.id}
              onClick={() => onWindowClick(window.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`h-8 px-3 flex flex-col items-center justify-center gap-0.5 rounded transition-colors min-w-0 relative ${
                activeWindowId === window.id && !window.minimized
                  ? 'bg-cyan-500/20 text-cyan-400'
                  : window.minimized ? 'bg-white/5 text-white/40 hover:bg-white/10' : 'bg-white/10 text-white/80 hover:bg-white/15'
              }`}
              data-testid={`taskbar-${window.id}`}
            >
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 flex-shrink-0">{window.icon}</div>
                <span className="text-xs font-mono truncate max-w-[100px]">{window.title}</span>
              </div>
              <div className={`absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full transition-colors ${
                !window.minimized ? 'bg-cyan-400' : 'bg-transparent'
              }`} />
            </motion.button>
          ))}
        </div>

        <div className="flex items-center gap-1 mr-2">
          {[0, 1, 2, 3].map(d => (
            <button
              key={d}
              onClick={() => onDesktopChange(d)}
              className={`relative w-7 h-5 rounded text-[10px] font-mono transition-all ${
                currentDesktop === d 
                  ? 'bg-cyan-500 text-white scale-110' 
                  : 'bg-white/10 text-white/40 hover:bg-white/20'
              }`}
              title={`Desktop ${d + 1}${(desktopWindowCounts?.[d] || 0) > 0 ? ` (${desktopWindowCounts[d]} windows)` : ''}`}
            >
              {d + 1}
              {(desktopWindowCounts?.[d] || 0) > 0 && currentDesktop !== d && (
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-cyan-400 rounded-full" />
              )}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1 text-white/60 relative">
          <button 
            onClick={() => onTrayPanelToggle('notifications')} 
            className={`p-1.5 rounded transition-colors relative ${activeTrayPanel === 'notifications' ? 'bg-white/20 text-white' : 'hover:bg-white/10'}`}
          >
            <Bell className="w-4 h-4" />
            {notifications.length > 0 && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full text-[8px] text-white flex items-center justify-center">
                {notifications.length}
              </div>
            )}
          </button>
          <button 
            onClick={() => onTrayPanelToggle('wifi')} 
            className={`p-1.5 rounded transition-colors ${activeTrayPanel === 'wifi' ? 'bg-white/20 text-white' : 'hover:bg-white/10'}`}
          >
            <Wifi className="w-4 h-4" />
          </button>
          <button 
            onClick={() => onTrayPanelToggle('volume')} 
            className={`p-1.5 rounded transition-colors ${activeTrayPanel === 'volume' ? 'bg-white/20 text-white' : 'hover:bg-white/10'}`}
          >
            {isMuted ? <Volume2 className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <button 
            onClick={() => onTrayPanelToggle('battery')} 
            className={`p-1.5 rounded transition-colors ${activeTrayPanel === 'battery' ? 'bg-white/20 text-white' : 'hover:bg-white/10'}`}
          >
            <Battery className={`w-4 h-4 ${batteryInfo?.charging ? 'text-green-400' : batteryInfo && batteryInfo.level < 20 ? 'text-red-400' : ''}`} />
          </button>
          <div className="text-xs font-mono px-2">
            {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>

          <AnimatePresence>
            {activeTrayPanel === 'notifications' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute bottom-10 right-0 w-72 bg-slate-900/95 backdrop-blur-xl border border-cyan-500/30 rounded-lg shadow-2xl overflow-hidden"
                style={{ zIndex: 9999 }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-3 border-b border-cyan-500/20 flex items-center justify-between">
                  <span className="text-white text-sm font-mono">Notifications</span>
                  {notifications.length > 0 && (
                    <button onClick={onClearAllNotifications} className="text-xs text-cyan-400 hover:text-cyan-300">
                      Clear all
                    </button>
                  )}
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-white/50 text-sm">No notifications</div>
                  ) : (
                    notifications.map((notif, idx) => (
                      <div key={idx} className="p-3 border-b border-white/5 hover:bg-white/5 flex items-start gap-3">
                        <Bell className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                        <p className="text-white/80 text-sm flex-1">{notif}</p>
                        <button onClick={() => onClearNotification(idx)} className="text-white/30 hover:text-white/60">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}

            {activeTrayPanel === 'wifi' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute bottom-10 right-0 w-64 bg-slate-900/95 backdrop-blur-xl border border-cyan-500/30 rounded-lg shadow-2xl overflow-hidden"
                style={{ zIndex: 9999 }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-3 border-b border-cyan-500/20">
                  <span className="text-white text-sm font-mono">Network Status</span>
                </div>
                <div className="p-4 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                      <Wifi className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div>
                      <div className="text-white text-sm font-medium">AeThex Network</div>
                      <div className="text-cyan-400 text-xs">Connected</div>
                    </div>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between text-white/60">
                      <span>Signal Strength</span>
                      <span className="text-cyan-400">Excellent</span>
                    </div>
                    <div className="flex justify-between text-white/60">
                      <span>Protocol</span>
                      <span className="text-white">AEGIS-256</span>
                    </div>
                    <div className="flex justify-between text-white/60">
                      <span>Latency</span>
                      <span className="text-green-400">2ms</span>
                    </div>
                    <div className="flex justify-between text-white/60">
                      <span>Node</span>
                      <span className="text-white">AXIOM-CORE-01</span>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-white/10">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                      <span className="text-green-400 text-xs">Secure Connection Active</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTrayPanel === 'volume' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute bottom-10 right-0 w-56 bg-slate-900/95 backdrop-blur-xl border border-cyan-500/30 rounded-lg shadow-2xl overflow-hidden"
                style={{ zIndex: 9999 }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-3 border-b border-cyan-500/20">
                  <span className="text-white text-sm font-mono">Sound</span>
                </div>
                <div className="p-4 space-y-4">
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={onMuteToggle}
                      className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${isMuted ? 'bg-red-500/20' : 'bg-cyan-500/20'}`}
                    >
                      <Volume2 className={`w-5 h-5 ${isMuted ? 'text-red-400' : 'text-cyan-400'}`} />
                    </button>
                    <div className="flex-1">
                      <div className="text-white text-sm font-medium">{isMuted ? 'Muted' : 'Volume'}</div>
                      <div className="text-white/50 text-xs">{isMuted ? 'Click to unmute' : `${volume}%`}</div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      value={volume}
                      onChange={(e) => onVolumeChange(parseInt(e.target.value))}
                      className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                      style={{ accentColor: '#06b6d4' }}
                    />
                    <div className="flex justify-between text-[10px] text-white/40">
                      <span>0</span>
                      <span>50</span>
                      <span>100</span>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-white/10 text-xs text-white/50">
                    <div className="flex items-center justify-between">
                      <span>OS Sounds</span>
                      <span className={isMuted ? 'text-red-400' : 'text-cyan-400'}>{isMuted ? 'OFF' : 'ON'}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTrayPanel === 'battery' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute bottom-10 right-0 w-56 bg-slate-900/95 backdrop-blur-xl border border-cyan-500/30 rounded-lg shadow-2xl overflow-hidden"
                style={{ zIndex: 9999 }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-3 border-b border-cyan-500/20">
                  <span className="text-white text-sm font-mono">Power</span>
                </div>
                <div className="p-4 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${batteryInfo?.charging ? 'bg-green-500/20' : 'bg-cyan-500/20'}`}>
                      <Battery className={`w-5 h-5 ${batteryInfo?.charging ? 'text-green-400' : 'text-cyan-400'}`} />
                    </div>
                    <div>
                      <div className="text-white text-sm font-medium">
                        {batteryInfo ? `${batteryInfo.level}%` : 'Unknown'}
                      </div>
                      <div className={`text-xs ${batteryInfo?.charging ? 'text-green-400' : 'text-white/50'}`}>
                        {batteryInfo?.charging ? 'Charging' : 'On Battery'}
                      </div>
                    </div>
                  </div>
                  {batteryInfo && (
                    <div className="space-y-2">
                      <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all ${
                            batteryInfo.level > 50 ? 'bg-green-500' : 
                            batteryInfo.level > 20 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${batteryInfo.level}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-white/40">
                        <span>0%</span>
                        <span>50%</span>
                        <span>100%</span>
                      </div>
                    </div>
                  )}
                  {!batteryInfo && (
                    <div className="text-center text-white/50 text-sm py-2">
                      Battery API not available
                    </div>
                  )}
                  <div className="pt-2 border-t border-white/10 space-y-1 text-xs">
                    <div className="flex items-center justify-between text-white/60">
                      <span>Power Mode</span>
                      <span className="text-cyan-400">Balanced</span>
                    </div>
                    <div className="flex items-center justify-between text-white/60">
                      <span>Status</span>
                      <span className="text-green-400">Optimal</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
}

function TerminalApp() {
  const ASCII_BANNER = [
    "    _    _____ _____ _   _ _______  __",
    "   / \\  | ____|_   _| | | | ____\\ \\/ /",
    "  / _ \\ |  _|   | | | |_| |  _|  \\  / ",
    " / ___ \\| |___  | | |  _  | |___ /  \\ ",
    "/_/   \\_\\_____| |_| |_| |_|_____/_/\\_\\",
    "",
  ];
  const [history, setHistory] = useState<string[]>([...ASCII_BANNER, "AeThex Terminal v3.0.0 - Secure Shell", "Type 'help' for available commands.", ""]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const terminalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [history]);

  const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

  const typeEffect = async (lines: string[], setFn: React.Dispatch<React.SetStateAction<string[]>>) => {
    for (const line of lines) {
      setFn(prev => [...prev, line]);
      await delay(50);
    }
  };

  const progressBar = async (label: string, steps = 10) => {
    for (let i = 0; i <= steps; i++) {
      const pct = Math.round((i / steps) * 100);
      const bar = '█'.repeat(i) + '░'.repeat(steps - i);
      setHistory(prev => {
        const newHist = [...prev];
        if (newHist.length > 0 && newHist[newHist.length - 1].startsWith(label)) {
          newHist[newHist.length - 1] = `${label} [${bar}] ${pct}%`;
        } else {
          newHist.push(`${label} [${bar}] ${pct}%`);
        }
        return newHist;
      });
      await delay(100);
    }
  };

  const runCommand = async (cmd: string): Promise<void> => {
    const args = cmd.split(' ');
    const baseCmd = args[0];

    switch (baseCmd) {
      case 'help':
        await typeEffect([
          "╔═══════════════════════════════════════════╗",
          "║         AETHEX TERMINAL COMMANDS          ║",
          "╠═══════════════════════════════════════════╣",
          "║ status     - System status from server    ║",
          "║ architects - List architects in network   ║",
          "║ projects   - List active projects         ║",
          "║ scan       - Scan network for nodes       ║",
          "║ analyze    - Run security analysis        ║",
          "║ ping       - Check network status         ║",
          "║ whois      - Look up architect profile    ║",
          "║ decrypt    - Decrypt secure message       ║",
          "║ hack       - ??? (try it)                 ║",
          "║ fortune    - Random architect wisdom      ║",
          "║ whoami     - Current user info            ║",
          "║ neofetch   - System information           ║",
          "║ matrix     - Enter the matrix             ║",
          "║ clear      - Clear terminal               ║",
          "║ tour       - AeThex guided tour           ║",
          "╠═══════════════════════════════════════════╣",
          "║ dice       - Roll two dice                ║",
          "║ cowsay     - Make a cow say something     ║",
          "║ joke       - Tell a programmer joke       ║",
          "║ weather    - Metaverse weather report     ║",
          "║ uptime     - System uptime                ║",
          "║ banner     - Show AeThex banner           ║",
          "║ coffee     - Brew some coffee             ║",
          "╚═══════════════════════════════════════════╝",
          ""
        ], setHistory);
        break;

      case 'status':
        try {
          setHistory(prev => [...prev, "Fetching system status..."]);
          await delay(300);
          const res = await fetch('/api/metrics');
          const data = await res.json();
          await typeEffect([
            "┌─────────────────────────────────┐",
            "│       SYSTEM STATUS             │",
            "├─────────────────────────────────┤",
            `│ Architects: ${String(data.totalProfiles || 0).padEnd(18)}│`,
            `│ Projects:   ${String(data.totalProjects || 0).padEnd(18)}│`,
            `│ Online:     ${String(data.onlineUsers || 0).padEnd(18)}│`,
            `│ Verified:   ${String(data.verifiedUsers || 0).padEnd(18)}│`,
            `│ Total XP:   ${String(data.totalXP || 0).padEnd(18)}│`,
            "└─────────────────────────────────┘",
            ""
          ], setHistory);
        } catch {
          setHistory(prev => [...prev, "ERROR: Failed to fetch status", ""]);
        }
        break;

      case 'architects':
        try {
          setHistory(prev => [...prev, "Querying architect database..."]);
          await delay(400);
          const res = await fetch('/api/os/architects');
          const data = await res.json();
          if (!data.length) {
            setHistory(prev => [...prev, "No architects found in network.", ""]);
            return;
          }
          const lines = ["", "ARCHITECTS IN NETWORK:", "─".repeat(40)];
          data.forEach((a: any) => {
            const status = a.verified ? '\x1b[32m●\x1b[0m' : '\x1b[33m○\x1b[0m';
            lines.push(`  ${a.username || 'Unknown'} │ Lv.${a.level} │ ${a.xp} XP ${a.verified ? '[VERIFIED]' : ''}`);
          });
          lines.push("─".repeat(40), "");
          await typeEffect(lines, setHistory);
        } catch {
          setHistory(prev => [...prev, "ERROR: Database connection failed", ""]);
        }
        break;

      case 'projects':
        try {
          setHistory(prev => [...prev, "Loading project registry..."]);
          await delay(300);
          const res = await fetch('/api/os/projects');
          const data = await res.json();
          if (!data.length) {
            setHistory(prev => [...prev, "No projects found.", ""]);
            return;
          }
          const lines = ["", "ACTIVE PROJECTS:", "─".repeat(50)];
          data.forEach((p: any) => {
            const statusColor = p.status === 'active' ? '[ACTIVE]' : `[${(p.status || 'unknown').toUpperCase()}]`;
            lines.push(`  ► ${p.title} ${statusColor}${p.engine ? ` - ${p.engine}` : ''}`);
          });
          lines.push("─".repeat(50), "");
          await typeEffect(lines, setHistory);
        } catch {
          setHistory(prev => [...prev, "ERROR: Registry unavailable", ""]);
        }
        break;

      case 'scan':
        setHistory(prev => [...prev, "Initiating network scan..."]);
        await delay(200);
        await progressBar("SCANNING", 15);
        await delay(300);
        const nodes = Math.floor(Math.random() * 20) + 10;
        await typeEffect([
          "",
          `Scan complete. ${nodes} nodes discovered.`,
          "",
          "  NODE-001 ─── AEGIS-CORE ─── [SECURE]",
          "  NODE-002 ─── CODEX-AUTH ─── [SECURE]",
          "  NODE-003 ─── AXIOM-DB ───── [SECURE]",
          `  ... ${nodes - 3} additional nodes`,
          "",
          "All systems operational. No threats detected.",
          ""
        ], setHistory);
        break;

      case 'analyze':
        setHistory(prev => [...prev, "Running security analysis..."]);
        await progressBar("ANALYZING", 20);
        await delay(200);
        await typeEffect([
          "",
          "╔═══════════════════════════════════════╗",
          "║       SECURITY ANALYSIS REPORT        ║",
          "╠═══════════════════════════════════════╣",
          "║ Firewall Status:      ██████████ 100% ║",
          "║ Encryption Level:     ██████████ AES  ║",
          "║ Intrusion Attempts:   0 BLOCKED       ║",
          "║ AEGIS Shield:         ACTIVE          ║",
          "╚═══════════════════════════════════════╝",
          "",
          "System integrity: VERIFIED",
          ""
        ], setHistory);
        break;

      case 'decrypt':
        setHistory(prev => [...prev, "Decrypting secure message..."]);
        await progressBar("DECRYPTING", 12);
        await delay(500);
        const messages = [
          "The future belongs to those who build it.",
          "In the Metaverse, architects are gods.",
          "AEGIS protects. CODEX certifies. AXIOM guides.",
          "Welcome to the new reality, Architect.",
        ];
        const msg = messages[Math.floor(Math.random() * messages.length)];
        await typeEffect([
          "",
          "MESSAGE DECRYPTED:",
          `"${msg}"`,
          ""
        ], setHistory);
        break;

      case 'hack':
        setHistory(prev => [...prev, "Initiating hack sequence..."]);
        await delay(300);
        const hackLines = [];
        for (let i = 0; i < 8; i++) {
          let line = "";
          for (let j = 0; j < 40; j++) {
            line += String.fromCharCode(Math.floor(Math.random() * 26) + 65);
          }
          hackLines.push(line);
        }
        await typeEffect(hackLines, setHistory);
        await delay(500);
        await typeEffect([
          "",
          "ACCESS DENIED",
          "",
          "Nice try, but AEGIS is watching.",
          "This incident has been logged. 👁️",
          ""
        ], setHistory);
        break;

      case 'fortune':
        const fortunes = [
          "A great architect once said: 'First, solve the problem. Then, write the code.'",
          "The Metaverse remembers those who build with purpose.",
          "Your next commit will be legendary.",
          "Trust in AEGIS, for it watches over all.",
          "Level up, Architect. The network awaits your greatness.",
          "In the digital realm, creativity is the ultimate currency.",
        ];
        setHistory(prev => [...prev, "", `🔮 ${fortunes[Math.floor(Math.random() * fortunes.length)]}`, ""]);
        break;

      case 'whoami':
        await typeEffect([
          "",
          "╭──────────────────────────────────╮",
          "│ USER: architect@aethex-os        │",
          "│ ROLE: Metaverse Architect        │",
          "│ CLEARANCE: LEVEL-7               │",
          "│ STATUS: ACTIVE                   │",
          "╰──────────────────────────────────╯",
          ""
        ], setHistory);
        break;

      case 'neofetch':
        await typeEffect([
          "",
          "       ▄▄▄       .▄▄ · ▄▄▄▄▄▄ .▄▄▄▄ ▄▄▄ .▐▄• ▄ ",
          "      ▐█ ▀█     ▐█ ▀. •██  █▌·▐█ ▀█ █▌•█▌ █▌█▌▪",
          "      ▄█▀▀█     ▄▀▀▀█▄ ▐█. ▐▀▀▀ ██▀ ▐█ ▐█▌ ·██· ",
          "      ██ ▪▄▌    ▐█▄▪▐█ ▐█▌·▐█▄▄▌██  ██▪▪▐█·█▌  ",
          "       ▀▀▀▀      ▀▀▀▀  ▀▀▀  ▀▀▀ ▀▀▀ ▀▀ ▀▀▀ ·   ",
          "───────────────────────────────────────────────",
          "  OS:        AeThex OS v3.0.0",
          "  Kernel:    AEGIS-CORE 2025.12",
          "  Shell:     aethex-terminal",
          "  CPU:       Quantum Neural Net @ ∞GHz",
          "  Memory:    ∞ PB / ∞ PB",
          "  Uptime:    Always",
          ""
        ], setHistory);
        break;

      case 'matrix':
        await typeEffect([
          "",
          "Wake up, Architect...",
          "",
          "The Matrix has you...",
          ""
        ], setHistory);
        await delay(1000);
        setHistory(prev => [...prev, "Follow the white rabbit.", "", "🐇", ""]);
        break;

      case 'tour':
        await typeEffect([
          "",
          "════════════════════════════════════════════",
          "         WELCOME TO AETHEX ECOSYSTEM        ",
          "════════════════════════════════════════════",
          "",
          "► AXIOM - The foundational layer",
          "  Core principles and values that guide",
          "  everything we build in the Metaverse.",
          "",
          "► CODEX - The certification system",
          "  Earn credentials, level up, and prove",
          "  your expertise as a Metaverse Architect.",
          "",
          "► AEGIS - The security shield", 
          "  Advanced protection layer keeping the",
          "  ecosystem safe from threats.",
          "",
          "Explore the OS apps to learn more!",
          ""
        ], setHistory);
        break;

      case 'sudo':
        if (args[1] === 'unlock' && args[2] === 'secrets') {
          setHistory(prev => [...prev, "Verifying administrator credentials..."]);
          await progressBar("UNLOCKING", 15);
          await delay(500);
          window.dispatchEvent(new CustomEvent('aethex-unlock-secrets'));
          await typeEffect([
            "",
            "╔═══════════════════════════════════════════╗",
            "║         🎉 SECRETS UNLOCKED! 🎉           ║",
            "╠═══════════════════════════════════════════╣",
            "║ New wallpapers are now available in       ║",
            "║ Settings. Congratulations, Architect!     ║",
            "╚═══════════════════════════════════════════╝",
            ""
          ], setHistory);
        } else {
          setHistory(prev => [...prev, "Usage: sudo unlock secrets", ""]);
        }
        break;

      case 'secret':
        await typeEffect([
          "",
          "🔐 SECRET COMMANDS:",
          "  - sudo unlock secrets : Unlock hidden features",
          "  - Try the Konami Code on the desktop",
          "  - ↑↑↓↓←→←→BA",
          ""
        ], setHistory);
        break;

      case 'dice':
        const d1 = Math.floor(Math.random() * 6) + 1;
        const d2 = Math.floor(Math.random() * 6) + 1;
        const diceArt: Record<number, string[]> = {
          1: ["┌───────┐", "│       │", "│   ●   │", "│       │", "└───────┘"],
          2: ["┌───────┐", "│ ●     │", "│       │", "│     ● │", "└───────┘"],
          3: ["┌───────┐", "│ ●     │", "│   ●   │", "│     ● │", "└───────┘"],
          4: ["┌───────┐", "│ ●   ● │", "│       │", "│ ●   ● │", "└───────┘"],
          5: ["┌───────┐", "│ ●   ● │", "│   ●   │", "│ ●   ● │", "└───────┘"],
          6: ["┌───────┐", "│ ●   ● │", "│ ●   ● │", "│ ●   ● │", "└───────┘"],
        };
        await typeEffect(["", "🎲 Rolling dice..."], setHistory);
        await delay(500);
        for (let i = 0; i < 5; i++) {
          await typeEffect([`  ${diceArt[d1][i]}  ${diceArt[d2][i]}`], setHistory);
        }
        await typeEffect([``, `Result: ${d1} + ${d2} = ${d1 + d2}`, ""], setHistory);
        break;

      case 'cowsay':
        const cowMsg = args.slice(1).join(' ') || 'Hello, Architect!';
        const border = '─'.repeat(cowMsg.length + 2);
        await typeEffect([
          "",
          `┌${border}┐`,
          `│ ${cowMsg} │`,
          `└${border}┘`,
          "        \\   ^__^",
          "         \\  (oo)\\_______",
          "            (__)\\       )\\/\\",
          "                ||----w |",
          "                ||     ||",
          ""
        ], setHistory);
        break;

      case 'joke':
        const jokes = [
          { q: "Why do programmers prefer dark mode?", a: "Because light attracts bugs." },
          { q: "Why did the developer go broke?", a: "Because he used up all his cache." },
          { q: "What's a programmer's favorite hangout place?", a: "Foo Bar." },
          { q: "Why do Java developers wear glasses?", a: "Because they can't C#." },
        ];
        const joke = jokes[Math.floor(Math.random() * jokes.length)];
        await typeEffect(["", `Q: ${joke.q}`], setHistory);
        await delay(1500);
        await typeEffect([`A: ${joke.a}`, ""], setHistory);
        break;

      case 'weather':
        const conditions = ['☀️ Sunny', '🌤️ Partly Cloudy', '☁️ Cloudy', '🌧️ Rainy', '⚡ Thunderstorms', '🌈 Rainbow'];
        const temp = Math.floor(Math.random() * 30) + 15;
        await typeEffect([
          "",
          "┌────────────────────────────┐",
          "│    METAVERSE WEATHER       │",
          "├────────────────────────────┤",
          `│  ${conditions[Math.floor(Math.random() * conditions.length)].padEnd(24)}│`,
          `│  Temperature: ${temp}°C       │`,
          "│  Humidity: Always optimal  │",
          "│  Wind: Digital breeze      │",
          "└────────────────────────────┘",
          ""
        ], setHistory);
        break;

      case 'uptime':
        const days = Math.floor(Math.random() * 365) + 100;
        const hours = Math.floor(Math.random() * 24);
        await typeEffect([
          "",
          `System uptime: ${days} days, ${hours} hours`,
          "The Metaverse never sleeps.",
          ""
        ], setHistory);
        break;

      case 'banner':
        await typeEffect([
          "",
          "█████╗ ███████╗████████╗██╗  ██╗███████╗██╗  ██╗",
          "██╔══██╗██╔════╝╚══██╔══╝██║  ██║██╔════╝╚██╗██╔╝",
          "███████║█████╗     ██║   ███████║█████╗   ╚███╔╝ ",
          "██╔══██║██╔══╝     ██║   ██╔══██║██╔══╝   ██╔██╗ ",
          "██║  ██║███████╗   ██║   ██║  ██║███████╗██╔╝ ██╗",
          "╚═╝  ╚═╝╚══════╝   ╚═╝   ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝",
          "",
          "       Operating System for the Metaverse",
          ""
        ], setHistory);
        break;

      case 'coffee':
        await typeEffect([
          "",
          "    ( (",
          "     ) )",
          "  ........",
          "  |      |]",
          "  \\      /",
          "   `----'",
          "",
          "☕ Coffee brewed! Stay caffeinated, Architect.",
          ""
        ], setHistory);
        break;

      case 'ping':
        await typeEffect(["", "Pinging AeThex Network..."], setHistory);
        await delay(500);
        await typeEffect([
          "PING aethex.network (42.42.42.42): 56 data bytes",
          "64 bytes from 42.42.42.42: icmp_seq=0 ttl=64 time=0.042 ms",
          "64 bytes from 42.42.42.42: icmp_seq=1 ttl=64 time=0.037 ms",
          "64 bytes from 42.42.42.42: icmp_seq=2 ttl=64 time=0.041 ms",
          "",
          "--- aethex.network ping statistics ---",
          "3 packets transmitted, 3 packets received, 0.0% packet loss",
          "",
          "✓ AeThex Network: ONLINE",
          ""
        ], setHistory);
        break;

      case 'whois':
        const target = args[1]?.toLowerCase();
        if (target === 'mrpiglr') {
          await typeEffect([
            "",
            "╔══════════════════════════════════════════════════╗",
            "║              ARCHITECT PROFILE                   ║",
            "╠══════════════════════════════════════════════════╣",
            "║ CODENAME:    mrpiglr                             ║",
            "║ REAL NAME:   [CLASSIFIED]                        ║",
            "║ ROLE:        Founder & Chief Architect           ║",
            "║ CLEARANCE:   OVERSEE (Highest)                   ║",
            "║ STATUS:      ACTIVE                              ║",
            "╠══════════════════════════════════════════════════╣",
            "║ SKILLS:      Metaverse Architecture, Web3,       ║",
            "║              Game Development, System Design     ║",
            "╠══════════════════════════════════════════════════╣",
            "║ 'Building the operating system for               ║",
            "║  the Metaverse, one line at a time.'             ║",
            "╚══════════════════════════════════════════════════╝",
            ""
          ], setHistory);
        } else if (target === 'trevorjoey' || target === 'dylan' || target === 'fadedlatte') {
          await typeEffect([
            "",
            `╔══════════════════════════════════════════════════╗`,
            `║              ARCHITECT PROFILE                   ║`,
            `╠══════════════════════════════════════════════════╣`,
            `║ CODENAME:    ${(target || '').padEnd(35)}║`,
            `║ ROLE:        Founding Architect                  ║`,
            `║ CLEARANCE:   ADMIN                               ║`,
            `║ STATUS:      ACTIVE                              ║`,
            `╚══════════════════════════════════════════════════╝`,
            ""
          ], setHistory);
        } else {
          setHistory(prev => [...prev, "Usage: whois <username>", "Try: whois mrpiglr", ""]);
        }
        break;

      case 'foundry':
        await typeEffect([
          "",
          "╔══════════════════════════════════════════════════╗",
          "║        🔥 THE FOUNDRY - ARCHITECT BOOTCAMP       ║",
          "╠══════════════════════════════════════════════════╣",
          "║                                                  ║",
          "║  Transform yourself into a certified             ║",
          "║  Metaverse Architect in 8 weeks.                 ║",
          "║                                                  ║",
          "║  Learn: Game Dev, Web3, System Design            ║",
          "║                                                  ║",
          "║  Price: $500 (Limited Cohort)                    ║",
          "║                                                  ║",
          "║  Use code TERMINAL10 for 10% off!                ║",
          "║                                                  ║",
          "╠══════════════════════════════════════════════════╣",
          "║  Visit: aethex.studio                            ║",
          "╚══════════════════════════════════════════════════╝",
          ""
        ], setHistory);
        break;

      case 'discount':
        await typeEffect([
          "",
          "🎉 SECRET FOUND!",
          "",
          "Use code: TERMINAL10",
          "For 10% off The Foundry bootcamp!",
          "",
          "Visit aethex.studio to enroll.",
          ""
        ], setHistory);
        break;

      default:
        setHistory(prev => [...prev, `Command not found: ${cmd}`, "Type 'help' for available commands.", ""]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const newIndex = historyIndex < commandHistory.length - 1 ? historyIndex + 1 : historyIndex;
        setHistoryIndex(newIndex);
        setInput(commandHistory[commandHistory.length - 1 - newIndex] || '');
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setInput(commandHistory[commandHistory.length - 1 - newIndex] || '');
      } else {
        setHistoryIndex(-1);
        setInput('');
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const cmds = ['help', 'status', 'architects', 'projects', 'scan', 'analyze', 'decrypt', 'hack', 'fortune', 'whoami', 'neofetch', 'matrix', 'clear', 'tour', 'dice', 'cowsay', 'joke', 'weather', 'uptime', 'banner', 'coffee', 'sudo', 'secret', 'ping', 'whois', 'foundry', 'discount'];
      const match = cmds.find(c => c.startsWith(input.toLowerCase()));
      if (match) setInput(match);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = input.trim().toLowerCase();
    if (!cmd) return;
    setInput("");
    setHistoryIndex(-1);
    setCommandHistory(prev => [...prev, cmd]);
    
    if (cmd === 'clear') {
      setHistory([]);
      return;
    }
    
    setHistory(prev => [...prev, `$ ${input}`]);
    setIsLoading(true);
    await runCommand(cmd);
    setIsLoading(false);
  };

  return (
    <div ref={terminalRef} className="h-full bg-black p-4 font-mono text-sm text-green-400 overflow-auto" onClick={() => inputRef.current?.focus()}>
      {history.map((line, i) => (
        <div key={i} className={`whitespace-pre-wrap ${line.includes('ERROR') ? 'text-red-400' : line.includes('╔') || line.includes('╚') || line.includes('═') ? 'text-cyan-400' : ''}`}>
          {line}
        </div>
      ))}
      {isLoading && <div className="text-cyan-400 animate-pulse">Processing...</div>}
      <form onSubmit={handleSubmit} className="flex items-center mt-1">
        <span className="text-cyan-400">$</span>
        <input 
          ref={inputRef}
          value={input} 
          onChange={(e) => setInput(e.target.value)} 
          onKeyDown={handleKeyDown}
          className="flex-1 ml-2 bg-transparent outline-none text-green-400 caret-green-400" 
          autoFocus 
          disabled={isLoading} 
          data-testid="terminal-input" 
          autoComplete="off"
          spellCheck={false}
        />
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

function SettingsApp({ wallpaper, setWallpaper, soundEnabled, setSoundEnabled, secretsUnlocked, theme, setTheme, savedLayouts, onSaveLayout, onLoadLayout, onDeleteLayout }: { 
  wallpaper: typeof WALLPAPERS[0]; 
  setWallpaper: (w: typeof WALLPAPERS[0]) => void;
  soundEnabled: boolean;
  setSoundEnabled: (v: boolean) => void;
  secretsUnlocked: boolean;
  theme: ThemeSettings;
  setTheme: (t: ThemeSettings) => void;
  savedLayouts: DesktopLayout[];
  onSaveLayout: (name: string) => void;
  onLoadLayout: (layout: DesktopLayout) => void;
  onDeleteLayout: (name: string) => void;
}) {
  const [layoutName, setLayoutName] = useState('');
  const [activeTab, setActiveTab] = useState<'appearance' | 'layouts' | 'system'>('appearance');
  const visibleWallpapers = WALLPAPERS.filter(wp => !wp.secret || secretsUnlocked);
  
  return (
    <div className="h-full bg-slate-950 flex flex-col">
      <div className="flex border-b border-white/10">
        {(['appearance', 'layouts', 'system'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-3 text-sm font-mono uppercase tracking-wider transition-colors ${
              activeTab === tab ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-white/50 hover:text-white/80'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="flex-1 p-6 overflow-auto">
        {activeTab === 'appearance' && (
          <div className="space-y-6">
            <div>
              <div className="text-xs text-white/50 uppercase tracking-wider mb-3">
                Accent Color
              </div>
              <div className="flex gap-2 flex-wrap">
                {ACCENT_COLORS.map(color => (
                  <button
                    key={color.id}
                    onClick={() => setTheme({ ...theme, accentColor: color.id })}
                    className={`w-10 h-10 rounded-full transition-all ${color.bg} ${
                      theme.accentColor === color.id ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-950 scale-110' : 'hover:scale-105'
                    }`}
                    title={color.name}
                  />
                ))}
              </div>
            </div>

            <div>
              <div className="text-xs text-white/50 uppercase tracking-wider mb-3">
                Theme Mode
              </div>
              <div className="flex gap-2">
                {(['dark', 'light', 'system'] as const).map(mode => (
                  <button
                    key={mode}
                    onClick={() => setTheme({ ...theme, mode })}
                    className={`px-4 py-2 rounded-lg text-sm font-mono capitalize transition-colors ${
                      theme.mode === mode ? 'bg-cyan-500 text-white' : 'bg-white/10 text-white/70 hover:bg-white/20'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
              <div className="text-white/30 text-xs mt-2">Note: Light mode is preview only</div>
            </div>

            <div>
              <div className="text-xs text-white/50 uppercase tracking-wider mb-3">
                Wallpaper {secretsUnlocked && <span className="text-yellow-400 ml-2">✨ UNLOCKED</span>}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {visibleWallpapers.map(wp => (
                  <button
                    key={wp.id}
                    onClick={() => setWallpaper(wp)}
                    className={`p-3 rounded-lg border transition-colors ${wallpaper.id === wp.id ? 'border-cyan-500 bg-cyan-500/10' : wp.secret ? 'border-yellow-500/30 hover:border-yellow-500/50' : 'border-white/10 hover:border-white/20'}`}
                  >
                    <div className="w-full h-12 rounded mb-2" style={{ background: wp.bg }} />
                    <div className="text-xs text-white/80">{wp.name}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="text-xs text-white/50 uppercase tracking-wider mb-3">
                Transparency
              </div>
              <input
                type="range"
                min="50"
                max="100"
                value={theme.transparency}
                onChange={e => setTheme({ ...theme, transparency: parseInt(e.target.value) })}
                className="w-full accent-cyan-500"
              />
              <div className="flex justify-between text-xs text-white/40 mt-1">
                <span>More glass</span>
                <span>{theme.transparency}%</span>
                <span>More solid</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'layouts' && (
          <div className="space-y-6">
            <div>
              <div className="text-xs text-white/50 uppercase tracking-wider mb-3">Save Current Layout</div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={layoutName}
                  onChange={e => setLayoutName(e.target.value)}
                  placeholder="Layout name..."
                  className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:border-cyan-500 focus:outline-none"
                />
                <button
                  onClick={() => { if (layoutName.trim()) { onSaveLayout(layoutName.trim()); setLayoutName(''); }}}
                  className="px-4 py-2 bg-cyan-500 text-white rounded-lg text-sm hover:bg-cyan-400 transition-colors"
                >
                  Save
                </button>
              </div>
            </div>

            <div>
              <div className="text-xs text-white/50 uppercase tracking-wider mb-3">Saved Layouts</div>
              {savedLayouts.length === 0 ? (
                <div className="text-white/30 text-sm p-4 text-center bg-white/5 rounded-lg">
                  No saved layouts yet. Arrange your windows and save a layout above.
                </div>
              ) : (
                <div className="space-y-2">
                  {savedLayouts.map(layout => (
                    <div key={layout.name} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
                      <div>
                        <div className="text-white text-sm font-mono">{layout.name}</div>
                        <div className="text-white/40 text-xs">{layout.windows.length} windows • Desktop {layout.desktop + 1}</div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => onLoadLayout(layout)} className="px-3 py-1 bg-cyan-500/20 text-cyan-400 rounded text-xs hover:bg-cyan-500/30">
                          Load
                        </button>
                        <button onClick={() => onDeleteLayout(layout.name)} className="px-3 py-1 bg-red-500/20 text-red-400 rounded text-xs hover:bg-red-500/30">
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'system' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
              <div>
                <div className="text-white text-sm">Sound Effects</div>
                <div className="text-white/50 text-xs">UI interaction feedback</div>
              </div>
              <button onClick={() => setSoundEnabled(!soundEnabled)} className={`w-10 h-6 rounded-full relative transition-colors ${soundEnabled ? 'bg-cyan-500' : 'bg-slate-600'}`}>
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${soundEnabled ? 'right-1' : 'left-1'}`} />
              </button>
            </div>
            
            <div className="p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
              <div className="text-cyan-400 text-sm font-mono">AeThex OS v3.0.0</div>
              <div className="text-white/50 text-xs mt-1">Build 2025.12.17</div>
            </div>

            {!secretsUnlocked && (
              <div className="p-3 bg-white/5 border border-white/10 rounded-lg text-center">
                <div className="text-white/40 text-xs font-mono">🔒 Hidden features available...</div>
                <div className="text-white/20 text-[10px] mt-1">Try the Konami Code or find secrets in Terminal</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function NetworkMapApp() {
  const { data: architects } = useQuery({
    queryKey: ['os-network-architects'],
    queryFn: async () => {
      const res = await fetch('/api/os/architects');
      return res.json();
    },
  });

  const nodes = architects?.slice(0, 8) || [];

  return (
    <div className="h-full bg-slate-950 p-4 overflow-hidden relative">
      <div className="flex items-center gap-2 mb-4">
        <Network className="w-5 h-5 text-cyan-400" />
        <h2 className="text-lg font-display text-white uppercase tracking-wider">Network Map</h2>
      </div>
      
      <div className="relative h-[calc(100%-60px)] flex items-center justify-center">
        <div className="absolute inset-0 opacity-20">
          <svg className="w-full h-full">
            {nodes.map((_: any, i: number) => {
              const angle = (i / nodes.length) * 2 * Math.PI;
              const x1 = 50 + 35 * Math.cos(angle);
              const y1 = 50 + 35 * Math.sin(angle);
              return (
                <line key={i} x1="50%" y1="50%" x2={`${x1}%`} y2={`${y1}%`} stroke="#22d3ee" strokeWidth="1" strokeDasharray="4,4" className="animate-pulse" />
              );
            })}
          </svg>
        </div>
        
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg shadow-cyan-500/30 z-10">
          <Server className="w-8 h-8 text-white" />
        </div>
        
        {nodes.map((node: any, i: number) => {
          const angle = (i / nodes.length) * 2 * Math.PI - Math.PI / 2;
          const radius = 140;
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;
          return (
            <motion.div
              key={node.id}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
              style={{ transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))` }}
            >
              <div className="flex flex-col items-center">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${node.verified ? 'bg-green-500/20 border-2 border-green-500' : 'bg-cyan-500/20 border border-cyan-500/50'}`}>
                  <User className="w-5 h-5 text-white" />
                </div>
                <div className="mt-1 text-xs text-white/70 font-mono truncate max-w-[80px]">{node.username}</div>
                <div className="text-[10px] text-cyan-400">Lv.{node.level}</div>
              </div>
            </motion.div>
          );
        })}
      </div>
      
      <div className="absolute bottom-4 left-4 text-xs text-white/40 font-mono">
        {nodes.length} nodes connected
      </div>
    </div>
  );
}

function MetricsDashboardApp() {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['os-dashboard-metrics'],
    queryFn: async () => {
      const res = await fetch('/api/metrics');
      return res.json();
    },
    refetchInterval: 30000,
  });

  const [animatedValues, setAnimatedValues] = useState({ profiles: 0, projects: 0, xp: 0 });

  useEffect(() => {
    if (metrics) {
      const duration = 1000;
      const steps = 20;
      const interval = duration / steps;
      let step = 0;
      const timer = setInterval(() => {
        step++;
        const progress = step / steps;
        setAnimatedValues({
          profiles: Math.round(progress * (metrics.totalProfiles || 0)),
          projects: Math.round(progress * (metrics.totalProjects || 0)),
          xp: Math.round(progress * (metrics.totalXP || 0)),
        });
        if (step >= steps) clearInterval(timer);
      }, interval);
      return () => clearInterval(timer);
    }
  }, [metrics]);

  if (isLoading) {
    return (
      <div className="h-full bg-slate-950 p-4">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-5 h-5 text-cyan-400" />
          <Skeleton className="h-6 w-32" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-28 rounded-lg" />
          <Skeleton className="h-28 rounded-lg" />
          <Skeleton className="h-28 rounded-lg" />
          <Skeleton className="h-28 rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-slate-950 p-4 overflow-auto">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-5 h-5 text-cyan-400" />
        <h2 className="text-lg font-display text-white uppercase tracking-wider">Live Metrics</h2>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-gradient-to-br from-cyan-500/20 to-cyan-500/5 rounded-lg p-4 border border-cyan-500/30">
          <div className="text-xs text-cyan-400 uppercase">Architects</div>
          <div className="text-3xl font-bold text-white font-mono">{animatedValues.profiles}</div>
          <div className="flex items-center gap-1 text-green-400 text-xs mt-1">
            <ArrowUp className="w-3 h-3" /> +{Math.floor(Math.random() * 5) + 1} today
          </div>
        </div>
        <div className="bg-gradient-to-br from-purple-500/20 to-purple-500/5 rounded-lg p-4 border border-purple-500/30">
          <div className="text-xs text-purple-400 uppercase">Projects</div>
          <div className="text-3xl font-bold text-white font-mono">{animatedValues.projects}</div>
          <div className="flex items-center gap-1 text-green-400 text-xs mt-1">
            <TrendingUp className="w-3 h-3" /> Active
          </div>
        </div>
        <div className="bg-gradient-to-br from-green-500/20 to-green-500/5 rounded-lg p-4 border border-green-500/30">
          <div className="text-xs text-green-400 uppercase">Total XP</div>
          <div className="text-3xl font-bold text-white font-mono">{animatedValues.xp.toLocaleString()}</div>
        </div>
        <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-500/5 rounded-lg p-4 border border-yellow-500/30">
          <div className="text-xs text-yellow-400 uppercase">Online</div>
          <div className="text-3xl font-bold text-white font-mono">{metrics?.onlineUsers || 0}</div>
          <div className="flex items-center gap-1 text-yellow-400 text-xs mt-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" /> Live
          </div>
        </div>
      </div>

      <div className="bg-white/5 rounded-lg p-4 border border-white/10">
        <div className="text-xs text-white/50 uppercase mb-3">Network Activity</div>
        <div className="flex items-end gap-1 h-24">
          {Array.from({ length: 20 }).map((_, i) => {
            const height = Math.random() * 80 + 20;
            return (
              <motion.div
                key={i}
                initial={{ height: 0 }}
                animate={{ height: `${height}%` }}
                transition={{ delay: i * 0.05, duration: 0.3 }}
                className="flex-1 bg-gradient-to-t from-cyan-500 to-purple-500 rounded-t"
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

function CodeEditorApp() {
  const defaultCode = `// AeThex Smart Contract
import { Aegis } from '@aethex/core';

interface Architect {
  id: string;
  level: number;
  xp: number;
  verified: boolean;
}

class MetaverseRegistry {
  private architects: Map<string, Architect>;
  
  constructor() {
    this.architects = new Map();
    Aegis.initialize();
  }
  
  async registerArchitect(
    address: string,
    credentials: Credential[]
  ): Promise<Architect> {
    const architect: Architect = {
      id: generateId(),
      level: 1,
      xp: 0,
      verified: false
    };
    
    await Aegis.verify(architect);
    this.architects.set(address, architect);
    
    return architect;
  }
}`;

  const [code, setCode] = useState(defaultCode);
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [autocompleteItems, setAutocompleteItems] = useState<string[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const keywords = ['const', 'let', 'var', 'function', 'class', 'interface', 'type', 'async', 'await', 
    'return', 'import', 'export', 'from', 'if', 'else', 'for', 'while', 'switch', 'case', 'break',
    'new', 'this', 'super', 'extends', 'implements', 'private', 'public', 'protected', 'static'];
  
  const snippets = ['console.log()', 'Aegis.verify()', 'Aegis.initialize()', 'generateId()', 
    'Promise<>', 'Map<>', 'Array<>', 'string', 'number', 'boolean'];

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = textareaRef.current?.selectionStart || 0;
      const end = textareaRef.current?.selectionEnd || 0;
      setCode(code.substring(0, start) + '  ' + code.substring(end));
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 2;
        }
      }, 0);
    } else if (e.ctrlKey && e.key === ' ') {
      e.preventDefault();
      const cursorIndex = textareaRef.current?.selectionStart || 0;
      const textBefore = code.substring(0, cursorIndex);
      const lastWord = textBefore.split(/[\s\n\(\)\{\}\[\];:,]/).pop() || '';
      const matches = [...keywords, ...snippets].filter(k => k.toLowerCase().startsWith(lastWord.toLowerCase()));
      setAutocompleteItems(matches.slice(0, 8));
      setShowAutocomplete(matches.length > 0);
    } else if (e.key === 'Escape') {
      setShowAutocomplete(false);
    }
  };

  const insertAutocomplete = (item: string) => {
    const cursorIndex = textareaRef.current?.selectionStart || 0;
    const textBefore = code.substring(0, cursorIndex);
    const lastWordMatch = textBefore.match(/[\w]+$/);
    const lastWordStart = lastWordMatch ? cursorIndex - lastWordMatch[0].length : cursorIndex;
    setCode(code.substring(0, lastWordStart) + item + code.substring(cursorIndex));
    setShowAutocomplete(false);
    textareaRef.current?.focus();
  };

  const updateCursorPos = () => {
    if (!textareaRef.current) return;
    const pos = textareaRef.current.selectionStart;
    const lines = code.substring(0, pos).split('\n');
    setCursorPos({ line: lines.length, col: (lines[lines.length - 1]?.length || 0) + 1 });
  };

  const highlightLine = (line: string) => {
    const parts: { text: string; color: string }[] = [];
    let remaining = line;
    
    const patterns = [
      { regex: /^(\/\/.*)$/, color: 'text-green-500' },
      { regex: /^(\s*)(import|export|from|as)(\s)/, color: 'text-purple-400', capture: 2 },
      { regex: /(interface|class|type|enum)(\s+)(\w+)/, colors: ['text-purple-400', '', 'text-yellow-300'] },
      { regex: /(const|let|var|function|async|await|return|if|else|for|while|new|this|private|public|static)/, color: 'text-purple-400' },
      { regex: /('[^']*'|"[^"]*"|`[^`]*`)/, color: 'text-orange-400' },
      { regex: /(\d+)/, color: 'text-cyan-300' },
      { regex: /(@\w+)/, color: 'text-yellow-400' },
    ];

    if (line.trim().startsWith('//')) {
      return [{ text: line, color: 'text-green-500' }];
    }

    let result = line;
    result = result.replace(/(import|export|from|as|interface|class|type|const|let|var|function|async|await|return|if|else|for|while|new|this|private|public|static|extends|implements)\b/g, 
      '<span class="text-purple-400">$1</span>');
    result = result.replace(/('[^']*'|"[^"]*"|`[^`]*`)/g, '<span class="text-orange-400">$1</span>');
    result = result.replace(/\b(\d+)\b/g, '<span class="text-cyan-300">$1</span>');
    result = result.replace(/(@\w+)/g, '<span class="text-yellow-400">$1</span>');
    result = result.replace(/\b(string|number|boolean|void|any|never|unknown|null|undefined|true|false)\b/g, 
      '<span class="text-cyan-400">$1</span>');
    result = result.replace(/\b([A-Z]\w*)\b(?!<span)/g, '<span class="text-yellow-300">$1</span>');

    return result;
  };

  return (
    <div className="h-full bg-[#1e1e1e] flex flex-col">
      <div className="flex items-center gap-2 px-4 py-2 bg-[#252526] border-b border-[#3c3c3c]">
        <div className="flex items-center gap-2 px-3 py-1 bg-[#1e1e1e] rounded-t border-t-2 border-cyan-500">
          <Code2 className="w-4 h-4 text-cyan-400" />
          <span className="text-sm text-white/80">registry.ts</span>
          <span className="text-white/30 text-xs">~</span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button className="text-xs text-white/50 hover:text-white/80 px-2 py-1 bg-white/5 rounded">Format</button>
          <button className="text-xs text-white/50 hover:text-white/80 px-2 py-1 bg-white/5 rounded">Run</button>
        </div>
      </div>
      
      <div className="flex-1 overflow-hidden relative">
        <div className="absolute inset-0 flex">
          <div className="w-12 bg-[#1e1e1e] border-r border-[#3c3c3c] pt-4 text-right pr-2 text-white/30 text-sm font-mono select-none overflow-hidden">
            {code.split('\n').map((_, i) => (
              <div key={i} className={`h-[1.5rem] ${cursorPos.line === i + 1 ? 'text-white/60' : ''}`}>{i + 1}</div>
            ))}
          </div>
          <div className="flex-1 relative">
            <div className="absolute inset-0 p-4 font-mono text-sm leading-6 pointer-events-none overflow-auto whitespace-pre" style={{ color: '#d4d4d4' }}>
              {code.split('\n').map((line, i) => (
                <div key={i} className={`h-6 ${cursorPos.line === i + 1 ? 'bg-white/5' : ''}`} 
                  dangerouslySetInnerHTML={{ __html: highlightLine(line) || '&nbsp;' }} />
              ))}
            </div>
            <textarea
              ref={textareaRef}
              value={code}
              onChange={e => setCode(e.target.value)}
              onKeyDown={handleKeyDown}
              onKeyUp={updateCursorPos}
              onClick={updateCursorPos}
              className="absolute inset-0 p-4 font-mono text-sm leading-6 bg-transparent text-transparent caret-white resize-none focus:outline-none"
              spellCheck={false}
            />
            {showAutocomplete && autocompleteItems.length > 0 && (
              <div className="absolute bg-[#252526] border border-[#3c3c3c] rounded shadow-xl z-50" style={{ top: cursorPos.line * 24 + 16, left: 60 }}>
                {autocompleteItems.map((item, i) => (
                  <button
                    key={item}
                    onClick={() => insertAutocomplete(item)}
                    className="w-full px-3 py-1 text-left text-sm font-mono text-white/80 hover:bg-cyan-500/20 flex items-center gap-2"
                  >
                    <span className="text-purple-400 text-xs">fn</span>
                    {item}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="px-4 py-2 bg-[#007acc] text-white text-xs flex items-center gap-4">
        <span>TypeScript</span>
        <span>UTF-8</span>
        <span>Spaces: 2</span>
        <span className="ml-auto">Ln {cursorPos.line}, Col {cursorPos.col}</span>
        <span className="text-white/60">Ctrl+Space for suggestions</span>
      </div>
    </div>
  );
}

function NewsFeedApp() {
  const newsItems = [
    { time: '2 min ago', title: 'New architect joined the network', type: 'info' },
    { time: '15 min ago', title: 'Project "Genesis" reached milestone', type: 'success' },
    { time: '1 hour ago', title: 'AEGIS blocked 3 intrusion attempts', type: 'warning' },
    { time: '3 hours ago', title: 'Codex certification updated', type: 'info' },
    { time: '5 hours ago', title: 'Network expansion: 5 new nodes', type: 'success' },
    { time: '1 day ago', title: 'System maintenance completed', type: 'info' },
  ];

  return (
    <div className="h-full bg-slate-950 flex flex-col">
      <div className="flex items-center gap-2 p-4 border-b border-white/10">
        <Newspaper className="w-5 h-5 text-cyan-400" />
        <h2 className="text-lg font-display text-white uppercase tracking-wider">News Feed</h2>
      </div>
      <div className="flex-1 overflow-auto p-4 space-y-3">
        {newsItems.map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="p-3 bg-white/5 rounded-lg border border-white/10 hover:border-cyan-500/30 transition-colors"
          >
            <div className="flex items-start gap-3">
              <div className={`w-2 h-2 mt-2 rounded-full ${item.type === 'success' ? 'bg-green-500' : item.type === 'warning' ? 'bg-yellow-500' : 'bg-cyan-500'}`} />
              <div className="flex-1">
                <div className="text-white text-sm">{item.title}</div>
                <div className="text-white/40 text-xs mt-1">{item.time}</div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function ArcadeApp() {
  const [snake, setSnake] = useState([{ x: 10, y: 10 }]);
  const [food, setFood] = useState({ x: 15, y: 15 });
  const [direction, setDirection] = useState({ x: 1, y: 0 });
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (!isPlaying || gameOver) return;
    const interval = setInterval(() => {
      setSnake(prev => {
        const newHead = { x: prev[0].x + direction.x, y: prev[0].y + direction.y };
        if (newHead.x < 0 || newHead.x >= 20 || newHead.y < 0 || newHead.y >= 20) {
          setGameOver(true);
          setIsPlaying(false);
          return prev;
        }
        if (prev.some(s => s.x === newHead.x && s.y === newHead.y)) {
          setGameOver(true);
          setIsPlaying(false);
          return prev;
        }
        const newSnake = [newHead, ...prev];
        if (newHead.x === food.x && newHead.y === food.y) {
          setScore(s => s + 10);
          setFood({ x: Math.floor(Math.random() * 20), y: Math.floor(Math.random() * 20) });
        } else {
          newSnake.pop();
        }
        return newSnake;
      });
    }, 150);
    return () => clearInterval(interval);
  }, [isPlaying, gameOver, direction, food]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!isPlaying) return;
      switch (e.key) {
        case 'ArrowUp': if (direction.y !== 1) setDirection({ x: 0, y: -1 }); break;
        case 'ArrowDown': if (direction.y !== -1) setDirection({ x: 0, y: 1 }); break;
        case 'ArrowLeft': if (direction.x !== 1) setDirection({ x: -1, y: 0 }); break;
        case 'ArrowRight': if (direction.x !== -1) setDirection({ x: 1, y: 0 }); break;
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isPlaying, direction]);

  const startGame = () => {
    setSnake([{ x: 10, y: 10 }]);
    setFood({ x: 15, y: 15 });
    setDirection({ x: 1, y: 0 });
    setGameOver(false);
    setScore(0);
    setIsPlaying(true);
  };

  return (
    <div className="h-full bg-slate-950 p-4 flex flex-col items-center">
      <div className="flex items-center gap-2 mb-4">
        <Gamepad2 className="w-5 h-5 text-cyan-400" />
        <h2 className="text-lg font-display text-white uppercase tracking-wider">Cyber Snake</h2>
      </div>
      
      <div className="text-cyan-400 font-mono mb-2">Score: {score}</div>
      
      <div className="grid gap-px bg-cyan-900/20 border border-cyan-500/30 rounded" style={{ gridTemplateColumns: 'repeat(20, 16px)' }}>
        {Array.from({ length: 400 }).map((_, i) => {
          const x = i % 20;
          const y = Math.floor(i / 20);
          const isSnake = snake.some(s => s.x === x && s.y === y);
          const isHead = snake[0]?.x === x && snake[0]?.y === y;
          const isFood = food.x === x && food.y === y;
          return (
            <div
              key={i}
              className={`w-4 h-4 ${isHead ? 'bg-cyan-400' : isSnake ? 'bg-green-500' : isFood ? 'bg-red-500' : 'bg-slate-900'}`}
            />
          );
        })}
      </div>

      {!isPlaying && (
        <button onClick={startGame} className="mt-4 px-6 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 rounded-lg border border-cyan-500/50 transition-colors font-mono">
          {gameOver ? 'Play Again' : 'Start Game'}
        </button>
      )}
      
      <div className="mt-2 text-white/40 text-xs">Use arrow keys to move</div>
    </div>
  );
}

function ProfilesApp() {
  const { data: profiles, isLoading } = useQuery({
    queryKey: ['os-profiles-list'],
    queryFn: async () => {
      const res = await fetch('/api/os/architects');
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="h-full bg-slate-950 flex flex-col">
        <div className="flex items-center gap-2 p-4 border-b border-white/10">
          <Users className="w-5 h-5 text-cyan-400" />
          <Skeleton className="h-6 w-40" />
        </div>
        <div className="flex-1 overflow-auto p-4 grid grid-cols-2 gap-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="bg-slate-800/50 rounded-lg p-4 border border-white/10">
              <div className="flex items-center gap-3">
                <Skeleton className="w-12 h-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <Skeleton className="h-3 w-12" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-slate-950 flex flex-col">
      <div className="flex items-center gap-2 p-4 border-b border-white/10">
        <Users className="w-5 h-5 text-cyan-400" />
        <h2 className="text-lg font-display text-white uppercase tracking-wider">Architect Profiles</h2>
      </div>
      <div className="flex-1 overflow-auto p-4 grid grid-cols-2 gap-4">
        {profiles?.map((profile: any) => (
          <motion.div
            key={profile.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg p-4 border border-white/10 hover:border-cyan-500/30 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${profile.verified ? 'bg-green-500/20 border-2 border-green-500' : 'bg-cyan-500/20 border border-cyan-500/50'}`}>
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="text-white font-mono">{profile.username || 'Anonymous'}</div>
                <div className="text-cyan-400 text-xs">Level {profile.level}</div>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between text-xs">
              <span className="text-white/50">{profile.xp} XP</span>
              {profile.verified && <span className="text-green-400 flex items-center gap-1"><Shield className="w-3 h-3" /> Verified</span>}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function NetworkNeighborhoodApp() {
  const { data: founders = [], isLoading } = useQuery({
    queryKey: ['network-neighborhood'],
    queryFn: async () => {
      const res = await fetch('/api/directory/architects');
      if (!res.ok) return [];
      return res.json();
    },
  });

  const reservedSlots = Array.from({ length: Math.max(0, 7 - founders.length) }, (_, i) => ({
    id: `reserved-${i}`,
    name: "[RESERVED FOR FOUNDRY]",
    role: "available",
    isReserved: true,
  }));

  if (isLoading) {
    return (
      <div className="h-full bg-black flex flex-col font-mono">
        <div className="flex items-center gap-2 p-3 border-b border-cyan-500/30 bg-cyan-500/5">
          <Network className="w-4 h-4 text-cyan-400" />
          <span className="text-cyan-400 text-sm uppercase tracking-wider">Network Neighborhood</span>
        </div>
        <div className="flex-1 p-4 flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-black flex flex-col font-mono">
      <div className="flex items-center gap-2 p-3 border-b border-cyan-500/30 bg-cyan-500/5">
        <Network className="w-4 h-4 text-cyan-400" />
        <span className="text-cyan-400 text-sm uppercase tracking-wider">Network Neighborhood</span>
        <span className="text-cyan-500/40 text-xs ml-auto">{founders.length} nodes online</span>
      </div>
      <div className="flex-1 overflow-auto p-2 space-y-1">
        {founders.map((architect: any, idx: number) => (
          <motion.div
            key={architect.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="flex items-center justify-between py-2 px-3 border-l-2 border-cyan-500/40 bg-cyan-500/5 hover:bg-cyan-500/10 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <span className="text-cyan-500/60 text-xs">[{String(idx + 1).padStart(3, '0')}]</span>
              <div>
                <span className="text-white font-bold">{architect.name}</span>
                <span className="text-cyan-500/50 text-sm ml-2">— {architect.role}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-cyan-500/40">Lv.{architect.level || 1}</span>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            </div>
          </motion.div>
        ))}
        {reservedSlots.map((slot: any, idx: number) => (
          <div
            key={slot.id}
            className="flex items-center justify-between py-2 px-3 border-l-2 border-yellow-500/30 bg-yellow-500/5 hover:bg-yellow-500/10 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="text-yellow-500/50 text-xs">[{String(founders.length + idx + 1).padStart(3, '0')}]</span>
              <span className="text-yellow-500/70">{slot.name}</span>
            </div>
            <a 
              href="https://aethex.studio" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs text-yellow-500 hover:text-yellow-400 transition-colors uppercase tracking-wider flex items-center gap-1"
            >
              Join <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        ))}
      </div>
      <div className="p-2 border-t border-cyan-500/20 text-center">
        <span className="text-cyan-500/40 text-xs">AETHEX.NETWORK // PUBLIC DIRECTORY</span>
      </div>
    </div>
  );
}

function FoundryApp() {
  const [viewMode, setViewMode] = useState<'info' | 'enroll'>('info');
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);
  
  const basePrice = 500;
  const discount = promoApplied && promoCode.toUpperCase() === 'TERMINAL10' ? 0.10 : 0;
  const finalPrice = basePrice * (1 - discount);
  
  return (
    <div className="h-full bg-gradient-to-br from-yellow-950 to-black flex flex-col font-mono">
      <div className="flex items-center justify-between p-3 border-b border-yellow-500/30 bg-yellow-500/5">
        <div className="flex items-center gap-2">
          <Award className="w-4 h-4 text-yellow-400" />
          <span className="text-yellow-400 text-sm uppercase tracking-wider">FOUNDRY.EXE</span>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setViewMode('info')}
            className={`px-2 py-1 text-xs uppercase ${viewMode === 'info' ? 'bg-yellow-500 text-black' : 'text-yellow-400 hover:bg-yellow-500/20'} transition-colors`}
          >
            Info
          </button>
          <button 
            onClick={() => setViewMode('enroll')}
            className={`px-2 py-1 text-xs uppercase ${viewMode === 'enroll' ? 'bg-yellow-500 text-black' : 'text-yellow-400 hover:bg-yellow-500/20'} transition-colors`}
          >
            Enroll
          </button>
        </div>
      </div>
      
      {viewMode === 'info' ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-20 h-20 rounded-full bg-yellow-500/20 border-2 border-yellow-500/50 flex items-center justify-center mb-6">
            <Award className="w-10 h-10 text-yellow-400" />
          </div>
          <h2 className="text-2xl font-bold text-yellow-400 mb-2">The Foundry</h2>
          <p className="text-white/70 text-sm mb-6 max-w-xs">
            Train to become a certified Metaverse Architect. Learn the protocols. Join the network.
          </p>
          <div className="space-y-2 text-left text-sm text-white/60 mb-6">
            <div className="flex items-center gap-2"><Zap className="w-4 h-4 text-yellow-400" /> 8-week intensive curriculum</div>
            <div className="flex items-center gap-2"><Shield className="w-4 h-4 text-yellow-400" /> AeThex Passport certification</div>
            <div className="flex items-center gap-2"><Users className="w-4 h-4 text-yellow-400" /> Join the architect network</div>
          </div>
          <button 
            onClick={() => setViewMode('enroll')}
            className="px-6 py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-bold uppercase tracking-wider transition-colors flex items-center gap-2"
          >
            Enroll Now <ChevronRight className="w-4 h-4" />
          </button>
          <div className="mt-4 text-xs text-yellow-500/50">
            Hint: Check the terminal for secret codes
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col p-6 overflow-auto">
          <div className="max-w-sm mx-auto w-full space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-bold text-yellow-400 mb-1">Architect Bootcamp</h3>
              <p className="text-white/50 text-sm">Cohort Starting Soon</p>
            </div>
            
            <div className="border border-yellow-500/30 bg-yellow-500/5 p-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-white/70">Bootcamp Access</span>
                <span className="text-white">${basePrice}</span>
              </div>
              {promoApplied && discount > 0 && (
                <div className="flex justify-between text-sm text-green-400">
                  <span>Discount (TERMINAL10)</span>
                  <span>-${(basePrice * discount).toFixed(0)}</span>
                </div>
              )}
              <div className="border-t border-yellow-500/20 pt-2 flex justify-between font-bold">
                <span className="text-white">Total</span>
                <span className="text-yellow-400">${finalPrice.toFixed(0)}</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-white/70 text-xs uppercase tracking-wider">Promo Code</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  placeholder="Enter code"
                  className="flex-1 bg-black/50 border border-yellow-500/30 px-3 py-2 text-white text-sm focus:outline-none focus:border-yellow-500"
                />
                <button 
                  onClick={() => setPromoApplied(true)}
                  className="px-4 py-2 bg-yellow-500/20 text-yellow-400 text-sm hover:bg-yellow-500/30 transition-colors"
                >
                  Apply
                </button>
              </div>
              {promoApplied && promoCode.toUpperCase() === 'TERMINAL10' && (
                <p className="text-green-400 text-xs">Code applied! 10% discount.</p>
              )}
              {promoApplied && promoCode && promoCode.toUpperCase() !== 'TERMINAL10' && (
                <p className="text-red-400 text-xs">Invalid code. Try the terminal.</p>
              )}
            </div>
            
            <a 
              href="https://aethex.studio" 
              target="_blank" 
              rel="noopener noreferrer"
              className="block w-full px-6 py-3 bg-yellow-500 hover:bg-yellow-400 text-black text-center font-bold uppercase tracking-wider transition-colors"
            >
              Complete Enrollment
            </a>
            
            <p className="text-center text-white/40 text-xs">
              Redirects to aethex.studio for payment
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function DevToolsApp() {
  const tools = [
    { name: "Documentation", desc: "API reference & guides", url: "https://aethex.dev", icon: <FileText className="w-5 h-5" /> },
    { name: "GitHub", desc: "Open source repositories", url: "https://github.com/aethex", icon: <Code2 className="w-5 h-5" /> },
    { name: "Status Page", desc: "System uptime & health", url: "#", icon: <Activity className="w-5 h-5" /> },
  ];

  return (
    <div className="h-full bg-slate-950 flex flex-col font-mono">
      <div className="flex items-center gap-2 p-3 border-b border-purple-500/30 bg-purple-500/5">
        <Code2 className="w-4 h-4 text-purple-400" />
        <span className="text-purple-400 text-sm uppercase tracking-wider">Dev Tools</span>
      </div>
      <div className="flex-1 overflow-auto p-4 space-y-3">
        {tools.map((tool, idx) => (
          <a
            key={idx}
            href={tool.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 p-4 border border-purple-500/20 bg-purple-500/5 hover:bg-purple-500/10 transition-colors rounded-lg"
          >
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400">
              {tool.icon}
            </div>
            <div className="flex-1">
              <div className="text-white font-bold">{tool.name}</div>
              <div className="text-purple-400/60 text-sm">{tool.desc}</div>
            </div>
            <ExternalLink className="w-4 h-4 text-purple-400/40" />
          </a>
        ))}
      </div>
    </div>
  );
}

function MissionApp() {
  return (
    <div className="h-full bg-black flex flex-col font-mono">
      <div className="flex items-center gap-2 p-3 border-b border-cyan-500/30 bg-cyan-500/5">
        <FileText className="w-4 h-4 text-cyan-400" />
        <span className="text-cyan-400 text-sm">Mission.txt</span>
      </div>
      <div className="flex-1 overflow-auto p-4 text-sm leading-relaxed">
        <pre className="text-green-400 whitespace-pre-wrap">
{`// AETHEX MANIFESTO
// Last Updated: 2025

> "We are not building for the Metaverse.
   We ARE the Metaverse."

====================================
THE VISION
====================================

AeThex is an Operating System for the 
Metaverse. We are building the tools,
protocols, and people that will power
the next generation of digital reality.

====================================
THE TRINITY
====================================

AXIOM   - The foundational principles
CODEX   - The certification system  
AEGIS   - The security layer

====================================
THE MISSION
====================================

To transform talent into certified
Metaverse Architects through rigorous
training, real projects, and a network
of like-minded builders.

====================================
JOIN THE FOUNDRY
====================================

Apply at: aethex.studio

// END OF FILE`}
        </pre>
      </div>
    </div>
  );
}

function LeaderboardApp() {
  const { data: architects, isLoading } = useQuery({
    queryKey: ['os-leaderboard'],
    queryFn: async () => {
      const res = await fetch('/api/os/architects');
      const data = await res.json();
      return data.sort((a: any, b: any) => (b.xp || 0) - (a.xp || 0));
    },
  });

  if (isLoading) {
    return (
      <div className="h-full bg-slate-950 flex flex-col">
        <div className="flex items-center gap-2 p-4 border-b border-white/10">
          <Trophy className="w-5 h-5 text-yellow-400" />
          <Skeleton className="h-6 w-32" />
        </div>
        <div className="flex-1 overflow-auto p-4 space-y-2">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-white/5 border border-white/10">
              <Skeleton className="w-8 h-8 rounded" />
              <Skeleton className="w-10 h-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-16" />
              </div>
              <Skeleton className="h-6 w-12" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-slate-950 flex flex-col">
      <div className="flex items-center gap-2 p-4 border-b border-white/10">
        <Trophy className="w-5 h-5 text-yellow-400" />
        <h2 className="text-lg font-display text-white uppercase tracking-wider">Leaderboard</h2>
      </div>
      <div className="flex-1 overflow-auto p-4">
        {architects?.map((architect: any, i: number) => {
          const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : null;
          return (
            <motion.div
              key={architect.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`flex items-center gap-4 p-3 rounded-lg mb-2 ${i < 3 ? 'bg-gradient-to-r from-yellow-500/10 to-transparent border border-yellow-500/20' : 'bg-white/5 border border-white/10'}`}
            >
              <div className="w-8 text-center font-mono text-lg">
                {medal || <span className="text-white/40">{i + 1}</span>}
              </div>
              <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center">
                <User className="w-5 h-5 text-cyan-400" />
              </div>
              <div className="flex-1">
                <div className="text-white font-mono">{architect.username || 'Anonymous'}</div>
                <div className="text-white/50 text-xs">Level {architect.level}</div>
              </div>
              <div className="text-right">
                <div className="text-cyan-400 font-mono font-bold">{architect.xp || 0}</div>
                <div className="text-white/40 text-xs">XP</div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function CalculatorApp() {
  const [display, setDisplay] = useState('0');
  const [prev, setPrev] = useState<number | null>(null);
  const [op, setOp] = useState<string | null>(null);
  const [newNumber, setNewNumber] = useState(true);

  const handleNumber = (n: string) => {
    if (newNumber) {
      setDisplay(n);
      setNewNumber(false);
    } else {
      setDisplay(display === '0' ? n : display + n);
    }
  };

  const handleOp = (operator: string) => {
    setPrev(parseFloat(display));
    setOp(operator);
    setNewNumber(true);
  };

  const calculate = () => {
    if (prev === null || !op) return;
    const current = parseFloat(display);
    let result = 0;
    switch (op) {
      case '+': result = prev + current; break;
      case '-': result = prev - current; break;
      case '×': result = prev * current; break;
      case '÷': result = current !== 0 ? prev / current : 0; break;
    }
    setDisplay(String(result));
    setPrev(null);
    setOp(null);
    setNewNumber(true);
  };

  const clear = () => {
    setDisplay('0');
    setPrev(null);
    setOp(null);
    setNewNumber(true);
  };

  const buttons = ['C', '±', '%', '÷', '7', '8', '9', '×', '4', '5', '6', '-', '1', '2', '3', '+', '0', '.', '='];

  return (
    <div className="h-full bg-slate-950 p-4 flex flex-col">
      <div className="bg-slate-900 rounded-lg p-4 mb-4">
        <div className="text-right text-4xl font-mono text-white truncate">{display}</div>
      </div>
      <div className="grid grid-cols-4 gap-2 flex-1">
        {buttons.map(btn => (
          <button
            key={btn}
            onClick={() => {
              if (btn === 'C') clear();
              else if (btn === '=') calculate();
              else if (['+', '-', '×', '÷'].includes(btn)) handleOp(btn);
              else if (btn === '±') setDisplay(String(-parseFloat(display)));
              else if (btn === '%') setDisplay(String(parseFloat(display) / 100));
              else handleNumber(btn);
            }}
            className={`rounded-lg font-mono text-xl transition-colors ${
              btn === '0' ? 'col-span-2' : ''
            } ${
              ['+', '-', '×', '÷', '='].includes(btn) 
                ? 'bg-cyan-500 hover:bg-cyan-400 text-white' 
                : btn === 'C' 
                  ? 'bg-red-500/20 hover:bg-red-500/30 text-red-400' 
                  : 'bg-white/10 hover:bg-white/20 text-white'
            }`}
          >
            {btn}
          </button>
        ))}
      </div>
    </div>
  );
}

function NotesApp() {
  const [notes, setNotes] = useState(() => {
    const saved = localStorage.getItem('aethex-notes');
    return saved || 'Welcome to AeThex Notes!\n\nStart typing here...';
  });

  useEffect(() => {
    localStorage.setItem('aethex-notes', notes);
  }, [notes]);

  return (
    <div className="h-full bg-slate-950 flex flex-col">
      <div className="flex items-center gap-2 p-3 border-b border-white/10">
        <StickyNote className="w-5 h-5 text-yellow-400" />
        <span className="text-white font-mono text-sm">notes.txt</span>
      </div>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        className="flex-1 bg-transparent p-4 text-white font-mono text-sm resize-none outline-none"
        placeholder="Type your notes here..."
      />
      <div className="px-4 py-2 border-t border-white/10 text-white/40 text-xs">
        Auto-saved locally
      </div>
    </div>
  );
}

function SystemMonitorApp() {
  const [cpu, setCpu] = useState(45);
  const [ram, setRam] = useState(62);
  const [network, setNetwork] = useState(78);

  useEffect(() => {
    const interval = setInterval(() => {
      setCpu(Math.floor(Math.random() * 30) + 35);
      setRam(Math.floor(Math.random() * 20) + 55);
      setNetwork(Math.floor(Math.random() * 40) + 50);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const Gauge = ({ label, value, color }: { label: string; value: number; color: string }) => (
    <div className="flex flex-col items-center">
      <div className="relative w-24 h-24">
        <svg className="w-full h-full transform -rotate-90">
          <circle cx="48" cy="48" r="40" stroke="#1e293b" strokeWidth="8" fill="none" />
          <circle
            cx="48" cy="48" r="40"
            stroke={color}
            strokeWidth="8"
            fill="none"
            strokeDasharray={`${value * 2.51} 251`}
            className="transition-all duration-500"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-white font-mono text-lg">{value}%</span>
        </div>
      </div>
      <div className="text-white/60 text-sm mt-2">{label}</div>
    </div>
  );

  return (
    <div className="h-full bg-slate-950 p-4">
      <div className="flex items-center gap-2 mb-6">
        <Cpu className="w-5 h-5 text-cyan-400" />
        <h2 className="text-lg font-display text-white uppercase tracking-wider">System Monitor</h2>
      </div>
      
      <div className="flex justify-around mb-6">
        <Gauge label="CPU" value={cpu} color="#22d3ee" />
        <Gauge label="RAM" value={ram} color="#a855f7" />
        <Gauge label="NET" value={network} color="#22c55e" />
      </div>

      <div className="space-y-3">
        <div className="bg-white/5 rounded-lg p-3">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-white/60">Aegis Shield</span>
            <span className="text-green-400">ACTIVE</span>
          </div>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-green-500 to-cyan-500 w-full" />
          </div>
        </div>
        <div className="bg-white/5 rounded-lg p-3">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-white/60">Network Nodes</span>
            <span className="text-cyan-400">24 Connected</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function WebcamApp() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setHasPermission(true);
      }
    } catch {
      setHasPermission(false);
    }
  };

  useEffect(() => {
    return () => {
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, []);

  const runScan = () => {
    setIsScanning(true);
    setTimeout(() => setIsScanning(false), 3000);
  };

  return (
    <div className="h-full bg-black flex flex-col">
      <div className="flex items-center justify-between p-3 bg-slate-900 border-b border-red-500/30">
        <div className="flex items-center gap-2">
          <Eye className="w-5 h-5 text-red-500" />
          <span className="text-red-400 font-mono text-sm">AEGIS SURVEILLANCE</span>
        </div>
        <div className="flex items-center gap-2 text-red-400 text-xs">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          MONITORING
        </div>
      </div>
      
      <div className="flex-1 relative flex items-center justify-center bg-slate-950">
        {hasPermission === null && (
          <button onClick={startCamera} className="px-6 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg border border-red-500/50 transition-colors flex items-center gap-2">
            <Camera className="w-5 h-5" />
            Enable Camera
          </button>
        )}
        
        {hasPermission === false && (
          <div className="text-center p-6">
            <Camera className="w-12 h-12 text-red-500/50 mx-auto mb-3" />
            <div className="text-red-400">Camera access denied</div>
            <div className="text-white/40 text-sm mt-1">Enable camera to use AEGIS surveillance</div>
          </div>
        )}
        
        {hasPermission && (
          <>
            <video ref={videoRef} autoPlay playsInline className="max-w-full max-h-full" />
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-0 left-0 w-16 h-16 border-l-2 border-t-2 border-red-500/50" />
              <div className="absolute top-0 right-0 w-16 h-16 border-r-2 border-t-2 border-red-500/50" />
              <div className="absolute bottom-0 left-0 w-16 h-16 border-l-2 border-b-2 border-red-500/50" />
              <div className="absolute bottom-0 right-0 w-16 h-16 border-r-2 border-b-2 border-red-500/50" />
              {isScanning && (
                <motion.div
                  initial={{ top: 0 }}
                  animate={{ top: '100%' }}
                  transition={{ duration: 2, repeat: 1 }}
                  className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent"
                />
              )}
            </div>
          </>
        )}
      </div>
      
      {hasPermission && (
        <div className="p-3 bg-slate-900 border-t border-red-500/30 flex justify-center">
          <button onClick={runScan} disabled={isScanning} className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded border border-red-500/50 transition-colors text-sm flex items-center gap-2 disabled:opacity-50">
            <Shield className="w-4 h-4" />
            {isScanning ? 'Scanning...' : 'Run Biometric Scan'}
          </button>
        </div>
      )}
    </div>
  );
}
