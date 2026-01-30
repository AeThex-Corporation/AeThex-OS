import { useState, useRef, useCallback, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { useWebSocket } from "@/hooks/use-websocket";
import { getIcon } from "@/lib/iconMap";
import { usePlatformLayout, PlatformSwitch } from "@/hooks/use-platform-layout";
import { useHaptics } from "@/hooks/use-haptics";
import { useMobileNative } from "@/hooks/use-mobile-native";
import { useNativeFeatures } from "@/hooks/use-native-features";
import { useBiometricAuth } from "@/hooks/use-biometric-auth";
import { StatusBar, Style } from '@capacitor/status-bar';
import { MobileQuickActions } from "@/components/MobileQuickActions";
import { Minesweeper } from "@/components/games/Minesweeper";
import { CookieClicker } from "@/components/games/CookieClicker";
import { 
  Terminal, FileText, IdCard, Music, Settings, Globe,
  X, Minus, Square, Maximize2, Volume2, Wifi, Battery,
  ChevronUp, FolderOpen, Award, MessageCircle, Send,
  ExternalLink, User, LogOut, BarChart3, Loader2, Layers,
  Presentation, Bell, Image, Monitor, Play, Pause, ChevronRight,
  Network, Activity, Code2, Radio, Newspaper, Gamepad2,
  Users, Trophy, Calculator, StickyNote, Cpu, Camera,
  Eye, Shield, Zap, Skull, Lock, Unlock, Server, Database,
  TrendingUp, ArrowUp, ArrowDown, Hash, Key, HardDrive, FolderSearch, 
  AlertTriangle, Briefcase, CalendarDays, FolderGit2, MessageSquare,
  ShoppingCart, Folder, Code, Home, Flag, Cookie, ChevronLeft,
  MoreVertical, Search, Mic, ArrowLeft, RefreshCw, Star, Clock, MapPin
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
  iframeUrl?: string;
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
  const layout = usePlatformLayout();
  const { impact, notification } = useHaptics();
  const { keyboardVisible, deviceInfo } = useMobileNative('dark');
  const native = useNativeFeatures();
  const biometric = useBiometricAuth();
  
  // Skip boot sequence on mobile
  const [isBooting, setIsBooting] = useState(!layout.isMobile);
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
  const [activeTrayPanel, setActiveTrayPanel] = useState<'wifi' | 'volume' | 'battery' | 'notifications' | 'upgrade' | null>(null);
  const [volume, setVolume] = useState(75);
  const [isMuted, setIsMuted] = useState(false);

  // WebSocket connection for real-time updates
  const { 
    connected: wsConnected, 
    metrics: wsMetrics, 
    alerts: wsAlerts, 
    achievements: wsAchievements, 
    notifications: wsNotifications 
  } = useWebSocket();
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

  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [isDesktopLocked, setIsDesktopLocked] = useState(true);
  const [detectedIdentity, setDetectedIdentity] = useState<{ username?: string; passportId?: string } | null>(null);
  const [threatLevel, setThreatLevel] = useState<'scanning' | 'low' | 'medium' | 'high'>('scanning');
  const [bootLogs, setBootLogs] = useState<string[]>([]);

  useEffect(() => {
    const bootSequence = async () => {
      const addLog = (text: string) => setBootLogs(prev => [...prev.slice(-8), text]);
      
      // Phase 1: Hardware initialization
      const phase1 = [
        { text: 'POST: Power-On Self Test...', progress: 3 },
        { text: 'CPU: AMD Ryzen 9 7950X3D @ 4.2GHz... OK', progress: 5 },
        { text: 'RAM: 64GB DDR5-6000 ECC... OK', progress: 8 },
        { text: 'GPU: Quantum Accelerator v2.1... OK', progress: 10 },
        { text: 'NVME: AeThex Vault 2TB... OK', progress: 12 },
      ];
      
      for (const step of phase1) {
        setBootStep(step.text);
        addLog(step.text);
        setBootProgress(step.progress);
        await new Promise(r => setTimeout(r, 150));
      }
      
      // Phase 2: Kernel & filesystem
      const phase2 = [
        { text: 'Loading AeThex Kernel v4.2.1...', progress: 18 },
        { text: 'Initializing virtual memory manager...', progress: 22 },
        { text: 'Mounting encrypted file systems...', progress: 26 },
        { text: 'Loading device drivers...', progress: 30 },
      ];
      
      for (const step of phase2) {
        setBootStep(step.text);
        addLog(step.text);
        setBootProgress(step.progress);
        await new Promise(r => setTimeout(r, 200));
      }
      
      // Phase 3: Passport Identity Detection
      setBootStep('INITIATING AETHEX PASSPORT SUBSYSTEM...');
      addLog('▸ PASSPORT: Initializing identity subsystem...');
      setBootProgress(35);
      await new Promise(r => setTimeout(r, 300));
      
      // Check for existing session/identity
      let foundIdentity = false;
      try {
        const sessionRes = await fetch('/api/auth/session', { credentials: 'include' });
        const sessionData = await sessionRes.json();
        if (sessionData?.authenticated && sessionData?.user) {
          foundIdentity = true;
          setDetectedIdentity({ 
            username: sessionData.user.username, 
            passportId: sessionData.user.id?.slice(0, 8).toUpperCase() 
          });
          addLog(`▸ PASSPORT: Identity token detected`);
          setBootStep('PASSPORT: IDENTITY TOKEN DETECTED');
          setBootProgress(40);
          await new Promise(r => setTimeout(r, 300));
          
          addLog(`▸ PASSPORT: Verifying credentials for ${sessionData.user.username}...`);
          setBootStep(`Verifying credentials for ${sessionData.user.username}...`);
          setBootProgress(45);
          await new Promise(r => setTimeout(r, 400));
          
          addLog(`▸ PASSPORT: Welcome back, ARCHITECT ${sessionData.user.username.toUpperCase()}`);
          setBootStep(`WELCOME BACK, ARCHITECT ${sessionData.user.username.toUpperCase()}`);
          setBootProgress(50);
          await new Promise(r => setTimeout(r, 500));
        }
      } catch (err) {
        // Session fetch failed, continue with guest mode
        if (import.meta.env.DEV) console.debug('[Boot] Session check failed:', err);
      }
      
      if (!foundIdentity) {
        addLog('▸ PASSPORT: No active identity token found');
        setBootStep('PASSPORT: NO ACTIVE IDENTITY TOKEN');
        setBootProgress(42);
        await new Promise(r => setTimeout(r, 300));
        
        addLog('▸ PASSPORT: Guest access mode available');
        setBootStep('Guest access mode available');
        setBootProgress(48);
        await new Promise(r => setTimeout(r, 300));
      }
      
      // Phase 4: Aegis Security Layer
      addLog('▸ AEGIS: Initializing security layer...');
      setBootStep('AEGIS: INITIALIZING SECURITY LAYER...');
      setBootProgress(55);
      await new Promise(r => setTimeout(r, 300));
      
      addLog('▸ AEGIS: Loading threat detection modules...');
      setBootStep('Loading threat detection modules...');
      setBootProgress(60);
      await new Promise(r => setTimeout(r, 250));
      
      addLog('▸ AEGIS: Scanning network perimeter...');
      setBootStep('AEGIS: SCANNING NETWORK PERIMETER...');
      setBootProgress(65);
      setThreatLevel('scanning');
      await new Promise(r => setTimeout(r, 600));
      
      // Simulate threat assessment result
      const threatResult = Math.random();
      if (threatResult < 0.7) {
        setThreatLevel('low');
        addLog('▸ AEGIS: Threat level LOW - All systems nominal');
        setBootStep('THREAT LEVEL: LOW - ALL SYSTEMS NOMINAL');
      } else if (threatResult < 0.95) {
        setThreatLevel('medium');
        addLog('▸ AEGIS: Threat level MEDIUM - Enhanced monitoring active');
        setBootStep('THREAT LEVEL: MEDIUM - MONITORING ACTIVE');
      } else {
        setThreatLevel('high');
        addLog('▸ AEGIS: Threat level ELEVATED - Defensive protocols engaged');
        setBootStep('THREAT LEVEL: ELEVATED - PROTOCOLS ENGAGED');
      }

      // Schedule upgrade alert in system tray once per session
      try {
        const shown = localStorage.getItem('aethex-upgrade-alert-shown');
        if (!shown) {
          setTimeout(() => {
            try {
              if (!localStorage.getItem('aethex-upgrade-alert-shown')) {
                setActiveTrayPanel('upgrade');
                addToast('⚠️ Architect Access Available — Use tray to upgrade', 'info');
                localStorage.setItem('aethex-upgrade-alert-shown', 'true');
              }
            } catch (err) {
              if (import.meta.env.DEV) console.debug('[Boot] localStorage access failed:', err);
            }
          }, 30000);
        }
      } catch (err) {
        if (import.meta.env.DEV) console.debug('[Boot] Upgrade check failed:', err);
      }
      setBootProgress(75);
      await new Promise(r => setTimeout(r, 400));
      
      // Phase 5: Network & Final
      addLog('▸ NEXUS: Connecting to AeThex network...');
      setBootStep('Connecting to Nexus network...');
      setBootProgress(82);
      await new Promise(r => setTimeout(r, 300));
      
      addLog('▸ NEXUS: Syncing with distributed nodes...');
      setBootStep('Syncing with distributed nodes...');
      setBootProgress(88);
      await new Promise(r => setTimeout(r, 250));
      
      addLog('▸ NEXUS: Connection established - 42 peers online');
      setBootStep('NEXUS: 42 PEERS ONLINE');
      setBootProgress(94);
      await new Promise(r => setTimeout(r, 200));
      
      addLog('▸ SYSTEM: AeThex OS ready');
      setBootStep('AETHEX OS READY');
      setBootProgress(100);
      await new Promise(r => setTimeout(r, 500));
      
      setShowLoginPrompt(true);
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
      } catch (err) {
        // Notifications fetch failed, not critical
        if (import.meta.env.DEV) console.debug('[OS] Notifications fetch failed:', err);
      }
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
      } catch (err) {
        // Corrupted localStorage data, ignore and use defaults
        if (import.meta.env.DEV) console.debug('[OS] Failed to restore window positions:', err);
      }
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
    { id: "passport", title: "Passport", icon: <Key className="w-8 h-8" />, component: "passport", defaultWidth: 650, defaultHeight: 500 },
    { id: "achievements", title: "Achievements", icon: <Trophy className="w-8 h-8" />, component: "achievements", defaultWidth: 800, defaultHeight: 600 },
    { id: "projects", title: "Projects", icon: <FolderGit2 className="w-8 h-8" />, component: "projects", defaultWidth: 900, defaultHeight: 650 },
    { id: "opportunities", title: "Opportunities", icon: <Briefcase className="w-8 h-8" />, component: "opportunities", defaultWidth: 850, defaultHeight: 650 },
    { id: "events", title: "Events", icon: <CalendarDays className="w-8 h-8" />, component: "events", defaultWidth: 900, defaultHeight: 650 },
    { id: "messaging", title: "Messages", icon: <MessageSquare className="w-8 h-8" />, component: "messaging", defaultWidth: 850, defaultHeight: 600 },
    { id: "marketplace", title: "Marketplace", icon: <ShoppingCart className="w-8 h-8" />, component: "marketplace", defaultWidth: 900, defaultHeight: 650 },
    { id: "foundry", title: "FOUNDRY.EXE", icon: <Award className="w-8 h-8" />, component: "foundry", defaultWidth: 450, defaultHeight: 500 },
    { id: "intel", title: "INTEL", icon: <FolderSearch className="w-8 h-8" />, component: "intel", defaultWidth: 550, defaultHeight: 450 },
    { id: "filemanager", title: "File Manager", icon: <Folder className="w-8 h-8" />, component: "filemanager", defaultWidth: 800, defaultHeight: 600 },
    { id: "codegallery", title: "Code Gallery", icon: <Code className="w-8 h-8" />, component: "codegallery", defaultWidth: 900, defaultHeight: 650 },
    { id: "drives", title: "My Computer", icon: <HardDrive className="w-8 h-8" />, component: "drives", defaultWidth: 450, defaultHeight: 400 },
    { id: "chat", title: "AeThex AI", icon: <MessageCircle className="w-8 h-8" />, component: "chat", defaultWidth: 400, defaultHeight: 500 },
    { id: "terminal", title: "Terminal", icon: <Terminal className="w-8 h-8" />, component: "terminal", defaultWidth: 750, defaultHeight: 500 },
    { id: "notifications", title: "Notifications", icon: <Bell className="w-8 h-8" />, component: "notifications", defaultWidth: 700, defaultHeight: 600 },
    { id: "analytics", title: "Analytics", icon: <BarChart3 className="w-8 h-8" />, component: "analytics", defaultWidth: 1000, defaultHeight: 700 },
    { id: "metrics", title: "System Status", icon: <Activity className="w-8 h-8" />, component: "metrics", defaultWidth: 750, defaultHeight: 550 },
    { id: "devtools", title: "Dev Tools", icon: <Code2 className="w-8 h-8" />, component: "devtools", defaultWidth: 450, defaultHeight: 400 },
    { id: "music", title: "Radio AeThex", icon: <Radio className="w-8 h-8" />, component: "music", defaultWidth: 400, defaultHeight: 350 },
    { id: "codeeditor", title: "The Lab", icon: <Code2 className="w-8 h-8" />, component: "codeeditor", defaultWidth: 700, defaultHeight: 500 },
    { id: "arcade", title: "Snake", icon: <Gamepad2 className="w-8 h-8" />, component: "arcade", defaultWidth: 420, defaultHeight: 520 },
    { id: "minesweeper", title: "Minesweeper", icon: <Flag className="w-8 h-8" />, component: "minesweeper", defaultWidth: 400, defaultHeight: 500 },
    { id: "cookieclicker", title: "Cookie Clicker", icon: <Cookie className="w-8 h-8" />, component: "cookieclicker", defaultWidth: 420, defaultHeight: 600 },
    { id: "calculator", title: "Calculator", icon: <Calculator className="w-8 h-8" />, component: "calculator", defaultWidth: 320, defaultHeight: 450 },
    { id: "settings", title: "Settings", icon: <Settings className="w-8 h-8" />, component: "settings", defaultWidth: 550, defaultHeight: 500 },
  ];

  const corpApps: DesktopApp[] = [
    { id: "networkneighborhood", title: "Network Neighborhood", icon: <Network className="w-8 h-8" />, component: "networkneighborhood", defaultWidth: 500, defaultHeight: 450 },
    { id: "mission", title: "README.TXT", icon: <FileText className="w-8 h-8" />, component: "mission", defaultWidth: 500, defaultHeight: 500 },
    { id: "passport", title: "Passport", icon: <Key className="w-8 h-8" />, component: "passport", defaultWidth: 650, defaultHeight: 500 },
    { id: "achievements", title: "Achievements", icon: <Trophy className="w-8 h-8" />, component: "achievements", defaultWidth: 800, defaultHeight: 600 },
    { id: "projects", title: "Projects", icon: <FolderGit2 className="w-8 h-8" />, component: "projects", defaultWidth: 900, defaultHeight: 650 },
    { id: "opportunities", title: "Opportunities", icon: <Briefcase className="w-8 h-8" />, component: "opportunities", defaultWidth: 850, defaultHeight: 650 },
    { id: "events", title: "Events", icon: <CalendarDays className="w-8 h-8" />, component: "events", defaultWidth: 900, defaultHeight: 650 },
    { id: "messaging", title: "Messages", icon: <MessageSquare className="w-8 h-8" />, component: "messaging", defaultWidth: 850, defaultHeight: 600 },
    { id: "marketplace", title: "Marketplace", icon: <ShoppingCart className="w-8 h-8" />, component: "marketplace", defaultWidth: 900, defaultHeight: 650 },
    { id: "foundry", title: "FOUNDRY.EXE", icon: <Award className="w-8 h-8" />, component: "foundry", defaultWidth: 450, defaultHeight: 500 },
    { id: "intel", title: "INTEL", icon: <FolderSearch className="w-8 h-8" />, component: "intel", defaultWidth: 550, defaultHeight: 450 },
    { id: "filemanager", title: "File Manager", icon: <Folder className="w-8 h-8" />, component: "filemanager", defaultWidth: 800, defaultHeight: 600 },
    { id: "codegallery", title: "Code Gallery", icon: <Code className="w-8 h-8" />, component: "codegallery", defaultWidth: 900, defaultHeight: 650 },
    { id: "drives", title: "My Computer", icon: <HardDrive className="w-8 h-8" />, component: "drives", defaultWidth: 450, defaultHeight: 400 },
    { id: "devtools", title: "Dev Tools", icon: <Code2 className="w-8 h-8" />, component: "devtools", defaultWidth: 450, defaultHeight: 400 },
    { id: "notifications", title: "Notifications", icon: <Bell className="w-8 h-8" />, component: "notifications", defaultWidth: 700, defaultHeight: 600 },
    { id: "analytics", title: "Analytics", icon: <BarChart3 className="w-8 h-8" />, component: "analytics", defaultWidth: 1000, defaultHeight: 700 },
    { id: "metrics", title: "System Status", icon: <Activity className="w-8 h-8" />, component: "metrics", defaultWidth: 750, defaultHeight: 550 },
    { id: "network", title: "Global Ops", icon: <Globe className="w-8 h-8" />, component: "network", defaultWidth: 700, defaultHeight: 550 },
    { id: "files", title: "Asset Library", icon: <Database className="w-8 h-8" />, component: "files", defaultWidth: 700, defaultHeight: 500 },
    { id: "pitch", title: "Contracts", icon: <FileText className="w-8 h-8" />, component: "pitch", defaultWidth: 500, defaultHeight: 400 },
    { id: "sysmonitor", title: "Infrastructure", icon: <Server className="w-8 h-8" />, component: "sysmonitor", defaultWidth: 450, defaultHeight: 400 },
    { id: "leaderboard", title: "Performance", icon: <BarChart3 className="w-8 h-8" />, component: "leaderboard", defaultWidth: 500, defaultHeight: 550 },
    { id: "calculator", title: "Calculator", icon: <Calculator className="w-8 h-8" />, component: "calculator", defaultWidth: 320, defaultHeight: 450 },
    { id: "settings", title: "Settings", icon: <Settings className="w-8 h-8" />, component: "settings", defaultWidth: 550, defaultHeight: 500 },
  ];

  const apps = clearanceMode === 'foundation' ? foundationApps : corpApps;

  // Handle WebSocket notifications
  useEffect(() => {
    if (wsNotifications && wsNotifications.length > 0) {
      wsNotifications.forEach((notification: any) => {
        if (notification.message) {
          addToast(notification.message, notification.type || 'info');
        }
      });
    }
  }, [wsNotifications]);

  // Handle WebSocket alerts for admins
  useEffect(() => {
    if (user?.isAdmin && wsAlerts && wsAlerts.length > 0) {
      const newAlertMessages = wsAlerts.map((alert: any) => 
        `[AEGIS] ${alert.severity?.toUpperCase()}: ${alert.message}`
      );
      setNotifications(prev => [...new Set([...newAlertMessages, ...prev])].slice(0, 10));
    }
  }, [wsAlerts, user?.isAdmin]);

  // Show WebSocket connection status
  useEffect(() => {
    if (wsConnected && !isBooting) {
      addToast('Real-time connection established', 'success');
    }
  }, [wsConnected, isBooting]);

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
    const appToOpen = (isDesktopLocked && app.id !== 'passport') 
      ? apps.find(a => a.id === 'passport') || app 
      : app;
    
    playSound('open');
    const existingWindow = windows.find(w => w.id === appToOpen.id);
    if (existingWindow) {
      setWindows(prev => prev.map(w => 
        w.id === appToOpen.id ? { ...w, minimized: false, zIndex: maxZIndex + 1, desktopId: currentDesktop } : w
      ));
      setMaxZIndex(prev => prev + 1);
      setActiveWindowId(appToOpen.id);
      return;
    }

    const offsetX = (windows.length % 5) * 40 + 100;
    const offsetY = (windows.length % 5) * 40 + 50;

    const newWindow: WindowState = {
      id: appToOpen.id,
      title: appToOpen.title,
      icon: appToOpen.icon,
      component: appToOpen.component,
      x: offsetX,
      y: offsetY,
      width: appToOpen.defaultWidth,
      height: appToOpen.defaultHeight,
      minimized: false,
      maximized: false,
      zIndex: maxZIndex + 1,
      desktopId: currentDesktop
    };

    setWindows(prev => [...prev, newWindow]);
    setMaxZIndex(prev => prev + 1);
    setActiveWindowId(appToOpen.id);
    setShowStartMenu(false);
  }, [windows, maxZIndex, playSound, currentDesktop, isDesktopLocked, apps]);

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
      case 'passport': return <PassportApp onLoginSuccess={unlockDesktop} isDesktopLocked={isDesktopLocked} />;
      case 'files': return <FilesApp />;
      case 'network': return <NetworkMapApp />;
      case 'metrics': return <MetricsDashboardApp />;
      case 'codeeditor': return <CodeEditorApp />;
      case 'newsfeed': return <NewsFeedApp />;
      case 'arcade': return <ArcadeApp />;
      case 'minesweeper': return <Minesweeper />;
      case 'cookieclicker': return <CookieClicker />;
      case 'profiles': return <ProfilesApp />;
      case 'leaderboard': return <LeaderboardApp />;
      case 'calculator': return <CalculatorApp />;
      case 'notes': return <NotesApp />;
      case 'sysmonitor': return <SystemMonitorApp />;
      case 'webcam': return <WebcamApp />;
      case 'achievements': return <AchievementsApp />;
      case 'projects': return <ProjectsAppWrapper />;
      case 'opportunities': return <OpportunitiesApp />;
      case 'events': return <EventsApp />;
      case 'messaging': return <MessagingAppWrapper />;
      case 'marketplace': return <MarketplaceAppWrapper />;
      case 'chat': return <ChatApp />;
      case 'music': return <MusicApp />;
      case 'pitch': return <PitchApp onNavigate={() => setLocation('/pitch')} />;
      case 'networkneighborhood': return <NetworkNeighborhoodApp openIframeWindow={openIframeWindow} />;
      case 'foundry': return <FoundryApp openIframeWindow={openIframeWindow} />;
      case 'devtools': return <DevToolsApp openIframeWindow={openIframeWindow} />;
      case 'mission': return <MissionApp />;
      case 'intel': return <IntelApp />;
      case 'filemanager': return <FileManagerAppWrapper />;
      case 'codegallery': return <CodeGalleryAppWrapper />;
      case 'notifications': return <NotificationsAppWrapper />;
      case 'analytics': return <AnalyticsAppWrapper />;
      case 'drives': return <DrivesApp openIframeWindow={openIframeWindow} />;
      case 'iframe': return null;
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

  const handleGuestContinue = () => {
    setShowLoginPrompt(false);
    setIsBooting(false);
    setIsDesktopLocked(false);
    const randomTip = DAILY_TIPS[Math.floor(Math.random() * DAILY_TIPS.length)];
    setDailyTip(randomTip);
    setTimeout(() => setShowDailyTip(true), 1000);
  };

  const handleLoginFromBoot = () => {
    setShowLoginPrompt(false);
    setIsBooting(false);
    // Keep desktop locked until login succeeds
    const randomTip = DAILY_TIPS[Math.floor(Math.random() * DAILY_TIPS.length)];
    setDailyTip(randomTip);
    setTimeout(() => {
      setShowDailyTip(true);
      const passportApp = apps.find(a => a.id === 'passport');
      if (passportApp) openApp(passportApp);
    }, 500);
  };

  const unlockDesktop = () => {
    setIsDesktopLocked(false);
  };

  const openIframeWindow = (url: string, title: string) => {
    // Most external sites block iframe embedding - open in new tab instead
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  if (isBooting) {
    const threatColors = {
      scanning: 'text-cyan-400',
      low: 'text-green-400',
      medium: 'text-yellow-400',
      high: 'text-red-400'
    };
    const threatBgColors = {
      scanning: 'bg-cyan-500/20 border-cyan-500/50',
      low: 'bg-green-500/20 border-green-500/50',
      medium: 'bg-yellow-500/20 border-yellow-500/50',
      high: 'bg-red-500/20 border-red-500/50'
    };
    
    return (
      <div className="h-screen w-screen bg-black relative overflow-hidden">
        {/* Scan lines overlay */}
        <div 
          className="absolute inset-0 pointer-events-none z-50"
          style={{
            background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.15) 2px, rgba(0,0,0,0.15) 4px)',
          }}
        />
        
        {/* CRT flicker effect */}
        <motion.div
          className="absolute inset-0 bg-white/[0.02] pointer-events-none z-40"
          animate={{ opacity: [0, 0.02, 0, 0.01, 0] }}
          transition={{ duration: 0.1, repeat: Infinity, repeatDelay: Math.random() * 3 + 1 }}
        />
        
        {/* Vignette effect */}
        <div 
          className="absolute inset-0 pointer-events-none z-30"
          style={{
            background: 'radial-gradient(ellipse at center, transparent 0%, transparent 50%, rgba(0,0,0,0.4) 100%)',
          }}
        />
        
        <div className="h-full w-full flex flex-col lg:flex-row">
          {/* Left side - Boot logs */}
          <div className="hidden lg:flex w-80 h-full flex-col p-4 border-r border-cyan-500/20">
            <div className="text-cyan-400 font-mono text-xs uppercase tracking-wider mb-3 flex items-center gap-2">
              <Terminal className="w-3 h-3" />
              System Log
            </div>
            <div className="flex-1 overflow-hidden">
              <div className="space-y-1 font-mono text-xs">
                {bootLogs.map((log, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: i === bootLogs.length - 1 ? 1 : 0.5, x: 0 }}
                    className={`${i === bootLogs.length - 1 ? 'text-cyan-300' : 'text-white/40'}`}
                  >
                    {log}
                  </motion.div>
                ))}
              </div>
            </div>
            
            {/* Threat Level Indicator */}
            <div className={`mt-4 p-3 border rounded ${threatBgColors[threatLevel]}`}>
              <div className="text-xs font-mono uppercase tracking-wider text-white/60 mb-1">Aegis Status</div>
              <div className={`font-mono font-bold ${threatColors[threatLevel]} flex items-center gap-2`}>
                <Shield className="w-4 h-4" />
                {threatLevel === 'scanning' ? 'SCANNING...' : `THREAT: ${threatLevel.toUpperCase()}`}
              </div>
            </div>
          </div>
          
          {/* Center - Main boot display */}
          <div className="flex-1 flex flex-col items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center max-w-md"
            >
              {/* Logo with glow */}
              <div className="w-28 h-28 mx-auto mb-8 relative">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-xl blur-lg opacity-50" />
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-xl animate-pulse" />
                <div className="absolute inset-2 bg-black rounded-lg flex items-center justify-center">
                  <motion.span 
                    className="text-5xl font-display font-bold text-white"
                    animate={{ textShadow: ['0 0 10px rgba(0,255,255,0.5)', '0 0 20px rgba(0,255,255,0.8)', '0 0 10px rgba(0,255,255,0.5)'] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    A
                  </motion.span>
                </div>
              </div>
              
              {/* Current step with typing effect */}
              <motion.div 
                key={bootStep}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-cyan-400 font-mono text-sm mb-6 h-6"
              >
                {bootStep}
                <motion.span
                  animate={{ opacity: [1, 0] }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                >
                  _
                </motion.span>
              </motion.div>
              
              {/* Progress bar */}
              <div className="w-72 mx-auto">
                <div className="flex justify-between text-xs font-mono text-white/40 mb-2">
                  <span>BOOT SEQUENCE</span>
                  <span>{bootProgress}%</span>
                </div>
                <div className="h-2 bg-slate-800/80 rounded-full overflow-hidden border border-white/10">
                  <motion.div
                    className="h-full bg-gradient-to-r from-cyan-500 via-cyan-400 to-purple-600 relative"
                    initial={{ width: 0 }}
                    animate={{ width: `${bootProgress}%` }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
                  </motion.div>
                </div>
              </div>
              
              {/* Detected identity badge */}
              {detectedIdentity && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-green-500/20 border border-green-500/50 rounded-full"
                >
                  <User className="w-4 h-4 text-green-400" />
                  <span className="text-green-400 font-mono text-sm">
                    {detectedIdentity.username} • ID:{detectedIdentity.passportId}
                  </span>
                </motion.div>
              )}
              
              <div className="text-white/30 text-xs mt-6 font-mono">AeThex OS v4.2.1 • Aegis Security Layer Active</div>

              <AnimatePresence>
                {showLoginPrompt && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-8 space-y-4"
                  >
                    <div className={`font-mono text-sm mb-6 flex items-center justify-center gap-2 ${threatColors[threatLevel]}`}>
                      <Shield className="w-4 h-4" />
                      {detectedIdentity 
                        ? `IDENTITY VERIFIED • THREAT LEVEL: ${threatLevel.toUpperCase()}`
                        : `SYSTEM READY • THREAT LEVEL: ${threatLevel.toUpperCase()}`
                      }
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <motion.button
                        onClick={detectedIdentity ? handleGuestContinue : handleLoginFromBoot}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-cyan-400 hover:from-cyan-400 hover:to-cyan-300 text-black font-mono font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/30"
                        data-testid="boot-login-button"
                      >
                        <Key className="w-4 h-4" />
                        {detectedIdentity ? `Enter as ${detectedIdentity.username}` : 'Login with Passport'}
                      </motion.button>
                      {!detectedIdentity && (
                        <motion.button
                          onClick={handleGuestContinue}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="px-6 py-3 border border-white/30 hover:bg-white/10 text-white/70 font-mono uppercase tracking-wider transition-colors"
                          data-testid="boot-guest-button"
                        >
                          Continue as Guest
                        </motion.button>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
          
          {/* Right side - System specs (hidden on mobile) */}
          <div className="hidden lg:flex w-64 h-full flex-col p-4 border-l border-purple-500/20 text-right">
            <div className="text-purple-400 font-mono text-xs uppercase tracking-wider mb-3">
              System Info
            </div>
            <div className="space-y-2 font-mono text-xs text-white/40">
              <div>BUILD: 2025.12.21</div>
              <div>KERNEL: 4.2.1-aethex</div>
              <div>ARCH: x86_64</div>
              <div className="pt-2 border-t border-white/10 mt-2">
                <div className="text-purple-400">NEXUS NETWORK</div>
                <div>Peers: 42 online</div>
                <div>Latency: 12ms</div>
              </div>
              <div className="pt-2 border-t border-white/10 mt-2">
                <div className="text-cyan-400">PASSPORT</div>
                <div>{detectedIdentity ? 'Token: VALID' : 'Token: NONE'}</div>
                <div>Mode: {detectedIdentity ? 'ARCHITECT' : 'GUEST'}</div>
              </div>
            </div>
          </div>
        </div>
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

  // Motion values for mobile gestures (must be outside conditional)
  const dragX = useMotionValue(0);
  const dragOpacity = useTransform(dragX, [-200, 0, 200], [0.5, 1, 0.5]);

  // Hide system navigation bar on mount (Android only) - MUST be outside conditional
  useEffect(() => {
    if (!layout.isMobile) return;

    const setupStatusBar = async () => {
      try {
        // Hide the status bar for full immersion
        await StatusBar.hide();

        // Set navigation bar to transparent and hide it
        if ((window as any).NavigationBar) {
          await (window as any).NavigationBar.backgroundColorByHexString('#00000000', false);
          await (window as any).NavigationBar.hide();
        }

        // Enable edge-to-edge mode
        document.documentElement.style.setProperty('--safe-area-inset-bottom', 'env(safe-area-inset-bottom)');
      } catch (error) {
        console.log('StatusBar not available on this platform');
      }
    };

    setupStatusBar();

    return () => {
      // Show status bar when leaving
      StatusBar.show().catch(() => {});
    };
  }, [layout.isMobile]);

  // Native Android App Layout
  if (layout.isMobile) {
    const activeWindows = windows.filter(w => !w.minimized);
    const currentWindow = activeWindows[activeWindows.length - 1];

    return (
      <div className="h-screen w-screen bg-black overflow-hidden flex flex-col">
        <style>{`
          @keyframes scan {
            0% { transform: translateY(-100%); }
            100% { transform: translateY(100%); }
          }
          @keyframes pulse-border {
            0%, 100% { opacity: 0.3; }
            50% { opacity: 0.8; }
          }
        `}</style>

        {/* Ingress Status Bar - Minimal */}
        <div className="relative h-8 bg-black/90 border-b border-emerald-500/50 shrink-0">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-500/5 to-transparent"></div>
          <div className="relative flex items-center justify-between px-4 h-full">
            <div className="flex items-center gap-3">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <Wifi className="w-3.5 h-3.5 text-cyan-400" />
              <div className="flex items-center gap-0.5">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="w-0.5 h-1.5 bg-emerald-400 rounded-full" style={{ height: `${(i + 1) * 2}px` }} />
                ))}
              </div>
            </div>
            <div className="flex items-center gap-4 text-cyan-400 text-xs font-mono font-bold tracking-wider">
              <span>{batteryInfo?.level || 100}%</span>
              <Battery className="w-4 h-4 text-green-400" />
              <span className="font-mono text-cyan-400">{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-hidden relative bg-black">
          <AnimatePresence mode="wait">
            {currentWindow ? (
              // Fullscreen App View with 3D Card Flip
              <motion.div
                key={currentWindow.id}
                initial={{ rotateY: 90, opacity: 0 }}
                animate={{ rotateY: 0, opacity: 1 }}
                exit={{ rotateY: -90, opacity: 0 }}
                transition={{ duration: 0.4, type: "spring" }}
                style={{ transformStyle: "preserve-3d" }}
                className="h-full w-full flex flex-col relative"
              >
                {/* Ingress Style - Minimal App Bar */}
                <div className="relative h-12 bg-black/95 border-b-2 border-emerald-500/50 shrink-0">
                  <div className="absolute inset-0" style={{ animation: 'pulse-border 2s ease-in-out infinite' }}>
                    <div className="absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-500 to-transparent"></div>
                  </div>
                  <div className="relative flex items-center px-3 h-full">
                    <button
                      onClick={() => {
                        impact('light');
                        closeWindow(currentWindow.id);
                      }}
                      className="w-10 h-10 flex items-center justify-center border border-emerald-500/50 active:bg-emerald-500/20"
                      style={{ clipPath: 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)' }}
                    >
                      <ChevronLeft className="w-5 h-5 text-emerald-400" />
                    </button>
                    <div className="flex-1 px-4">
                      <h1 className="text-cyan-400 font-mono font-bold text-lg uppercase tracking-widest">
                        {currentWindow.title}
                      </h1>
                    </div>
                    <button
                      className="w-10 h-10 flex items-center justify-center border border-cyan-500/50 active:bg-cyan-500/20"
                      style={{ clipPath: 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)' }}
                    >
                      <MoreVertical className="w-5 h-5 text-cyan-400" />
                    </button>
                  </div>
                </div>
                
                {/* App Content */}
                <div className="flex-1 overflow-auto relative bg-black">
                  {renderAppContent(currentWindow.component)}
                </div>
              </motion.div>
            ) : (
              // ULTRA FUTURISTIC LAUNCHER
              <motion.div
                key="launcher"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="h-full flex flex-col relative"
              >
                {/* Ingress Style Search Bar */}
                <div className="px-4 pt-6 pb-4">
                  <div className="relative bg-black/80 border border-emerald-500/50 p-3">
                    <div className="absolute inset-0 border border-cyan-500/30" style={{ clipPath: 'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))' }}></div>
                    <div className="relative flex items-center gap-3">
                      <Search className="w-5 h-5 text-emerald-400" />
                      <input
                        type="text"
                        placeholder="SCANNER SEARCH..."
                        className="flex-1 bg-transparent text-emerald-400 placeholder:text-emerald-400/40 outline-none text-sm font-mono uppercase tracking-wide"
                        onFocus={() => impact('light')}
                      />
                      <Mic className="w-5 h-5 text-cyan-400" />
                    </div>
                  </div>
                </div>

                {/* App Grid - Hexagonal */}
                <div className="flex-1 overflow-auto px-4 pb-24">
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-3 px-2">
                      <div className="w-2 h-2 bg-emerald-400"></div>
                      <h2 className="text-emerald-400 text-xs uppercase tracking-widest font-mono font-bold">
                        Quick Access
                      </h2>
                      <div className="flex-1 h-[1px] bg-emerald-500/30"></div>
                    </div>
                    <div className="grid grid-cols-4 gap-3">
                      {apps.slice(0, 8).map((app) => (
                        <button
                          key={app.id}
                          onClick={() => {
                            impact('medium');
                            openApp(app);
                          }}
                          className="flex flex-col items-center gap-2 p-2 active:bg-emerald-500/10"
                        >
                          <div 
                            className="relative w-16 h-16 bg-black border-2 border-emerald-500/50 flex items-center justify-center active:border-cyan-400"
                            style={{ clipPath: 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)' }}
                          >
                            <div className="text-emerald-400 scale-75">{app.icon}</div>
                            <div className="absolute inset-0 border border-cyan-500/20" style={{ clipPath: 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)' }}></div>
                          </div>
                          <span className="text-cyan-400 text-[9px] font-mono text-center line-clamp-2 leading-tight uppercase">
                            {app.title}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* All Apps - Minimal List */}
                  <div>
                    <div className="flex items-center gap-2 mb-3 px-2">
                      <div className="w-2 h-2 bg-cyan-400"></div>
                      <h2 className="text-cyan-400 text-xs uppercase tracking-widest font-mono font-bold">
                        All Systems
                      </h2>
                      <div className="flex-1 h-[1px] bg-cyan-500/30"></div>
                    </div>
                    <div className="space-y-2">
                      {apps.slice(8).map((app) => (
                        <button
                          key={app.id}
                          onClick={() => {
                            impact('medium');
                            openApp(app);
                          }}
                          className="relative w-full flex items-center gap-3 p-3 border border-emerald-500/30 active:bg-emerald-500/10 active:border-cyan-500"
                        >
                          <div className="w-10 h-10 bg-black border border-emerald-500/50 flex items-center justify-center shrink-0">
                            <div className="text-emerald-400 scale-75">{app.icon}</div>
                          </div>
                          <span className="text-cyan-400 font-mono text-sm text-left flex-1 uppercase tracking-wide">{app.title}</span>
                          <ChevronRight className="w-4 h-4 text-emerald-400" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* INGRESS STYLE NAVIGATION BAR - Lightweight */}
        <div 
          className="relative bg-black/95 border-t-2 border-emerald-500/50 shrink-0 z-50"
          style={{ 
            paddingTop: '0.75rem',
            paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))',
          }}
        >
          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-500 to-transparent" style={{ animation: 'pulse-border 2s ease-in-out infinite' }}></div>
          <div className="relative flex items-center justify-around px-6">
            <button
              onClick={() => {
                impact('medium');
                windows.forEach(w => closeWindow(w.id));
              }}
              className="relative w-14 h-14 bg-black border-2 border-emerald-500/70 flex items-center justify-center active:bg-emerald-500/20 active:border-cyan-400"
              style={{ clipPath: 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)' }}
            >
              <Home className="w-6 h-6 text-emerald-400" />
            </button>
            
            <button
              onClick={() => {
                impact('medium');
                const minimized = windows.filter(w => w.minimized);
                if (minimized.length > 0) {
                  setWindows(prev => prev.map(w => 
                    w.id === minimized[0].id ? { ...w, minimized: false } : w
                  ));
                }
              }}
              className="relative w-14 h-14 bg-black border-2 border-cyan-500/70 flex items-center justify-center active:bg-cyan-500/20 active:border-emerald-400"
              style={{ clipPath: 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)' }}
            >
              <Square className="w-6 h-6 text-cyan-400" />
              {windows.filter(w => w.minimized).length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 text-black text-xs flex items-center justify-center font-bold">
                  {windows.filter(w => w.minimized).length}
                </span>
              )}
            </button>
            
            <button
              onClick={() => {
                impact('medium');
                if (currentWindow) {
                  closeWindow(currentWindow.id);
                }
              }}
              className="relative w-14 h-14 bg-black border-2 border-emerald-500/70 flex items-center justify-center active:bg-emerald-500/20 active:border-cyan-400"
              style={{ clipPath: 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)' }}
            >
              <ArrowLeft className="w-6 h-6 text-emerald-400" />
            </button>
          </div>
        </div>

        {/* Floating Action Button with Orbital Menu */}
        <MobileQuickActions />
      </div>
    );
  }
  
  console.log('🖥️ [OS] Rendering DESKTOP layout (isMobile=false)');

  // Desktop/Web layout
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

        {isDesktopLocked && windows.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
          >
            <div className="text-center">
              <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center mb-4">
                <Lock className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-xl font-display text-white uppercase tracking-wider mb-2">Desktop Locked</h2>
              <p className="text-white/60 text-sm font-mono mb-6">Sign in with your Passport to continue</p>
              <button
                onClick={() => {
                  const passportApp = apps.find(a => a.id === 'passport');
                  if (passportApp) openApp(passportApp);
                }}
                className="px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-mono font-bold uppercase tracking-wider transition-colors"
                data-testid="unlock-desktop-btn"
              >
                Open Passport
              </button>
            </div>
          </motion.div>
        )}

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
              content={window.component === 'iframe' && window.iframeUrl ? (
                <iframe 
                  src={window.iframeUrl} 
                  className="w-full h-full border-0" 
                  title={window.title}
                  sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                />
              ) : renderAppContent(window.component)}
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
        openIframeWindow={openIframeWindow}
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

interface WidgetPosition {
  x: number;
  y: number;
}

interface WidgetPositions {
  [key: string]: WidgetPosition;
}

function getDefaultWidgetPositions(): WidgetPositions {
  const w = typeof window !== 'undefined' ? window.innerWidth : 1200;
  const h = typeof window !== 'undefined' ? window.innerHeight : 800;
  return {
    clock: { x: w - 220, y: 16 },
    weather: { x: w - 220, y: 100 },
    status: { x: w - 220, y: 200 },
    notifications: { x: w - 220, y: 320 },
    leaderboard: { x: w - 440, y: 16 },
    pipeline: { x: w - 440, y: 180 },
    kpi: { x: w - 440, y: 340 },
    heartbeat: { x: 16, y: h - 180 },
  };
}

function DraggableWidget({ 
  id, 
  children, 
  positions, 
  onPositionChange,
  className = ""
}: { 
  id: string; 
  children: React.ReactNode; 
  positions: WidgetPositions;
  onPositionChange: (id: string, pos: WidgetPosition) => void;
  className?: string;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const widgetRef = useRef<HTMLDivElement>(null);

  const defaultPositions = getDefaultWidgetPositions();
  const position = positions[id] || defaultPositions[id] || { x: 100, y: 100 };

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.widget-drag-handle')) {
      e.preventDefault();
      setIsDragging(true);
      setDragOffset({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
    }
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newX = Math.max(0, Math.min(window.innerWidth - 50, e.clientX - dragOffset.x));
      const newY = Math.max(0, Math.min(window.innerHeight - 60, e.clientY - dragOffset.y));
      onPositionChange(id, { x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset, id, onPositionChange]);

  return (
    <motion.div
      ref={widgetRef}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`fixed bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-lg overflow-hidden ${isDragging ? 'cursor-grabbing shadow-lg shadow-cyan-500/20' : ''} ${className}`}
      style={{ 
        left: position.x, 
        top: position.y, 
        zIndex: isDragging ? 50 : 5,
        pointerEvents: 'auto'
      }}
      onMouseDown={handleMouseDown}
      data-testid={`widget-${id}`}
    >
      <div className="widget-drag-handle h-5 bg-white/5 flex items-center justify-center cursor-grab hover:bg-white/10 transition-colors">
        <div className="flex gap-0.5">
          <div className="w-1 h-1 rounded-full bg-white/30" />
          <div className="w-1 h-1 rounded-full bg-white/30" />
          <div className="w-1 h-1 rounded-full bg-white/30" />
        </div>
      </div>
      {children}
    </motion.div>
  );
}

function DesktopWidgets({ time, weather, notifications }: { 
  time: Date; 
  weather?: { current_weather?: { temperature: number; windspeed: number; weathercode: number } };
  notifications?: string[];
}) {
  const [widgetPositions, setWidgetPositions] = useState<WidgetPositions>(() => {
    const saved = localStorage.getItem('aethex-widget-positions');
    return saved ? JSON.parse(saved) : getDefaultWidgetPositions();
  });
  const [positionResetKey, setPositionResetKey] = useState(0);
  const [widgetVisibility, setWidgetVisibility] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem('aethex-widget-visibility');
    return saved ? JSON.parse(saved) : { clock: true, weather: true, status: true, notifications: true, leaderboard: true, pipeline: true, kpi: true, heartbeat: true };
  });
  const [showWidgetSettings, setShowWidgetSettings] = useState(false);
  const [mobileWidgetsOpen, setMobileWidgetsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const toggleWidgetVisibility = (id: string) => {
    setWidgetVisibility(prev => {
      const updated = { ...prev, [id]: !prev[id] };
      localStorage.setItem('aethex-widget-visibility', JSON.stringify(updated));
      return updated;
    });
  };

  const resetWidgetPositions = () => {
    const defaults = getDefaultWidgetPositions();
    setWidgetPositions(defaults);
    setPositionResetKey(k => k + 1);
    localStorage.setItem('aethex-widget-positions', JSON.stringify(defaults));
  };

  const widgetOptions = [
    { id: 'clock', label: 'Clock' },
    { id: 'weather', label: 'Weather' },
    { id: 'status', label: 'System Status' },
    { id: 'notifications', label: 'Notifications' },
    { id: 'leaderboard', label: 'Leaderboard' },
    { id: 'pipeline', label: 'Pipeline' },
    { id: 'kpi', label: 'KPI Dashboard' },
    { id: 'heartbeat', label: 'Network Heartbeat' },
  ];

  const { data: metrics } = useQuery({
    queryKey: ['os-metrics'],
    queryFn: async () => {
      const res = await fetch('/api/metrics');
      return res.json();
    },
    refetchInterval: 30000,
  });

  const { data: leaderboard } = useQuery({
    queryKey: ['os-leaderboard'],
    queryFn: async () => {
      const res = await fetch('/api/directory/architects');
      const data = await res.json();
      return data.slice(0, 5);
    },
    refetchInterval: 60000,
  });

  const handlePositionChange = useCallback((id: string, pos: WidgetPosition) => {
    setWidgetPositions(prev => {
      const updated = { ...prev, [id]: pos };
      localStorage.setItem('aethex-widget-positions', JSON.stringify(updated));
      return updated;
    });
  }, []);

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

  const getNotificationCategory = (text: string) => {
    if (text.toLowerCase().includes('security') || text.toLowerCase().includes('aegis')) 
      return { color: 'text-green-400', icon: <Shield className="w-3 h-3" /> };
    if (text.toLowerCase().includes('project')) 
      return { color: 'text-purple-400', icon: <FolderOpen className="w-3 h-3" /> };
    return { color: 'text-cyan-400', icon: <Users className="w-3 h-3" /> };
  };

  if (isMobile) {
    return (
      <>
        <button
          onClick={() => setMobileWidgetsOpen(!mobileWidgetsOpen)}
          className="fixed top-4 right-4 z-50 w-10 h-10 bg-slate-900/90 backdrop-blur-xl border border-white/20 rounded-lg flex items-center justify-center text-white/70 hover:text-white transition-colors pointer-events-auto"
          data-testid="mobile-widgets-toggle"
        >
          <BarChart3 className="w-5 h-5" />
        </button>
        <AnimatePresence>
          {mobileWidgetsOpen && (
            <motion.div
              initial={{ opacity: 0, x: 300 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 300 }}
              className="fixed top-0 right-0 bottom-12 w-72 bg-slate-900/95 backdrop-blur-xl border-l border-white/10 overflow-y-auto z-40 pointer-events-auto"
            >
              <div className="p-4 border-b border-white/10 flex items-center justify-between sticky top-0 bg-slate-900/95">
                <span className="text-sm text-white/70 uppercase tracking-wider">Widgets</span>
                <button onClick={() => setMobileWidgetsOpen(false)} className="text-white/50 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4 space-y-4">
                {widgetVisibility.clock !== false && (
                  <div className="bg-white/5 rounded-lg p-3">
                    <div className="text-2xl font-mono text-white font-bold">
                      {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div className="text-xs text-white/50 font-mono">
                      {time.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                )}
                {widgetVisibility.weather !== false && weather?.current_weather && (
                  <div className="bg-white/5 rounded-lg p-3">
                    <div className="text-xs text-white/50 uppercase tracking-wider mb-2">Weather</div>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{getWeatherIcon(weather.current_weather.weathercode)}</span>
                      <div>
                        <div className="text-xl font-mono text-white">{Math.round(weather.current_weather.temperature)}°F</div>
                        <div className="text-xs text-white/50">Wind: {weather.current_weather.windspeed} mph</div>
                      </div>
                    </div>
                  </div>
                )}
                {widgetVisibility.status !== false && metrics && (
                  <div className="bg-white/5 rounded-lg p-3">
                    <div className="text-xs text-white/50 uppercase tracking-wider mb-2">System Status</div>
                    <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                      <div className="flex justify-between">
                        <span className="text-white/60">Architects</span>
                        <span className="text-cyan-400">{metrics.totalProfiles || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/60">Projects</span>
                        <span className="text-purple-400">{metrics.totalProjects || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/60">Verified</span>
                        <span className="text-yellow-400">{metrics.verifiedUsers || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/60">Online</span>
                        <span className="text-green-400">{metrics.onlineUsers || 0}</span>
                      </div>
                    </div>
                  </div>
                )}
                {widgetVisibility.notifications !== false && notifications && notifications.length > 0 && (
                  <div className="bg-white/5 rounded-lg p-3">
                    <div className="text-xs text-white/50 uppercase tracking-wider mb-2">Notifications</div>
                    <div className="space-y-1.5 text-xs">
                      {notifications.slice(0, 4).map((n, i) => {
                        const cat = getNotificationCategory(n);
                        return (
                          <div key={i} className={`flex items-center gap-2 ${cat.color}`}>
                            {cat.icon}
                            <span className="truncate text-white/70">{n}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                {widgetVisibility.leaderboard !== false && leaderboard && leaderboard.length > 0 && (
                  <div className="bg-white/5 rounded-lg p-3">
                    <div className="text-xs text-white/50 uppercase tracking-wider mb-2 flex items-center gap-2">
                      <Award className="w-3 h-3 text-yellow-400" />
                      Top Architects
                    </div>
                    <div className="space-y-1.5 text-xs font-mono">
                      {leaderboard.map((arch: any, i: number) => (
                        <div key={arch.id} className="flex items-center gap-2">
                          <span className={`w-4 text-center ${i === 0 ? 'text-yellow-400' : i === 1 ? 'text-gray-300' : i === 2 ? 'text-amber-600' : 'text-white/40'}`}>
                            {i + 1}
                          </span>
                          <span className="flex-1 truncate text-white/80">{arch.username || arch.display_name}</span>
                          <span className="text-cyan-400">Lv{arch.level || 1}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </>
    );
  }

  return (
    <div className="pointer-events-none absolute inset-0 hidden md:block">
      <button
        onClick={() => setShowWidgetSettings(true)}
        className="fixed top-4 left-4 z-50 w-8 h-8 bg-slate-900/80 backdrop-blur-xl border border-white/20 rounded-lg flex items-center justify-center text-white/50 hover:text-white transition-colors pointer-events-auto"
        data-testid="widget-settings-btn"
      >
        <Settings className="w-4 h-4" />
      </button>

      <AnimatePresence>
        {showWidgetSettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm pointer-events-auto"
            onClick={() => setShowWidgetSettings(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900/95 backdrop-blur-xl border border-white/20 rounded-xl p-6 w-80"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-display uppercase tracking-wider">Widget Settings</h3>
                <button onClick={() => setShowWidgetSettings(false)} className="text-white/50 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-2 mb-4">
                {widgetOptions.map(opt => (
                  <label key={opt.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={widgetVisibility[opt.id] !== false}
                      onChange={() => toggleWidgetVisibility(opt.id)}
                      className="w-4 h-4 rounded border-white/30 bg-white/10 text-cyan-500 focus:ring-cyan-500"
                    />
                    <span className="text-white/80 text-sm">{opt.label}</span>
                  </label>
                ))}
              </div>
              <button
                onClick={resetWidgetPositions}
                className="w-full py-2 bg-white/10 hover:bg-white/20 text-white/80 rounded-lg text-sm transition-colors"
              >
                Reset Positions
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {widgetVisibility.clock !== false && (
        <DraggableWidget key={`clock-${positionResetKey}`} id="clock" positions={widgetPositions} onPositionChange={handlePositionChange} className="w-48">
          <div className="p-3">
            <div className="text-2xl font-mono text-white font-bold">
              {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
            <div className="text-xs text-white/50 font-mono">
              {time.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}
            </div>
          </div>
        </DraggableWidget>
      )}

      {widgetVisibility.weather !== false && weather?.current_weather && (
        <DraggableWidget key={`weather-${positionResetKey}`} id="weather" positions={widgetPositions} onPositionChange={handlePositionChange} className="w-48">
          <div className="p-3">
            <div className="text-xs text-white/50 uppercase tracking-wider mb-2">Weather</div>
            <div className="flex items-center gap-3">
              <span className="text-2xl">{getWeatherIcon(weather.current_weather.weathercode)}</span>
              <div>
                <div className="text-xl font-mono text-white">{Math.round(weather.current_weather.temperature)}°F</div>
                <div className="text-xs text-white/50">Wind: {weather.current_weather.windspeed} mph</div>
              </div>
            </div>
          </div>
        </DraggableWidget>
      )}
      
      {widgetVisibility.status !== false && metrics && (
        <DraggableWidget key={`status-${positionResetKey}`} id="status" positions={widgetPositions} onPositionChange={handlePositionChange} className="w-48">
          <div className="p-3">
            <div className="text-xs text-white/50 uppercase tracking-wider mb-2">System Status</div>
            <div className="space-y-1.5 text-xs font-mono">
              <div className="flex justify-between items-center">
                <span className="text-white/60">Architects</span>
                <div className="flex items-center gap-1">
                  <span className="text-cyan-400">{metrics.totalProfiles || 0}</span>
                  <TrendingUp className="w-3 h-3 text-green-400" />
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/60">Projects</span>
                <div className="flex items-center gap-1">
                  <span className="text-purple-400">{metrics.totalProjects || 0}</span>
                  <TrendingUp className="w-3 h-3 text-green-400" />
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/60">Online</span>
                <span className="text-green-400">{metrics.onlineUsers || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/60">Verified</span>
                <span className="text-yellow-400">{metrics.verifiedUsers || 0}</span>
              </div>
            </div>
          </div>
        </DraggableWidget>
      )}

      {widgetVisibility.notifications !== false && notifications && notifications.length > 0 && (
        <DraggableWidget key={`notifications-${positionResetKey}`} id="notifications" positions={widgetPositions} onPositionChange={handlePositionChange} className="w-52">
          <div className="p-3">
            <div className="text-xs text-white/50 uppercase tracking-wider mb-2">Notifications</div>
            <div className="space-y-1.5 text-xs max-h-24 overflow-y-auto">
              {notifications.slice(0, 4).map((n, i) => {
                const cat = getNotificationCategory(n);
                return (
                  <div key={i} className={`flex items-center gap-2 ${cat.color}`}>
                    {cat.icon}
                    <span className="truncate text-white/70">{n}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </DraggableWidget>
      )}

      {widgetVisibility.leaderboard !== false && leaderboard && leaderboard.length > 0 && (
        <DraggableWidget key={`leaderboard-${positionResetKey}`} id="leaderboard" positions={widgetPositions} onPositionChange={handlePositionChange} className="w-52">
          <div className="p-3">
            <div className="text-xs text-white/50 uppercase tracking-wider mb-2 flex items-center gap-2">
              <Award className="w-3 h-3 text-yellow-400" />
              Top Architects
            </div>
            <div className="space-y-1.5 text-xs font-mono">
              {leaderboard.map((arch: any, i: number) => (
                <div key={arch.id} className="flex items-center gap-2">
                  <span className={`w-4 text-center ${i === 0 ? 'text-yellow-400' : i === 1 ? 'text-gray-300' : i === 2 ? 'text-amber-600' : 'text-white/40'}`}>
                    {i + 1}
                  </span>
                  <span className="flex-1 truncate text-white/80">{arch.username || arch.display_name}</span>
                  <span className="text-cyan-400">Lv{arch.level || 1}</span>
                </div>
              ))}
            </div>
          </div>
        </DraggableWidget>
      )}

      {widgetVisibility.pipeline !== false && metrics && (
        <DraggableWidget key={`pipeline-${positionResetKey}`} id="pipeline" positions={widgetPositions} onPositionChange={handlePositionChange} className="w-52">
          <div className="p-3">
            <div className="text-xs text-white/50 uppercase tracking-wider mb-2 flex items-center gap-2">
              <Layers className="w-3 h-3 text-purple-400" />
              Project Pipeline
            </div>
            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-white/60">Active</span>
                  <span className="text-green-400">{metrics.totalProjects || 0}</span>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 rounded-full" style={{ width: '75%' }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-white/60">In Review</span>
                  <span className="text-yellow-400">2</span>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-yellow-500 rounded-full" style={{ width: '40%' }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-white/60">Completed</span>
                  <span className="text-cyan-400">12</span>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-cyan-500 rounded-full" style={{ width: '100%' }} />
                </div>
              </div>
            </div>
          </div>
        </DraggableWidget>
      )}

      {widgetVisibility.kpi !== false && metrics && (
        <DraggableWidget key={`kpi-${positionResetKey}`} id="kpi" positions={widgetPositions} onPositionChange={handlePositionChange} className="w-52">
          <div className="p-3">
            <div className="text-xs text-white/50 uppercase tracking-wider mb-2 flex items-center gap-2">
              <BarChart3 className="w-3 h-3 text-cyan-400" />
              Key Metrics
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-white/5 rounded p-2 text-center">
                <div className="text-lg font-mono text-cyan-400">{metrics.totalXP || 0}</div>
                <div className="text-[10px] text-white/50">Total XP</div>
              </div>
              <div className="bg-white/5 rounded p-2 text-center">
                <div className="text-lg font-mono text-purple-400">{metrics.avgLevel || 1}</div>
                <div className="text-[10px] text-white/50">Avg Level</div>
              </div>
              <div className="bg-white/5 rounded p-2 text-center">
                <div className="text-lg font-mono text-green-400">{metrics.verifiedUsers || 0}</div>
                <div className="text-[10px] text-white/50">Verified</div>
              </div>
              <div className="bg-white/5 rounded p-2 text-center">
                <div className="text-lg font-mono text-yellow-400">98%</div>
                <div className="text-[10px] text-white/50">Uptime</div>
              </div>
            </div>
          </div>
        </DraggableWidget>
      )}

      {widgetVisibility.heartbeat !== false && (
        <DraggableWidget key={`heartbeat-${positionResetKey}`} id="heartbeat" positions={widgetPositions} onPositionChange={handlePositionChange} className="w-48">
          <div className="p-3">
            <div className="text-xs text-white/50 uppercase tracking-wider mb-2 flex items-center gap-2">
              <Activity className="w-3 h-3 text-red-400" />
              Network Pulse
            </div>
            <div className="flex items-center justify-center py-2">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center"
              >
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut", delay: 0.1 }}
                  className="w-4 h-4 rounded-full bg-red-500"
                />
              </motion.div>
            </div>
            <div className="text-center text-xs text-white/60 font-mono">
              <span className="text-green-400">●</span> All Systems Operational
            </div>
          </div>
        </DraggableWidget>
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
  activeTrayPanel: 'wifi' | 'volume' | 'battery' | 'notifications' | 'upgrade' | null;
  onTrayPanelToggle: (panel: 'wifi' | 'volume' | 'battery' | 'notifications' | 'upgrade') => void;
  volume: number;
  onVolumeChange: (v: number) => void;
  isMuted: boolean;
  onMuteToggle: () => void;
  batteryInfo: { level: number; charging: boolean } | null;
  onClearNotification: (index: number) => void;
  onClearAllNotifications: () => void;
  desktopWindowCounts: number[];
  openIframeWindow?: (url: string, title: string) => void;
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

function Taskbar({ windows, activeWindowId, apps, time, showStartMenu, user, isAuthenticated, notifications, showNotifications, onToggleStartMenu, onToggleNotifications, onWindowClick, onAppClick, onLogout, onNavigate, currentDesktop, onDesktopChange, clearanceTheme, onSwitchClearance, activeTrayPanel, onTrayPanelToggle, volume, onVolumeChange, isMuted, onMuteToggle, batteryInfo, onClearNotification, onClearAllNotifications, desktopWindowCounts, openIframeWindow }: TaskbarProps) {
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
              className={`h-7 w-7 flex items-center justify-center rounded-md transition-colors relative ${
                activeWindowId === window.id && !window.minimized
                  ? 'bg-cyan-500/20'
                  : window.minimized ? 'bg-white/5 hover:bg-white/10' : 'bg-white/10 hover:bg-white/15'
              }`}
              title={window.title}
              data-testid={`taskbar-${window.id}`}
            >
              <div 
                className="w-4 h-4 flex items-center justify-center [&>svg]:w-4 [&>svg]:h-4"
                style={{ color: activeWindowId === window.id && !window.minimized ? '#06b6d4' : window.minimized ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.7)' }}
              >
                {window.icon}
              </div>
              {!window.minimized && (
                <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-3 h-0.5 rounded-full bg-cyan-400" />
              )}
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
            onClick={() => onTrayPanelToggle('upgrade')} 
            className={`p-1.5 rounded transition-colors relative ${activeTrayPanel === 'upgrade' ? 'bg-yellow-500/30 text-yellow-400' : 'hover:bg-yellow-500/20 text-yellow-400'}`}
            data-testid="tray-upgrade"
          >
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              <Zap className="w-4 h-4" />
            </motion.div>
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-500 rounded-full animate-ping" />
          </button>
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

            {activeTrayPanel === 'upgrade' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute bottom-10 right-0 w-72 bg-slate-900/95 backdrop-blur-xl border border-yellow-500/50 rounded-lg shadow-2xl overflow-hidden"
                style={{ zIndex: 9999 }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-3 border-b border-yellow-500/30 bg-yellow-500/10">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-400" />
                    <span className="text-yellow-400 text-sm font-mono uppercase">System Alert</span>
                  </div>
                </div>
                <div className="p-4 space-y-4">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto rounded-full bg-yellow-500/20 border-2 border-yellow-500/50 flex items-center justify-center mb-3">
                      <Zap className="w-8 h-8 text-yellow-400" />
                    </div>
                    <div className="text-white font-bold mb-1">Architect Access Available</div>
                    <div className="text-white/60 text-sm">
                      Upgrade your permissions to access the Source Code.
                    </div>
                  </div>
                  <div className="border border-yellow-500/20 bg-yellow-500/5 rounded p-3 text-xs space-y-1">
                    <div className="flex items-center gap-2 text-white/70">
                      <Shield className="w-3 h-3 text-yellow-400" /> Full system access
                    </div>
                    <div className="flex items-center gap-2 text-white/70">
                      <Network className="w-3 h-3 text-yellow-400" /> Network directory slot
                    </div>
                    <div className="flex items-center gap-2 text-white/70">
                      <Globe className="w-3 h-3 text-yellow-400" /> .aethex namespace
                    </div>
                  </div>
                  <button
                    onClick={async () => {
                      try {
                        await fetch('/api/track/upgrade-click', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ source: 'tray-upgrade', timestamp: new Date().toISOString() }),
                        });
                      } catch {}
                      try {
                        const resp = await fetch('/api/payments/create-checkout-session', { method: 'POST' });
                        if (resp.ok) {
                          const data = await resp.json();
                          if (data?.url) {
                            openIframeWindow?.(data.url, 'Architect Access');
                            return;
                          }
                        }
                      } catch {}
                      openIframeWindow?.('https://aethex.studio', 'The Foundry');
                    }}
                    className="block w-full text-center px-4 py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-bold uppercase tracking-wider transition-colors text-sm"
                  >
                    Upgrade Now — $500
                  </button>
                  <div className="text-center text-xs text-white/40">
                    Hint: Check the terminal for promo codes
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
          "║ ping       - Check network status         ║",
          "║ whois      - Look up architect profile    ║",
          "║ passport   - View passport status         ║",
          "║ tour       - AeThex guided tour           ║",
          "╠═══════════════════════════════════════════╣",
          "║        🛡️ AEGIS SECURITY COMMANDS          ║",
          "╠═══════════════════════════════════════════╣",
          "║ aegis      - Aegis security dashboard     ║",
          "║ threat     - Check current threat level   ║",
          "║ firewall   - View firewall status         ║",
          "║ shield     - Activate/check shield        ║",
          "║ trace      - Trace network connection     ║",
          "║ encrypt    - Encrypt a message            ║",
          "║ decrypt    - Decrypt secure message       ║",
          "║ analyze    - Run security analysis        ║",
          "╠═══════════════════════════════════════════╣",
          "║           🎮 FUN COMMANDS                  ║",
          "╠═══════════════════════════════════════════╣",
          "║ hack       - ??? (try it)                 ║",
          "║ fortune    - Random architect wisdom      ║",
          "║ matrix     - Enter the matrix             ║",
          "║ dice       - Roll two dice                ║",
          "║ cowsay     - Make a cow say something     ║",
          "║ joke       - Tell a programmer joke       ║",
          "║ coffee     - Brew some coffee             ║",
          "╠═══════════════════════════════════════════╣",
          "║ whoami     - Current user info            ║",
          "║ neofetch   - System information           ║",
          "║ weather    - Metaverse weather report     ║",
          "║ uptime     - System uptime                ║",
          "║ banner     - Show AeThex banner           ║",
          "║ clear      - Clear terminal               ║",
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

      case 'aegis':
        await typeEffect([
          "",
          "╔══════════════════════════════════════════════════╗",
          "║         🛡️ AEGIS SECURITY DASHBOARD 🛡️           ║",
          "╠══════════════════════════════════════════════════╣",
          "║                                                  ║",
          "║  Status:        ████████████ ACTIVE              ║",
          "║  Shield Level:  ████████████ MAXIMUM             ║",
          "║  Encryption:    AES-256-GCM                      ║",
          "║  Protocol:      QUANTUM-RESISTANT                ║",
          "║                                                  ║",
          "╠══════════════════════════════════════════════════╣",
          "║  RECENT ACTIVITY:                                ║",
          "║  ├─ 0 intrusion attempts blocked (24h)           ║",
          "║  ├─ 42 secure sessions active                    ║",
          "║  ├─ Last scan: 2 minutes ago                     ║",
          "║  └─ Next scheduled: 5 minutes                    ║",
          "║                                                  ║",
          "╠══════════════════════════════════════════════════╣",
          "║  COMMANDS: threat, firewall, shield, trace       ║",
          "╚══════════════════════════════════════════════════╝",
          ""
        ], setHistory);
        break;

      case 'threat':
        setHistory(prev => [...prev, "Analyzing threat landscape..."]);
        await progressBar("SCANNING", 12);
        await delay(300);
        const threatLevels = ['LOW', 'LOW', 'LOW', 'MINIMAL', 'MEDIUM'];
        const currentThreat = threatLevels[Math.floor(Math.random() * threatLevels.length)];
        const threatColor = currentThreat === 'LOW' || currentThreat === 'MINIMAL' ? '🟢' : currentThreat === 'MEDIUM' ? '🟡' : '🔴';
        await typeEffect([
          "",
          "┌─────────────────────────────────────────┐",
          "│        AEGIS THREAT ASSESSMENT          │",
          "├─────────────────────────────────────────┤",
          `│  Current Level: ${threatColor} ${currentThreat.padEnd(20)}│`,
          "│                                         │",
          "│  Perimeter:     ✓ Secure                │",
          "│  Endpoints:     ✓ Protected             │",
          "│  Data Layer:    ✓ Encrypted             │",
          "│  Identity:      ✓ Verified              │",
          "│                                         │",
          "│  Last Incident: None recorded           │",
          "└─────────────────────────────────────────┘",
          ""
        ], setHistory);
        break;

      case 'firewall':
        await typeEffect([
          "",
          "╔══════════════════════════════════════════════════╗",
          "║            AEGIS FIREWALL STATUS                 ║",
          "╠══════════════════════════════════════════════════╣",
          "║                                                  ║",
          "║  ┌─────────────────────────────────────────────┐ ║",
          "║  │ RULE SET: PARANOID                          │ ║",
          "║  └─────────────────────────────────────────────┘ ║",
          "║                                                  ║",
          "║  ACTIVE RULES:                                   ║",
          "║  ├─ DENY    all inbound      (default)           ║",
          "║  ├─ ALLOW   443/tcp          (HTTPS)             ║",
          "║  ├─ ALLOW   80/tcp           (HTTP redirect)     ║",
          "║  ├─ ALLOW   aethex.network   (trusted)           ║",
          "║  └─ DROP    known-attackers  (blocklist)         ║",
          "║                                                  ║",
          "║  Packets Inspected: 1,247,892                    ║",
          "║  Threats Blocked:   0                            ║",
          "║                                                  ║",
          "╚══════════════════════════════════════════════════╝",
          ""
        ], setHistory);
        break;

      case 'shield':
        const shieldMode = args[1]?.toLowerCase();
        if (shieldMode === 'activate' || shieldMode === 'on') {
          setHistory(prev => [...prev, "Activating enhanced shield mode..."]);
          await progressBar("DEPLOYING SHIELD", 15);
          await delay(300);
          await typeEffect([
            "",
            "        ╔════════════════════╗",
            "       ╔╝                    ╚╗",
            "      ╔╝    🛡️ AEGIS SHIELD    ╚╗",
            "     ╔╝         ACTIVE          ╚╗",
            "    ╔╝                            ╚╗",
            "   ╔╝      ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓        ╚╗",
            "   ║       QUANTUM BARRIER          ║",
            "   ╚╗      ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓        ╔╝",
            "    ╚╗                            ╔╝",
            "     ╚╗   Protection: MAXIMUM    ╔╝",
            "      ╚╗                        ╔╝",
            "       ╚╗                      ╔╝",
            "        ╚══════════════════════╝",
            "",
            "Shield mode activated. You are now protected.",
            ""
          ], setHistory);
        } else if (shieldMode === 'status') {
          await typeEffect([
            "",
            "Shield Status: ACTIVE",
            "Protection Level: MAXIMUM",
            "Uptime: 99.999%",
            ""
          ], setHistory);
        } else {
          setHistory(prev => [...prev, "Usage: shield <activate|status>", ""]);
        }
        break;

      case 'trace':
        const traceTarget = args[1] || 'aethex.network';
        setHistory(prev => [...prev, `Initiating trace route to ${traceTarget}...`]);
        await delay(200);
        const hops = [
          { ip: '192.168.1.1', name: 'local-gateway', time: '0.5ms' },
          { ip: '10.0.0.1', name: 'isp-router', time: '12ms' },
          { ip: '72.14.192.1', name: 'core-switch', time: '18ms' },
          { ip: '42.42.42.1', name: 'aegis-gateway', time: '22ms' },
          { ip: '42.42.42.42', name: 'aethex.network', time: '24ms' },
        ];
        await typeEffect(["", `traceroute to ${traceTarget} (42.42.42.42), 30 hops max`, ""], setHistory);
        for (let i = 0; i < hops.length; i++) {
          await delay(300);
          setHistory(prev => [...prev, ` ${i + 1}  ${hops[i].ip.padEnd(15)} ${hops[i].name.padEnd(20)} ${hops[i].time}`]);
        }
        await typeEffect([
          "",
          "✓ Trace complete. Connection secure.",
          `  End-to-end encryption: VERIFIED`,
          `  Route integrity: VERIFIED`,
          ""
        ], setHistory);
        break;

      case 'encrypt':
        const msgToEncrypt = args.slice(1).join(' ');
        if (!msgToEncrypt) {
          setHistory(prev => [...prev, "Usage: encrypt <message>", ""]);
          break;
        }
        setHistory(prev => [...prev, "Encrypting message..."]);
        await progressBar("ENCRYPTING", 8);
        await delay(200);
        // Generate fake encrypted output efficiently (fixed length)
        const encryptedParts: string[] = [];
        for (let i = 0; i < 24; i++) {
          encryptedParts.push(Math.random().toString(16).substr(2, 2));
        }
        const encrypted = encryptedParts.join('');
        await typeEffect([
          "",
          "╔════════════════════════════════════════════════╗",
          "║         AEGIS ENCRYPTION COMPLETE              ║",
          "╠════════════════════════════════════════════════╣",
          "║ Algorithm: AES-256-GCM                         ║",
          "║ Key Size:  256-bit                             ║",
          "╠════════════════════════════════════════════════╣",
          "║ ENCRYPTED OUTPUT:                              ║",
          `║ ${encrypted.slice(0, 44)}... ║`,
          "╚════════════════════════════════════════════════╝",
          "",
          "Message encrypted. Only authorized recipients can decrypt.",
          ""
        ], setHistory);
        break;

      case 'passport':
        try {
          const sessRes = await fetch('/api/auth/session', { credentials: 'include' });
          const sessData = await sessRes.json();
          if (sessData?.authenticated) {
            await typeEffect([
              "",
              "╔══════════════════════════════════════════════════╗",
              "║            AETHEX PASSPORT - VERIFIED            ║",
              "╠══════════════════════════════════════════════════╣",
              `║ Username:    ${(sessData.user.username || 'Unknown').padEnd(35)}║`,
              `║ Status:      AUTHENTICATED                       ║`,
              `║ Role:        ${(sessData.user.isAdmin ? 'ADMINISTRATOR' : 'ARCHITECT').padEnd(35)}║`,
              "║ Session:     ACTIVE                              ║",
              "╚══════════════════════════════════════════════════╝",
              ""
            ], setHistory);
          } else {
            setHistory(prev => [...prev, "", "PASSPORT: No active session", "Use the Passport app to authenticate.", ""]);
          }
        } catch {
          setHistory(prev => [...prev, "ERROR: Could not verify passport status", ""]);
        }
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

function PassportApp({ onLoginSuccess, isDesktopLocked }: { onLoginSuccess?: () => void; isDesktopLocked?: boolean }) {
  const { user, isAuthenticated, login, signup, logout } = useAuth();
  const [mode, setMode] = useState<'view' | 'login' | 'signup'>(() => 
    isDesktopLocked && !isAuthenticated ? 'login' : 'view'
  );
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { data: metrics } = useQuery({
    queryKey: ['os-metrics'],
    queryFn: async () => {
      const res = await fetch('/api/metrics');
      return res.json();
    },
  });
  
  const { data: userProfile } = useQuery({
    queryKey: ['os-my-profile'],
    queryFn: async () => {
      const res = await fetch('/api/me/profile', { credentials: 'include' });
      if (!res.ok) return null;
      return res.json();
    },
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (isAuthenticated && isDesktopLocked && onLoginSuccess) {
      onLoginSuccess();
    }
  }, [isAuthenticated, isDesktopLocked, onLoginSuccess]);

  useEffect(() => {
    if (isAuthenticated) {
      setMode('view');
    }
  }, [isAuthenticated]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await login(email, password);
      setMode('view');
      if (onLoginSuccess) onLoginSuccess();
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await signup(email, password, username || undefined);
      setMode('login');
      setError('Account created! Please sign in.');
    } catch (err: any) {
      setError(err.message || 'Signup failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (mode === 'login' || mode === 'signup') {
    return (
      <div className="h-full p-6 bg-gradient-to-b from-slate-900 to-slate-950 overflow-auto">
        <div className="border border-cyan-400/30 rounded-lg p-6 bg-slate-900/50 max-w-sm mx-auto">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 mb-4">
              <Key className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl font-display text-white uppercase tracking-wider">
              {mode === 'login' ? 'Sign In' : 'Create Account'}
            </h2>
            <p className="text-cyan-400 text-sm font-mono mt-1">AeThex Passport</p>
          </div>

          <form onSubmit={mode === 'login' ? handleLogin : handleSignup} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-white/50 text-xs mb-1 font-mono">USERNAME</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-black/50 border border-cyan-500/30 rounded px-3 py-2 text-white font-mono text-sm focus:border-cyan-400 focus:outline-none"
                  placeholder="architect_name"
                  data-testid="passport-username"
                />
              </div>
            )}
            <div>
              <label className="block text-white/50 text-xs mb-1 font-mono">EMAIL</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-black/50 border border-cyan-500/30 rounded px-3 py-2 text-white font-mono text-sm focus:border-cyan-400 focus:outline-none"
                placeholder="you@example.com"
                required
                data-testid="passport-email"
              />
            </div>
            <div>
              <label className="block text-white/50 text-xs mb-1 font-mono">PASSWORD</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black/50 border border-cyan-500/30 rounded px-3 py-2 text-white font-mono text-sm focus:border-cyan-400 focus:outline-none"
                placeholder="••••••••"
                required
                data-testid="passport-password"
              />
            </div>

            {error && (
              <div className={`text-sm font-mono p-2 rounded ${error.includes('created') ? 'text-green-400 bg-green-500/10' : 'text-red-400 bg-red-500/10'}`}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-mono font-bold uppercase tracking-wider transition-colors disabled:opacity-50"
              data-testid="passport-submit"
            >
              {isSubmitting ? 'Processing...' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <div className="mt-4 text-center">
            <button
              onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); }}
              className="text-cyan-400 hover:text-cyan-300 text-sm font-mono"
              data-testid="passport-toggle-mode"
            >
              {mode === 'login' ? 'Need an account? Sign up' : 'Already have an account? Sign in'}
            </button>
          </div>

          {isDesktopLocked && (
            <div className="mt-4 pt-4 border-t border-white/10 text-center">
              <button
                onClick={onLoginSuccess}
                className="text-white/40 hover:text-white/60 text-xs font-mono"
                data-testid="passport-skip-guest"
              >
                Continue as Guest
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Calculate XP progress for current level (with safe guards)
  const currentLevel = Math.max(1, userProfile?.level || 1);
  const totalXp = Math.max(0, userProfile?.total_xp || 0);
  const xpPerLevel = 1000;
  const xpForCurrentLevel = (currentLevel - 1) * xpPerLevel;
  const xpForNextLevel = currentLevel * xpPerLevel;
  const xpDelta = xpForNextLevel - xpForCurrentLevel;
  const xpProgress = xpDelta > 0 ? Math.min(100, Math.max(0, ((totalXp - xpForCurrentLevel) / xpDelta) * 100)) : 0;
  const passportId = userProfile?.aethex_passport_id || user?.id?.slice(0, 8).toUpperCase() || 'GUEST';
  const skills = Array.isArray(userProfile?.skills) ? userProfile.skills : [];

  return (
    <div className="h-full p-4 bg-gradient-to-b from-slate-900 via-slate-950 to-black overflow-auto">
      {/* Credential Card */}
      <div className="relative max-w-sm mx-auto">
        {/* Holographic background effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 via-purple-500/20 to-pink-500/20 rounded-xl blur-xl" />
        
        <motion.div 
          className="relative border-2 border-cyan-400/50 rounded-xl overflow-hidden bg-gradient-to-br from-slate-900/95 to-slate-950/95 backdrop-blur-xl"
          initial={{ rotateY: -5 }}
          animate={{ rotateY: 0 }}
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* Holographic stripe */}
          <div className="h-2 bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500" />
          
          {/* Card header */}
          <div className="p-4 pb-0">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center">
                  <span className="text-xl font-display font-bold text-white">A</span>
                </div>
                <div>
                  <div className="text-xs text-white/50 uppercase tracking-wider">AeThex</div>
                  <div className="text-sm font-display text-cyan-400">PASSPORT</div>
                </div>
              </div>
              {isAuthenticated && (
                <motion.div 
                  className="flex items-center gap-1 px-2 py-1 bg-green-500/20 border border-green-500/50 rounded-full"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-xs font-mono text-green-400">VERIFIED</span>
                </motion.div>
              )}
            </div>
            
            {/* Avatar and name section */}
            <div className="flex items-center gap-4 mb-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 p-0.5">
                  <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center overflow-hidden">
                    {userProfile?.avatar_url ? (
                      <img src={userProfile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-8 h-8 text-white/70" />
                    )}
                  </div>
                </div>
                {isAuthenticated && (
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center border-2 border-slate-900">
                    <span className="text-xs font-bold text-white">{currentLevel}</span>
                  </div>
                )}
              </div>
              <div className="flex-1">
                <div className="text-lg font-display text-white uppercase tracking-wide">
                  {isAuthenticated ? (userProfile?.full_name || user?.username) : 'Guest'}
                </div>
                <div className="text-sm text-cyan-400 font-mono">
                  @{isAuthenticated ? user?.username : 'visitor'}
                </div>
                <div className="text-xs text-purple-400 font-mono mt-0.5">
                  {isAuthenticated ? (user?.isAdmin ? 'ADMINISTRATOR' : (userProfile?.role?.toUpperCase() || 'ARCHITECT')) : 'VISITOR'}
                </div>
              </div>
            </div>
          </div>
          
          {/* Passport ID */}
          <div className="px-4 pb-3">
            <div className="flex items-center justify-between p-2 bg-black/40 rounded border border-white/10">
              <div>
                <div className="text-[10px] text-white/40 uppercase tracking-wider">Passport ID</div>
                <div className="text-sm font-mono text-cyan-300 tracking-wider">{passportId}</div>
              </div>
              <IdCard className="w-5 h-5 text-white/30" />
            </div>
          </div>
          
          {/* XP Progress - Only for authenticated users */}
          {isAuthenticated && (
            <div className="px-4 pb-3">
              <div className="flex justify-between text-xs font-mono mb-1">
                <span className="text-white/50">Level {currentLevel}</span>
                <span className="text-cyan-400">{totalXp.toLocaleString()} XP</span>
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-cyan-500 to-purple-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${xpProgress}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                />
              </div>
              <div className="text-[10px] text-white/30 text-right mt-0.5 font-mono">
                {Math.round(xpForNextLevel - totalXp)} XP to Level {currentLevel + 1}
              </div>
            </div>
          )}
          
          {/* Skills */}
          {isAuthenticated && skills.length > 0 && (
            <div className="px-4 pb-3">
              <div className="text-[10px] text-white/40 uppercase tracking-wider mb-2">Skills</div>
              <div className="flex flex-wrap gap-1">
                {(skills as string[]).slice(0, 6).map((skill, i) => (
                  <span key={i} className="px-2 py-0.5 bg-purple-500/20 border border-purple-500/30 rounded text-xs text-purple-300 font-mono">
                    {skill}
                  </span>
                ))}
                {skills.length > 6 && (
                  <span className="px-2 py-0.5 text-xs text-white/40 font-mono">+{skills.length - 6}</span>
                )}
              </div>
            </div>
          )}
          
          {/* Stats row */}
          <div className="px-4 pb-4">
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center p-2 bg-white/5 rounded">
                <div className="text-lg font-bold text-cyan-400">{metrics?.totalProfiles || 0}</div>
                <div className="text-[10px] text-white/40 uppercase">Network</div>
              </div>
              <div className="text-center p-2 bg-white/5 rounded">
                <div className="text-lg font-bold text-purple-400">{metrics?.totalProjects || 0}</div>
                <div className="text-[10px] text-white/40 uppercase">Projects</div>
              </div>
              <div className="text-center p-2 bg-white/5 rounded">
                <div className="text-lg font-bold text-green-400">{userProfile?.loyalty_points || 0}</div>
                <div className="text-[10px] text-white/40 uppercase">Points</div>
              </div>
            </div>
          </div>
          
          {/* Actions */}
          <div className="px-4 pb-4">
            {!isAuthenticated ? (
              <motion.button
                onClick={() => setMode('login')}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-3 bg-gradient-to-r from-cyan-500 to-cyan-400 hover:from-cyan-400 hover:to-cyan-300 text-black font-mono font-bold uppercase tracking-wider transition-all shadow-lg shadow-cyan-500/30"
                data-testid="passport-signin-btn"
              >
                Authenticate
              </motion.button>
            ) : (
              <button
                onClick={() => logout()}
                className="w-full py-2 border border-red-500/30 text-red-400/80 hover:bg-red-500/10 font-mono uppercase tracking-wider transition-colors text-sm"
                data-testid="passport-logout-btn"
              >
                Sign Out
              </button>
            )}
          </div>
          
          {/* Footer */}
          <div className="px-4 pb-3 pt-2 border-t border-white/10 flex items-center justify-between">
            <div className="text-[10px] text-white/30 font-mono">
              Issued by Codex Authority
            </div>
            <div className="flex items-center gap-1">
              <Shield className="w-3 h-3 text-cyan-400/50" />
              <span className="text-[10px] text-cyan-400/50 font-mono">AEGIS</span>
            </div>
          </div>
        </motion.div>
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
    <div className="min-h-full bg-slate-950 flex flex-col">
      <div className="flex items-center gap-2 p-2 bg-slate-900 border-b border-white/10">
        <div className="flex-1 bg-slate-800 rounded px-3 py-1.5 text-white/60 text-xs md:text-sm font-mono overflow-x-auto whitespace-nowrap">
          /home/architect/projects
        </div>
      </div>
      <div className="flex-1 p-3 md:p-4 overflow-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 md:gap-4 mb-4">
              <div className="bg-white/5 rounded-lg p-3 md:p-4 border border-white/10">
                <FolderOpen className="w-5 h-5 md:w-6 md:h-6 text-cyan-400 mb-2" />
                <div className="text-xs text-white/50">Total Projects</div>
                <div className="text-lg md:text-xl font-bold text-white">{metrics?.totalProjects || 0}</div>
              </div>
              <div className="bg-white/5 rounded-lg p-3 md:p-4 border border-white/10">
                <User className="w-5 h-5 md:w-6 md:h-6 text-purple-400 mb-2" />
                <div className="text-xs text-white/50">Architects</div>
                <div className="text-lg md:text-xl font-bold text-white">{metrics?.totalProfiles || 0}</div>
              </div>
            </div>
            
            <div className="text-xs text-white/50 uppercase tracking-wider">Project Files</div>
            {projects?.length > 0 ? (
              <div className="space-y-2">
                {projects.map((p: any) => (
                  <div key={p.id} className="flex items-center gap-3 p-3 bg-white/5 rounded border border-white/10 hover:border-cyan-500/30 transition-colors active:bg-white/10">
                    <FolderOpen className="w-5 h-5 text-cyan-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-white text-sm truncate">{p.title}</div>
                      <div className="text-white/40 text-xs">{p.engine || 'Unknown engine'}</div>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded shrink-0 ${p.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-white/10 text-white/50'}`}>
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
  const { user } = useAuth();
  
  const { data: userAchievements, isLoading: achievementsLoading } = useQuery({
    queryKey: ['/api/me/achievements'],
    enabled: !!user,
  });

  const { data: allAchievements, isLoading: allLoading } = useQuery({
    queryKey: ['/api/achievements'],
    enabled: !!user,
  });

  const isLoading = achievementsLoading || allLoading;

  // Create a set of unlocked achievement IDs
  const unlockedIds = new Set((userAchievements || []).map((a: any) => a.achievement_id || a.id));
  
  // Combine unlocked and locked achievements
  const achievements = [
    ...(userAchievements || []).map((a: any) => ({ ...a, unlocked: true })),
    ...(allAchievements || []).filter((a: any) => !unlockedIds.has(a.id)).map((a: any) => ({ ...a, unlocked: false }))
  ];

  return (
    <div className="min-h-full bg-slate-950 p-3 md:p-4 overflow-auto">
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="w-5 h-5 md:w-6 md:h-6 text-yellow-400" />
        <h2 className="text-base md:text-lg font-display text-white uppercase tracking-wider">Achievements</h2>
        <span className="ml-auto text-xs text-white/40 font-mono shrink-0">
          {(userAchievements || []).length} / {(allAchievements || []).length}
        </span>
      </div>
      
      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
        </div>
      ) : !user ? (
        <div className="text-center text-white/40 py-8">
          <Lock className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>Please log in to view achievements</p>
        </div>
      ) : achievements.length === 0 ? (
        <div className="text-center text-white/40 py-8">
          <Trophy className="w-12 h-12 mx-auto mb-2 opacity-30" />
          <p>No achievements available yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {achievements.map((achievement: any, index: number) => (
            <div key={achievement.id || index} className={`flex items-center gap-4 p-3 rounded-lg border ${achievement.unlocked ? 'bg-cyan-500/10 border-cyan-500/30' : 'bg-white/5 border-white/10 opacity-50'}`}>
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${achievement.unlocked ? 'bg-cyan-500/20' : 'bg-white/10'}`}>
                {achievement.unlocked ? <Trophy className="w-6 h-6 text-yellow-400" /> : <Lock className="w-6 h-6 text-white/30" />}
              </div>
              <div className="flex-1">
                <div className={`font-mono text-sm ${achievement.unlocked ? 'text-white' : 'text-white/50'}`}>
                  {achievement.title || achievement.name}
                </div>
                <div className="text-xs text-white/40">{achievement.description}</div>
                {achievement.xp_reward && (
                  <div className="text-xs text-cyan-400 mt-1">+{achievement.xp_reward} XP</div>
                )}
              </div>
              {achievement.unlocked && (
                <div className="text-green-400 text-xs font-mono uppercase tracking-wider">Unlocked</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function OpportunitiesApp() {
  const { data: opportunities, isLoading } = useQuery<any[]>({
    queryKey: ['/api/opportunities'],
  });

  const formatSalary = (min?: number, max?: number) => {
    if (!min && !max) return "Competitive";
    if (min && max) return `$${(min / 1000).toFixed(0)}k-${(max / 1000).toFixed(0)}k`;
    if (min) return `$${(min / 1000).toFixed(0)}k+`;
    return `$${(max! / 1000).toFixed(0)}k`;
  };

  return (
    <div className="min-h-full bg-slate-950 p-3 md:p-4 overflow-auto">
      <div className="flex items-center gap-2 mb-4">
        <Briefcase className="w-5 h-5 md:w-6 md:h-6 text-cyan-400" />
        <h2 className="text-base md:text-lg font-display text-white uppercase tracking-wider">Opportunities</h2>
        <span className="ml-auto text-xs text-white/40 font-mono shrink-0">
          {opportunities?.length || 0}
        </span>
      </div>
      
      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
        </div>
      ) : !opportunities || opportunities.length === 0 ? (
        <div className="text-center text-white/40 py-8">
          <Briefcase className="w-12 h-12 mx-auto mb-2 opacity-30" />
          <p>No opportunities available</p>
        </div>
      ) : (
        <div className="space-y-3">
          {opportunities.map((opp: any) => (
            <div key={opp.id} className="bg-white/5 border border-white/10 p-3 md:p-4 hover:border-cyan-400/30 active:border-cyan-400 transition-all">
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="font-mono text-sm text-white font-semibold line-clamp-2 flex-1">{opp.title}</h3>
                <span className="text-cyan-400 font-mono text-xs whitespace-nowrap shrink-0">
                  {formatSalary(opp.salary_min, opp.salary_max)}
                </span>
              </div>
              <p className="text-xs text-white/60 mb-3 line-clamp-2">{opp.description}</p>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-400 border border-cyan-400/30 uppercase font-mono text-[10px]">
                  {opp.arm_affiliation}
                </span>
                <span className="text-white/40">{opp.job_type || 'Full-time'}</span>
                {opp.status === 'open' && (
                  <span className="ml-auto text-green-400 font-mono">● Open</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EventsApp() {
  const { data: events, isLoading } = useQuery<any[]>({
    queryKey: ['/api/events'],
  });

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="min-h-full bg-slate-950 p-3 md:p-4 overflow-auto">
      <div className="flex items-center gap-2 mb-4">
        <CalendarDays className="w-5 h-5 md:w-6 md:h-6 text-cyan-400" />
        <h2 className="text-base md:text-lg font-display text-white uppercase tracking-wider">Events</h2>
        <span className="ml-auto text-xs text-white/40 font-mono shrink-0">
          {events?.length || 0}
        </span>
      </div>
      
      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
        </div>
      ) : !events || events.length === 0 ? (
        <div className="text-center text-white/40 py-8">
          <CalendarDays className="w-12 h-12 mx-auto mb-2 opacity-30" />
          <p>No events scheduled</p>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((event: any) => (
            <div key={event.id} className="bg-white/5 border border-white/10 p-3 md:p-4 hover:border-cyan-400/30 active:border-cyan-400 transition-all">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-12 h-12 bg-cyan-500/20 border border-cyan-400/50 flex flex-col items-center justify-center text-cyan-400">
                  <div className="text-xs font-mono">{formatDate(event.date).split(' ')[0]}</div>
                  <div className="text-lg font-bold font-mono leading-none">{formatDate(event.date).split(' ')[1]}</div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="font-mono text-sm text-white font-semibold">{event.title}</h3>
                    {event.featured && <Star className="w-4 h-4 text-yellow-400 fill-current flex-shrink-0" />}
                  </div>
                  {event.description && (
                    <p className="text-xs text-white/60 mb-2 line-clamp-2">{event.description}</p>
                  )}
                  <div className="flex items-center gap-3 text-xs text-white/40">
                    {event.time && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {event.time}
                      </span>
                    )}
                    {event.location && (
                      <span className="flex items-center gap-1 truncate">
                        <MapPin className="w-3 h-3 flex-shrink-0" /> {event.location}
                      </span>
                    )}
                  </div>
                </div>
              </div>
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
    <div className="min-h-full bg-slate-950 flex flex-col">
      <div className="flex-1 p-3 md:p-4 overflow-auto space-y-3">
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
    <div className="min-h-full p-4 md:p-6 bg-slate-950 overflow-auto">
      <div className="max-w-lg mx-auto font-mono text-xs md:text-sm leading-relaxed">
        <h1 className="text-xl md:text-2xl font-display text-cyan-400 uppercase tracking-wider mb-4 md:mb-6">The AeThex Manifesto</h1>
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
    <div className="min-h-full p-3 md:p-4 bg-gradient-to-b from-purple-950/50 to-slate-950 flex flex-col">
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
    <div className="min-h-full bg-slate-950 p-3 md:p-4 overflow-auto relative">
      <div className="flex items-center gap-2 mb-4">
        <Network className="w-5 h-5 text-cyan-400" />
        <h2 className="text-base md:text-lg font-display text-white uppercase tracking-wider">Network Map</h2>
      </div>
      
      <div className="relative min-h-[400px] md:h-[calc(100%-60px)] flex items-center justify-center py-8">
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
  const layout = useLayout();
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
      <div className="min-h-full bg-slate-950 p-3 md:p-4">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-5 h-5 text-cyan-400" />
          <Skeleton className="h-6 w-32" />
        </div>
        <div className="grid grid-cols-2 gap-3 md:gap-4">
          <Skeleton className="h-24 md:h-28 rounded-lg" />
          <Skeleton className="h-24 md:h-28 rounded-lg" />
          <Skeleton className="h-24 md:h-28 rounded-lg" />
          <Skeleton className="h-24 md:h-28 rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-slate-950 p-3 md:p-4 overflow-auto">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-5 h-5 text-cyan-400" />
        <h2 className="text-base md:text-lg font-display text-white uppercase tracking-wider">Live Metrics</h2>
      </div>

      <div className="grid grid-cols-2 gap-3 md:gap-4 mb-4">
        <div className="bg-gradient-to-br from-cyan-500/20 to-cyan-500/5 rounded-lg p-3 md:p-4 border border-cyan-500/30">
          <div className="text-xs text-cyan-400 uppercase">Architects</div>
          <div className="text-2xl md:text-3xl font-bold text-white font-mono">{animatedValues.profiles}</div>
          <div className="flex items-center gap-1 text-green-400 text-xs mt-1">
            <ArrowUp className="w-3 h-3" /> +{Math.floor(Math.random() * 5) + 1} today
          </div>
        </div>
        <div className="bg-gradient-to-br from-purple-500/20 to-purple-500/5 rounded-lg p-3 md:p-4 border border-purple-500/30">
          <div className="text-xs text-purple-400 uppercase">Projects</div>
          <div className="text-2xl md:text-3xl font-bold text-white font-mono">{animatedValues.projects}</div>
          <div className="flex items-center gap-1 text-green-400 text-xs mt-1">
            <TrendingUp className="w-3 h-3" /> Active
          </div>
        </div>
        <div className="bg-gradient-to-br from-green-500/20 to-green-500/5 rounded-lg p-3 md:p-4 border border-green-500/30">
          <div className="text-xs text-green-400 uppercase">Total XP</div>
          <div className="text-2xl md:text-3xl font-bold text-white font-mono">{animatedValues.xp.toLocaleString()}</div>
        </div>
        <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-500/5 rounded-lg p-3 md:p-4 border border-yellow-500/30">
          <div className="text-xs text-yellow-400 uppercase">Online</div>
          <div className="text-2xl md:text-3xl font-bold text-white font-mono">{metrics?.onlineUsers || 0}</div>
          <div className="flex items-center gap-1 text-yellow-400 text-xs mt-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" /> Live
          </div>
        </div>
      </div>

      <div className="bg-white/5 rounded-lg p-3 md:p-4 border border-white/10">
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
    <div className="min-h-full bg-[#1e1e1e] flex flex-col">
      <div className="flex items-center gap-2 px-2 md:px-4 py-2 bg-[#252526] border-b border-[#3c3c3c] overflow-x-auto">
        <div className="flex items-center gap-2 px-2 md:px-3 py-1 bg-[#1e1e1e] rounded-t border-t-2 border-cyan-500 shrink-0">
          <Code2 className="w-3 h-3 md:w-4 md:h-4 text-cyan-400" />
          <span className="text-xs md:text-sm text-white/80">registry.ts</span>
          <span className="text-white/30 text-xs">~</span>
        </div>
        <div className="ml-auto flex items-center gap-2 shrink-0">
          <button className="text-[10px] md:text-xs text-white/50 hover:text-white/80 px-1.5 md:px-2 py-1 bg-white/5 rounded">Format</button>
          <button className="text-[10px] md:text-xs text-white/50 hover:text-white/80 px-1.5 md:px-2 py-1 bg-white/5 rounded">Run</button>
        </div>
      </div>
      
      <div className="flex-1 overflow-hidden relative touch-pan-x touch-pan-y">
        <div className="absolute inset-0 flex">
          <div className="w-8 md:w-12 bg-[#1e1e1e] border-r border-[#3c3c3c] pt-2 md:pt-4 text-right pr-1 md:pr-2 text-white/30 text-[10px] md:text-sm font-mono select-none overflow-hidden">
            {code.split('\n').map((_, i) => (
              <div key={i} className={`h-[1.5rem] ${cursorPos.line === i + 1 ? 'text-white/60' : ''}`}>{i + 1}</div>
            ))}
          </div>
          <div className="flex-1 relative">
            <div className="absolute inset-0 p-2 md:p-4 font-mono text-xs md:text-sm leading-5 md:leading-6 pointer-events-none overflow-auto whitespace-pre" style={{ color: '#d4d4d4' }}>
              {code.split('\n').map((line, i) => (
                <div key={i} className={`h-5 md:h-6 ${cursorPos.line === i + 1 ? 'bg-white/5' : ''}`} 
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
              className="absolute inset-0 p-2 md:p-4 font-mono text-xs md:text-sm leading-5 md:leading-6 bg-transparent text-transparent caret-white resize-none focus:outline-none"
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
      
      <div className="px-2 md:px-4 py-1.5 md:py-2 bg-[#007acc] text-white text-[10px] md:text-xs flex items-center gap-2 md:gap-4 overflow-x-auto">
        <span>TypeScript</span>
        <span>UTF-8</span>
        <span className="hidden sm:inline">Spaces: 2</span>
        <span className="ml-auto shrink-0">Ln {cursorPos.line}, Col {cursorPos.col}</span>
        <span className="text-white/60 hidden md:inline">Ctrl+Space for suggestions</span>
      </div>
    </div>
  );
}

function NewsFeedApp() {
  const { data: activities, isLoading, refetch } = useQuery({
    queryKey: ['activity-feed'],
    queryFn: async () => {
      const res = await fetch('/api/track/events?limit=20');
      if (!res.ok) return [];
      return res.json();
    },
  });

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const getEventType = (eventType: string) => {
    if (eventType.includes('achievement') || eventType.includes('unlock')) return 'success';
    if (eventType.includes('error') || eventType.includes('fail')) return 'warning';
    return 'info';
  };

  const formatEventTitle = (event: any) => {
    if (event.event_type === 'page_view') return `User viewed ${event.payload?.page || 'page'}`;
    if (event.event_type === 'app_open') return `${event.payload?.app || 'App'} opened`;
    if (event.event_type === 'achievement_unlock') return `Achievement unlocked: ${event.payload?.name || 'unknown'}`;
    return event.event_type.replace(/_/g, ' ');
  };

  const newsItems = activities?.length ? activities.map((a: any) => ({
    time: formatTime(a.timestamp),
    title: formatEventTitle(a),
    type: getEventType(a.event_type),
  })) : [
    { time: '2 min ago', title: 'New architect joined the network', type: 'info' },
    { time: '15 min ago', title: 'Project "Genesis" reached milestone', type: 'success' },
    { time: '1 hour ago', title: 'AEGIS blocked 3 intrusion attempts', type: 'warning' },
  ];

  return (
    <div className="min-h-full bg-slate-950 flex flex-col">
      <div className="flex items-center gap-2 p-3 md:p-4 border-b border-white/10">
        <Newspaper className="w-5 h-5 text-cyan-400" />
        <h2 className="text-base md:text-lg font-display text-white uppercase tracking-wider">News Feed</h2>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="ml-auto p-1.5 hover:bg-white/10 rounded transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 text-cyan-400 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
        </div>
      ) : (
      <div className="flex-1 overflow-auto p-3 md:p-4 space-y-3">
        {newsItems.map((item: any, i: number) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="p-3 bg-white/5 rounded-lg border border-white/10 hover:border-cyan-500/30 active:border-cyan-500/50 transition-colors"
          >
            <div className="flex items-start gap-3">
              <div className={`w-2 h-2 mt-2 rounded-full shrink-0 ${item.type === 'success' ? 'bg-green-500' : item.type === 'warning' ? 'bg-yellow-500' : 'bg-cyan-500'}`} />
              <div className="flex-1 min-w-0">
                <div className="text-white text-sm line-clamp-2">{item.title}</div>
                <div className="text-white/40 text-xs mt-1">{item.time}</div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      )}
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
    <div className="min-h-full bg-slate-950 p-3 md:p-4 flex flex-col items-center overflow-auto">
      <div className="flex items-center gap-2 mb-3 md:mb-4">
        <Gamepad2 className="w-5 h-5 text-cyan-400" />
        <h2 className="text-base md:text-lg font-display text-white uppercase tracking-wider">Cyber Snake</h2>
      </div>
      
      <div className="text-cyan-400 font-mono text-sm md:text-base mb-2">Score: {score}</div>
      
      <div className="grid gap-px bg-cyan-900/20 border border-cyan-500/30 rounded" style={{ gridTemplateColumns: 'repeat(20, 12px)' }}>
        {Array.from({ length: 400 }).map((_, i) => {
          const x = i % 20;
          const y = Math.floor(i / 20);
          const isSnake = snake.some(s => s.x === x && s.y === y);
          const isHead = snake[0]?.x === x && snake[0]?.y === y;
          const isFood = food.x === x && food.y === y;
          return (
            <div
              key={i}
              className={`w-3 h-3 ${isHead ? 'bg-cyan-400' : isSnake ? 'bg-green-500' : isFood ? 'bg-red-500' : 'bg-slate-900'}`}
            />
          );
        })}
      </div>

      {!isPlaying && (
        <button onClick={startGame} className="mt-3 md:mt-4 px-4 md:px-6 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 rounded-lg border border-cyan-500/50 transition-colors font-mono text-sm md:text-base">
          {gameOver ? 'Play Again' : 'Start Game'}
        </button>
      )}
      
      {isPlaying && (
        <div className="mt-3 md:mt-4 grid grid-cols-3 gap-2 md:hidden">
          <div />
          <button
            onClick={() => direction.y !== 1 && setDirection({ x: 0, y: -1 })}
            className="p-3 bg-cyan-500/20 active:bg-cyan-500/40 rounded border border-cyan-500/50 transition-colors"
          >
            <ChevronUp className="w-5 h-5 text-cyan-400 mx-auto" />
          </button>
          <div />
          <button
            onClick={() => direction.x !== 1 && setDirection({ x: -1, y: 0 })}
            className="p-3 bg-cyan-500/20 active:bg-cyan-500/40 rounded border border-cyan-500/50 transition-colors"
          >
            <ChevronUp className="w-5 h-5 text-cyan-400 mx-auto rotate-[270deg]" />
          </button>
          <div />
          <button
            onClick={() => direction.x !== -1 && setDirection({ x: 1, y: 0 })}
            className="p-3 bg-cyan-500/20 active:bg-cyan-500/40 rounded border border-cyan-500/50 transition-colors"
          >
            <ChevronUp className="w-5 h-5 text-cyan-400 mx-auto rotate-90" />
          </button>
          <div />
          <button
            onClick={() => direction.y !== -1 && setDirection({ x: 0, y: 1 })}
            className="p-3 bg-cyan-500/20 active:bg-cyan-500/40 rounded border border-cyan-500/50 transition-colors"
          >
            <ChevronUp className="w-5 h-5 text-cyan-400 mx-auto rotate-180" />
          </button>
          <div />
        </div>
      )}
      
      <div className="mt-2 text-white/40 text-xs text-center">
        <span className="md:inline hidden">Use arrow keys to move</span>
        <span className="md:hidden">Tap buttons to move</span>
      </div>
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
      <div className="min-h-full bg-slate-950 flex flex-col">
        <div className="flex items-center gap-2 p-3 md:p-4 border-b border-white/10">
          <Users className="w-5 h-5 text-cyan-400" />
          <Skeleton className="h-5 md:h-6 w-32 md:w-40" />
        </div>
        <div className="flex-1 overflow-auto p-3 md:p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="bg-slate-800/50 rounded-lg p-3 md:p-4 border border-white/10">
              <div className="flex items-center gap-3">
                <Skeleton className="w-12 h-12 rounded-full shrink-0" />
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
    <div className="min-h-full bg-slate-950 flex flex-col">
      <div className="flex items-center gap-2 p-3 md:p-4 border-b border-white/10">
        <Users className="w-5 h-5 text-cyan-400" />
        <h2 className="text-base md:text-lg font-display text-white uppercase tracking-wider">Architect Profiles</h2>
      </div>
      <div className="flex-1 overflow-auto p-3 md:p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
        {profiles?.map((profile: any) => (
          <motion.div
            key={profile.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg p-4 border border-white/10 hover:border-cyan-500/30 active:border-cyan-500 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${profile.verified ? 'bg-green-500/20 border-2 border-green-500' : 'bg-cyan-500/20 border border-cyan-500/50'}`}>
                <User className="w-6 h-6 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-white font-mono truncate">{profile.username || 'Anonymous'}</div>
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

function NetworkNeighborhoodApp({ openIframeWindow }: { openIframeWindow?: (url: string, title: string) => void }) {
  const { data: founders = [], isLoading } = useQuery({
    queryKey: ['network-neighborhood'],
    queryFn: async () => {
      const res = await fetch('/api/directory/architects');
      if (!res.ok) return [];
      return res.json();
    },
  });

  useEffect(() => {
    if (!isLoading) {
      fetch('/api/track/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_type: 'directory_view', source: 'networkneighborhood', payload: { count: founders.length }, timestamp: new Date().toISOString() })
      }).catch(() => {});
    }
  }, [isLoading]);

  const reservedSlots = Array.from({ length: Math.max(0, 7 - founders.length) }, (_, i) => ({
    id: `reserved-${i}`,
    name: "[LOCKED - REQUIRES ARCHITECT ACCESS]",
    role: "locked",
    isReserved: true,
  }));

  if (isLoading) {
    return (
      <div className="min-h-full bg-black flex flex-col font-mono">
        <div className="flex items-center gap-2 p-2.5 md:p-3 border-b border-cyan-500/30 bg-cyan-500/5">
          <Network className="w-4 h-4 text-cyan-400" />
          <span className="text-cyan-400 text-xs md:text-sm uppercase tracking-wider">Network Neighborhood</span>
        </div>
        <div className="flex-1 p-4 flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-black flex flex-col font-mono">
      <div className="flex items-center gap-2 p-2.5 md:p-3 border-b border-cyan-500/30 bg-cyan-500/5">
        <Network className="w-4 h-4 text-cyan-400" />
        <span className="text-cyan-400 text-xs md:text-sm uppercase tracking-wider">Network Neighborhood</span>
        <span className="text-cyan-500/40 text-xs ml-auto">{founders.length} nodes online</span>
      </div>
      <div className="flex-1 overflow-auto p-2 space-y-1">
        {founders.map((architect: any, idx: number) => (
          <motion.div
            key={architect.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="flex items-center justify-between py-2 px-2 md:px-3 border-l-2 border-cyan-500/40 bg-cyan-500/5 hover:bg-cyan-500/10 active:bg-cyan-500/15 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
              <span className="text-cyan-500/60 text-xs shrink-0">[{String(idx + 1).padStart(3, '0')}]</span>
              <div className="min-w-0">
                <span className="text-white font-bold text-xs md:text-sm truncate block">{architect.name}</span>
                <span className="text-cyan-500/50 text-xs hidden sm:inline">— {architect.role}</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
              <span className="text-xs text-cyan-500/40">Lv.{architect.level || 1}</span>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            </div>
          </motion.div>
        ))}
        {reservedSlots.map((slot: any, idx: number) => (
          <div
            key={slot.id}
            className="flex items-center justify-between py-2 px-2 md:px-3 border-l-2 border-yellow-500/30 bg-yellow-500/5 hover:bg-yellow-500/10 transition-colors"
          >
            <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
              <span className="text-yellow-500/50 text-xs shrink-0">[{String(founders.length + idx + 1).padStart(3, '0')}]</span>
              <span className="text-yellow-500/70 text-xs md:text-sm truncate">{slot.name}</span>
            </div>
            <button 
              onClick={() => openIframeWindow?.('https://aethex.studio', 'The Foundry')}
              className="text-xs text-yellow-500 hover:text-yellow-400 transition-colors uppercase tracking-wider flex items-center gap-1 shrink-0"
            >
              <span className="hidden sm:inline">Join</span> <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
      <div className="p-2 border-t border-cyan-500/20 text-center">
        <span className="text-cyan-500/40 text-xs">AETHEX.NETWORK // PUBLIC DIRECTORY</span>
      </div>
    </div>
  );
}

function FoundryApp({ openIframeWindow }: { openIframeWindow?: (url: string, title: string) => void }) {
  const [viewMode, setViewMode] = useState<'info' | 'enroll'>('info');
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);
  
  const basePrice = 500;
  const discount = promoApplied && promoCode.toUpperCase() === 'TERMINAL10' ? 0.10 : 0;
  const finalPrice = basePrice * (1 - discount);

  useEffect(() => {
    fetch('/api/track/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event_type: 'foundry_open', source: 'foundry-app', timestamp: new Date().toISOString() })
    }).catch(() => {});
  }, []);
  
  return (
    <div className="min-h-full bg-gradient-to-br from-yellow-950 to-black flex flex-col font-mono">
      <div className="flex items-center justify-between p-2.5 md:p-3 border-b border-yellow-500/30 bg-yellow-500/5">
        <div className="flex items-center gap-2">
          <Award className="w-4 h-4 text-yellow-400" />
          <span className="text-yellow-400 text-xs md:text-sm uppercase tracking-wider">FOUNDRY.EXE</span>
        </div>
        <div className="flex items-center gap-1 md:gap-2">
          <button 
            onClick={() => setViewMode('info')}
            className={`px-2 py-1 text-[10px] md:text-xs uppercase ${viewMode === 'info' ? 'bg-yellow-500 text-black' : 'text-yellow-400 hover:bg-yellow-500/20'} transition-colors`}
          >
            Info
          </button>
          <button 
            onClick={() => setViewMode('enroll')}
            className={`px-2 py-1 text-[10px] md:text-xs uppercase ${viewMode === 'enroll' ? 'bg-yellow-500 text-black' : 'text-yellow-400 hover:bg-yellow-500/20'} transition-colors`}
          >
            Enroll
          </button>
        </div>
      </div>
      
      {viewMode === 'info' ? (
        <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-6 text-center overflow-auto">
          <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-yellow-500/20 border-2 border-yellow-500/50 flex items-center justify-center mb-4 md:mb-6">
            <Award className="w-8 h-8 md:w-10 md:h-10 text-yellow-400" />
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-yellow-400 mb-2">The Foundry</h2>
          <p className="text-white/70 text-xs md:text-sm mb-4 md:mb-6 max-w-xs px-4 md:px-0">
            Train to become a certified Metaverse Architect. Learn the protocols. Join the network.
          </p>
          <div className="space-y-2 text-left text-xs md:text-sm text-white/60 mb-4 md:mb-6">
            <div className="flex items-center gap-2"><Zap className="w-3 h-3 md:w-4 md:h-4 text-yellow-400" /> 8-week intensive curriculum</div>
            <div className="flex items-center gap-2"><Shield className="w-3 h-3 md:w-4 md:h-4 text-yellow-400" /> AeThex Passport certification</div>
            <div className="flex items-center gap-2"><Users className="w-3 h-3 md:w-4 md:h-4 text-yellow-400" /> Join the architect network</div>
          </div>
          <button 
            onClick={() => setViewMode('enroll')}
            className="px-4 md:px-6 py-2.5 md:py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-sm md:text-base uppercase tracking-wider transition-colors flex items-center gap-2"
          >
            Enroll Now <ChevronRight className="w-4 h-4" />
          </button>
          <div className="mt-3 md:mt-4 text-xs text-yellow-500/50">
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
            
            <button 
              onClick={() => openIframeWindow?.('https://aethex.studio', 'The Foundry')}
              className="block w-full px-6 py-3 bg-yellow-500 hover:bg-yellow-400 text-black text-center font-bold uppercase tracking-wider transition-colors"
            >
              Complete Enrollment
            </button>
            
            <p className="text-center text-white/40 text-xs">
              Opens enrollment form
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function DevToolsApp({ openIframeWindow }: { openIframeWindow?: (url: string, title: string) => void }) {
  const tools = [
    { name: "Documentation", desc: "API reference & guides", url: "https://aethex.dev", icon: <FileText className="w-5 h-5" /> },
    { name: "GitHub", desc: "Open source repositories", url: "https://github.com/aethex", icon: <Code2 className="w-5 h-5" /> },
    { name: "Status Page", desc: "System uptime & health", url: "#", icon: <Activity className="w-5 h-5" /> },
  ];

  return (
    <div className="min-h-full bg-slate-950 flex flex-col font-mono">
      <div className="flex items-center gap-2 p-2.5 md:p-3 border-b border-purple-500/30 bg-purple-500/5">
        <Code2 className="w-4 h-4 text-purple-400" />
        <span className="text-purple-400 text-xs md:text-sm uppercase tracking-wider">Dev Tools</span>
      </div>
      <div className="flex-1 overflow-auto p-3 md:p-4 space-y-2 md:space-y-3">
        {tools.map((tool, idx) => (
          <button
            key={idx}
            onClick={() => tool.url !== '#' && openIframeWindow?.(tool.url, tool.name)}
            className="w-full flex items-center gap-3 md:gap-4 p-3 md:p-4 border border-purple-500/20 bg-purple-500/5 hover:bg-purple-500/10 active:bg-purple-500/15 transition-colors rounded-lg text-left"
          >
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
              {tool.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-white font-bold text-sm md:text-base truncate">{tool.name}</div>
              <div className="text-purple-400/60 text-xs md:text-sm truncate">{tool.desc}</div>
            </div>
            <ExternalLink className="w-3 h-3 md:w-4 md:h-4 text-purple-400/40 shrink-0" />
          </button>
        ))}
      </div>
    </div>
  );
}

function IntelApp() {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  
  const files = [
    { 
      name: "CROSS_PLATFORM_REPORT.TXT", 
      icon: <FileText className="w-4 h-4" />,
      content: `// INTERCEPTED REPORT //
SOURCE: NAAVIK RESEARCH
SUBJECT: THE FUTURE OF CROSS-PLATFORM

========================================
KEY FINDINGS
========================================

1. The "Walled Gardens" (Sony/MSFT) are failing.
   
   Platform holders are losing grip on exclusive
   ecosystems. Users demand portability.

2. Users demand a "Neutral Identity Layer."
   
   Cross-platform identity is the #1 requested
   feature among gaming audiences globally.

3. Developers need "Direct-to-Consumer" infrastructure.
   
   30% platform cuts are unsustainable. The next
   generation of creators will build direct.

========================================
AETHEX ANALYSIS
========================================

This validates the AEGIS Protocol. 

The industry is currently seeking the exact
solution we have already built:

  - Neutral identity layer   ✓ DEPLOYED
  - Cross-platform passport  ✓ DEPLOYED
  - Direct-to-consumer infra ✓ IN PROGRESS

========================================
STATUS
========================================

- Passport:  DEPLOYED
- CloudOS:   DEPLOYED
- Foundry:   OPEN FOR ENROLLMENT

// END TRANSMISSION //`
    },
    {
      name: "MARKET_THESIS.TXT",
      icon: <TrendingUp className="w-4 h-4" />,
      content: `// MARKET THESIS //
CLASSIFICATION: INTERNAL

========================================
THE OPPORTUNITY
========================================

Total Addressable Market (TAM):
$200B+ Metaverse Economy by 2030

Our Position:
Identity & Infrastructure Layer

========================================
COMPETITIVE MOAT
========================================

1. First-mover on neutral identity
2. Architect certification network
3. .aethex TLD namespace ownership
4. Aegis security protocol

========================================
REVENUE MODEL
========================================

- Foundry Certifications: $500/architect
- Enterprise Licensing: TBD
- Namespace Reservations: TBD

// END DOCUMENT //`
    }
  ];

  return (
    <div className="min-h-full bg-black flex flex-col font-mono">
      <div className="flex items-center gap-2 p-2.5 md:p-3 border-b border-amber-500/30 bg-amber-500/5">
        <FolderSearch className="w-4 h-4 text-amber-400" />
        <span className="text-amber-400 text-xs md:text-sm uppercase tracking-wider">INTEL</span>
        <span className="text-amber-500/40 text-xs ml-auto">CLASSIFIED</span>
      </div>
      
      {!selectedFile ? (
        <div className="flex-1 overflow-auto p-2.5 md:p-3 space-y-2">
          <div className="text-amber-500/60 text-xs mb-3 border-b border-amber-500/20 pb-2">
            📁 /intel/market_data/
          </div>
          {files.map((file, idx) => (
            <motion.button
              key={file.name}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              onClick={() => {
                setSelectedFile(file.name);
                try {
                  fetch('/api/track/event', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ event_type: 'intel_open', source: 'intel-app', payload: { file: file.name }, timestamp: new Date().toISOString() })
                  });
                } catch (err) {
                  if (import.meta.env.DEV) console.debug('[IntelApp] Track event failed:', err);
                }
              }}
              className="w-full flex items-center gap-2 md:gap-3 py-2 px-2.5 md:px-3 border-l-2 border-amber-500/40 bg-amber-500/5 hover:bg-amber-500/15 active:bg-amber-500/20 transition-colors text-left"
            >
              <span className="text-amber-400 shrink-0">{file.icon}</span>
              <span className="text-white text-xs md:text-sm truncate">{file.name}</span>
              <span className="text-amber-500/40 text-xs ml-auto shrink-0">OPEN</span>
            </motion.button>
          ))}
        </div>
      ) : (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex items-center gap-2 p-2 border-b border-amber-500/20 bg-amber-500/5">
            <button 
              onClick={() => setSelectedFile(null)}
              className="text-amber-400 hover:text-amber-300 text-xs uppercase"
            >
              ← Back
            </button>
            <span className="text-white text-xs md:text-sm truncate">{selectedFile}</span>
          </div>
          <div className="flex-1 overflow-auto p-3 md:p-4">
            <pre className="text-green-400 text-[10px] md:text-xs whitespace-pre-wrap leading-relaxed">
              {files.find(f => f.name === selectedFile)?.content}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

function DrivesApp({ openIframeWindow }: { openIframeWindow?: (url: string, title: string) => void }) {
  const [selectedDrive, setSelectedDrive] = useState<string | null>(null);
  
  const drives = [
    { id: 'C', name: 'Local System', size: '128 GB', used: '64 GB', status: 'online', icon: <HardDrive className="w-5 h-5" /> },
    { id: 'D', name: '.aethex TLD', size: '∞', used: '0 GB', status: 'not_mounted', icon: <Globe className="w-5 h-5" /> },
  ];

  return (
    <div className="min-h-full bg-slate-950 flex flex-col font-mono">
      <div className="flex items-center gap-2 p-2.5 md:p-3 border-b border-cyan-500/30 bg-cyan-500/5">
        <HardDrive className="w-4 h-4 text-cyan-400" />
        <span className="text-cyan-400 text-xs md:text-sm uppercase tracking-wider">My Computer</span>
      </div>
      
      <div className="flex-1 overflow-auto p-3 md:p-4">
        <div className="text-white/50 text-xs mb-3 md:mb-4 uppercase tracking-wider">Storage Devices</div>
        <div className="space-y-2 md:space-y-3">
          {drives.map((drive) => (
            <motion.div
              key={drive.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`border rounded-lg p-3 md:p-4 cursor-pointer transition-all ${
                drive.status === 'online' 
                  ? 'border-cyan-500/30 bg-cyan-500/5 hover:bg-cyan-500/10' 
                  : 'border-red-500/30 bg-red-500/5 hover:bg-red-500/10'
              }`}
              onClick={() => {
                setSelectedDrive(drive.id);
                if (drive.id === 'D') {
                  fetch('/api/track/event', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ event_type: 'drive_d_open', source: 'drives-app', timestamp: new Date().toISOString() })
                  }).catch(() => {});
                }
              }}
            >
              <div className="flex items-center gap-3 md:gap-4">
                <div className={`w-10 h-10 md:w-12 md:h-12 rounded-lg flex items-center justify-center shrink-0 ${
                  drive.status === 'online' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-red-500/20 text-red-400'
                }`}>
                  {drive.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-bold text-sm md:text-base">({drive.id}:)</span>
                    <span className="text-white/70 text-sm md:text-base truncate">{drive.name}</span>
                  </div>
                  <div className="text-xs mt-1">
                    {drive.status === 'online' ? (
                      <span className="text-cyan-400">{drive.used} / {drive.size} used</span>
                    ) : (
                      <span className="text-red-400 flex items-center gap-1">
                        <Lock className="w-3 h-3" /> Not Mounted
                      </span>
                    )}
                  </div>
                </div>
                <div className={`w-2 h-2 rounded-full ${
                  drive.status === 'online' ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                }`} />
              </div>
            </motion.div>
          ))}
        </div>

        <AnimatePresence>
          {selectedDrive === 'D' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-4 md:mt-6 border border-red-500/30 bg-red-500/10 rounded-lg p-3 md:p-4"
            >
              <div className="flex items-start gap-2 md:gap-3">
                <AlertTriangle className="w-4 h-4 md:w-5 md:h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-red-400 font-bold text-sm md:text-base mb-1">ERROR: Drive Not Mounted</div>
                  <div className="text-white/70 text-xs md:text-sm mb-2 md:mb-3">
                    No .aethex domain detected for this identity.
                  </div>
                  <div className="text-white/50 text-xs mb-3 md:mb-4">
                    Join The Foundry to reserve your namespace in the AeThex ecosystem.
                  </div>
                  <button
                    onClick={() => openIframeWindow?.('https://aethex.studio', 'The Foundry')}
                    className="inline-flex items-center gap-2 px-3 md:px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-black text-xs md:text-sm font-bold uppercase tracking-wider transition-colors"
                  >
                    Join The Foundry <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
          {selectedDrive === 'C' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-4 md:mt-6 border border-cyan-500/30 bg-cyan-500/5 rounded-lg p-3 md:p-4"
            >
              <div className="text-cyan-400 font-bold text-sm md:text-base mb-2">Local System Storage</div>
              <div className="space-y-2 text-xs md:text-sm">
                <div className="flex justify-between text-white/70">
                  <span>/system</span><span>32 GB</span>
                </div>
                <div className="flex justify-between text-white/70">
                  <span>/apps</span><span>16 GB</span>
                </div>
                <div className="flex justify-between text-white/70">
                  <span>/user</span><span>12 GB</span>
                </div>
                <div className="flex justify-between text-white/70">
                  <span>/cache</span><span>4 GB</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function MissionApp() {
  return (
    <div className="min-h-full bg-gradient-to-br from-yellow-500 to-orange-500 p-3 md:p-6 flex items-center justify-center">
      <div className="text-center max-w-2xl">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-16 h-16 md:w-24 md:h-24 mx-auto mb-4 md:mb-6 bg-black rounded-full flex items-center justify-center"
        >
          <Target className="w-8 h-8 md:w-12 md:h-12 text-yellow-400" />
        </motion.div>
        <h1 className="text-2xl md:text-4xl font-display text-black uppercase tracking-wider mb-3 md:mb-4">THE MISSION</h1>
        <p className="text-base md:text-lg text-black/80 mb-4 md:mb-6 leading-relaxed px-2 md:px-0">
          Build the <strong>neutral identity layer</strong> for the next generation of digital creators.
        </p>
        <p className="text-sm md:text-base text-black/70 mb-4 md:mb-6 px-4 md:px-0">
          No platform lock-in. No 30% cuts. Just architects, their work, and their audience.
        </p>
        <div className="flex flex-wrap gap-2 md:gap-4 justify-center text-black/60 text-xs md:text-sm">
          <span className="flex items-center gap-1">
            <Check className="w-3 h-3 md:w-4 md:h-4" /> Cross-Platform Identity
          </span>
          <span className="flex items-center gap-1">
            <Check className="w-3 h-3 md:w-4 md:h-4" /> Direct-to-Consumer
          </span>
          <span className="flex items-center gap-1">
            <Check className="w-3 h-3 md:w-4 md:h-4" /> Open Protocol
          </span>
        </div>
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
      <div className="min-h-full bg-slate-950 flex flex-col">
        <div className="flex items-center gap-2 p-3 md:p-4 border-b border-white/10">
          <Trophy className="w-5 h-5 text-yellow-400" />
          <Skeleton className="h-5 md:h-6 w-28 md:w-32" />
        </div>
        <div className="flex-1 overflow-auto p-3 md:p-4 space-y-2">
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
    <div className="min-h-full bg-slate-950 flex flex-col">
      <div className="flex items-center gap-2 p-3 md:p-4 border-b border-white/10">
        <Trophy className="w-5 h-5 text-yellow-400" />
        <h2 className="text-base md:text-lg font-display text-white uppercase tracking-wider">Leaderboard</h2>
      </div>
      <div className="flex-1 overflow-auto p-3 md:p-4">
        {architects?.map((architect: any, i: number) => {
          const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : null;
          return (
            <motion.div
              key={architect.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`flex items-center gap-3 md:gap-4 p-2.5 md:p-3 rounded-lg mb-2 ${i < 3 ? 'bg-gradient-to-r from-yellow-500/10 to-transparent border border-yellow-500/20' : 'bg-white/5 border border-white/10'}`}
            >
              <div className="w-6 md:w-8 text-center font-mono text-base md:text-lg shrink-0">
                {medal || <span className="text-white/40">{i + 1}</span>}
              </div>
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-cyan-500/20 flex items-center justify-center shrink-0">
                <User className="w-4 h-4 md:w-5 md:h-5 text-cyan-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-white font-mono text-sm md:text-base truncate">{architect.username || 'Anonymous'}</div>
                <div className="text-white/50 text-xs">Level {architect.level}</div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-cyan-400 font-mono font-bold text-sm md:text-base">{architect.xp || 0}</div>
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
    <div className="min-h-full bg-gradient-to-br from-blue-950 to-slate-950 p-3 md:p-6 flex flex-col">
      <div className="bg-slate-800/80 backdrop-blur-sm rounded-2xl p-4 md:p-6 mb-4 md:mb-6 border border-cyan-500/30 shadow-2xl">
        <div className="text-right text-3xl md:text-5xl font-mono text-cyan-400 min-h-[60px] md:min-h-[80px] flex items-center justify-end font-bold tracking-wider break-all">{display}</div>
      </div>
      <div className="grid grid-cols-4 gap-2 md:gap-4 flex-1">
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
            className={`rounded-xl md:rounded-2xl font-mono text-lg md:text-2xl font-bold transition-all active:scale-95 shadow-lg ${
              btn === '0' ? 'col-span-2' : ''
            } ${
              ['+', '-', '×', '÷', '='].includes(btn) 
                ? 'bg-gradient-to-br from-cyan-500 to-blue-500 active:from-cyan-600 active:to-blue-600 text-white' 
                : btn === 'C' 
                  ? 'bg-gradient-to-br from-red-500 to-red-600 active:from-red-600 active:to-red-700 text-white' 
                  : 'bg-slate-800 active:bg-slate-700 text-white'
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

  const wordCount = notes.trim().split(/\s+/).filter(w => w).length;
  const charCount = notes.length;

  const handleClear = () => {
    if (confirm('Clear all notes?')) {
      setNotes('');
    }
  };

  return (
    <div className="min-h-full bg-gradient-to-br from-amber-50 to-yellow-100 flex flex-col">
      <div className="flex items-center gap-2 p-3 md:p-4 bg-amber-200/50 border-b border-amber-300">
        <StickyNote className="w-5 h-5 md:w-6 md:h-6 text-amber-700" />
        <span className="text-amber-900 font-semibold text-sm md:text-base">notes.txt</span>
        <button
          onClick={handleClear}
          className="ml-auto px-2 py-1 text-xs bg-amber-300 hover:bg-amber-400 text-amber-900 rounded transition-colors"
        >
          Clear
        </button>
      </div>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        className="flex-1 bg-transparent p-4 md:p-6 text-gray-900 text-sm md:text-base resize-none outline-none leading-relaxed"
        placeholder="Type your notes here..."
        style={{ fontFamily: 'system-ui' }}
      />
      <div className="px-4 md:px-6 py-2 md:py-3 bg-amber-200/50 border-t border-amber-300 text-amber-700 text-xs md:text-sm flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span>Auto-saved</span>
        </div>
        <div className="ml-auto flex items-center gap-3 text-[10px] md:text-xs">
          <span>{wordCount} words</span>
          <span>{charCount} chars</span>
        </div>
      </div>
    </div>
  );
}

function SystemMonitorApp() {
  const [cpu, setCpu] = useState(45);
  const [ram, setRam] = useState(62);
  const [network, setNetwork] = useState(78);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setCpu(Math.floor(Math.random() * 40) + 30);
    setRam(Math.floor(Math.random() * 40) + 40);
    setNetwork(Math.floor(Math.random() * 30) + 60);
    setTimeout(() => setIsRefreshing(false), 800);
  };

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
    <div className="min-h-full bg-slate-950 p-3 md:p-4 overflow-auto">
      <div className="flex items-center gap-2 mb-4 md:mb-6">
        <Cpu className="w-5 h-5 text-cyan-400" />
        <h2 className="text-base md:text-lg font-display text-white uppercase tracking-wider">System Monitor</h2>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="ml-auto p-1.5 hover:bg-white/10 rounded transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 text-cyan-400 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>
      
      <div className="flex flex-wrap justify-center md:justify-around gap-4 md:gap-0 mb-4 md:mb-6">
        <Gauge label="CPU" value={cpu} color="#22d3ee" />
        <Gauge label="RAM" value={ram} color="#a855f7" />
        <Gauge label="NET" value={network} color="#22c55e" />
      </div>

      <div className="space-y-3">
        <div className="bg-white/5 rounded-lg p-2.5 md:p-3">
          <div className="flex justify-between text-xs md:text-sm mb-2">
            <span className="text-white/60">Aegis Shield</span>
            <span className="text-green-400">ACTIVE</span>
          </div>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-green-500 to-cyan-500 w-full" />
          </div>
        </div>
        <div className="bg-white/5 rounded-lg p-2.5 md:p-3">
          <div className="flex justify-between text-xs md:text-sm mb-2">
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
    <div className="min-h-full bg-black flex flex-col">
      <div className="flex items-center justify-between p-2.5 md:p-3 bg-slate-900 border-b border-red-500/30">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 md:w-5 md:h-5 text-red-500" />
          <span className="text-red-400 font-mono text-xs md:text-sm">AEGIS SURVEILLANCE</span>
        </div>
        <div className="flex items-center gap-1.5 md:gap-2 text-red-400 text-xs">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          <span className="hidden sm:inline">MONITORING</span>
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
        <div className="p-2.5 md:p-3 bg-slate-900 border-t border-red-500/30 flex justify-center">
          <button onClick={runScan} disabled={isScanning} className="px-3 md:px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded border border-red-500/50 transition-colors text-xs md:text-sm flex items-center gap-2 disabled:opacity-50">
            <Shield className="w-3 h-3 md:w-4 md:h-4" />
            {isScanning ? 'Scanning...' : 'Run Biometric Scan'}
          </button>
        </div>
      )}
    </div>
  );
}

// Wrapper components for new apps
function ProjectsAppWrapper() {
  return (
    <div className="h-full w-full overflow-auto">
      <iframe src="/hub/projects" className="w-full h-full border-0" title="Projects" />
    </div>
  );
}

function MessagingAppWrapper() {
  return (
    <div className="h-full w-full overflow-auto">
      <iframe src="/hub/messaging" className="w-full h-full border-0" title="Messages" />
    </div>
  );
}

function MarketplaceAppWrapper() {
  return (
    <div className="h-full w-full overflow-auto">
      <iframe src="/hub/marketplace" className="w-full h-full border-0" title="Marketplace" />
    </div>
  );
}

function FileManagerAppWrapper() {
  return (
    <div className="h-full w-full overflow-auto">
      <iframe src="/hub/file-manager" className="w-full h-full border-0" title="File Manager" />
    </div>
  );
}

function CodeGalleryAppWrapper() {
  return (
    <div className="h-full w-full overflow-auto">
      <iframe src="/hub/code-gallery" className="w-full h-full border-0" title="Code Gallery" />
    </div>
  );
}

function NotificationsAppWrapper() {
  return (
    <div className="h-full w-full overflow-auto">
      <iframe src="/hub/notifications" className="w-full h-full border-0" title="Notifications" />
    </div>
  );
}

function AnalyticsAppWrapper() {
  return (
    <div className="h-full w-full overflow-auto">
      <iframe src="/hub/analytics" className="w-full h-full border-0" title="Analytics" />
    </div>
  );
}
