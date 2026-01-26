import { useState } from 'react';
import { Camera, Share2, MapPin, Bell, Copy, FileText, Globe, Wifi, WifiOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNativeFeatures } from '../hooks/use-native-features';

export function MobileQuickActions() {
  const [isOpen, setIsOpen] = useState(false);
  const native = useNativeFeatures();
  const [location, setLocation] = useState<string>('');

  const quickActions = [
    {
      icon: <Camera className="w-5 h-5" />,
      label: 'Camera',
      color: 'from-blue-500 to-cyan-500',
      action: async () => {
        const photo = await native.takePhoto();
        if (photo) {
          native.showToast('Photo captured!');
          native.vibrate('light');
        }
      }
    },
    {
      icon: <Share2 className="w-5 h-5" />,
      label: 'Share',
      color: 'from-purple-500 to-pink-500',
      action: async () => {
        await native.shareText('Check out AeThex OS!', 'AeThex OS');
      }
    },
    {
      icon: <MapPin className="w-5 h-5" />,
      label: 'Location',
      color: 'from-green-500 to-emerald-500',
      action: async () => {
        const position = await native.getCurrentLocation();
        if (position) {
          const loc = `${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`;
          setLocation(loc);
          native.showToast(`Location: ${loc}`);
          native.vibrate('medium');
        }
      }
    },
    {
      icon: <Bell className="w-5 h-5" />,
      label: 'Notify',
      color: 'from-orange-500 to-red-500',
      action: async () => {
        await native.sendLocalNotification('AeThex OS', 'Test notification from your OS!');
        native.vibrate('light');
      }
    },
    {
      icon: <Copy className="w-5 h-5" />,
      label: 'Clipboard',
      color: 'from-yellow-500 to-amber-500',
      action: async () => {
        await native.copyToClipboard('AeThex OS - The Future is Now');
      }
    },
    {
      icon: <FileText className="w-5 h-5" />,
      label: 'Save File',
      color: 'from-indigo-500 to-blue-500',
      action: async () => {
        const success = await native.saveFile(
          JSON.stringify({ timestamp: Date.now(), app: 'AeThex OS' }),
          `aethex-${Date.now()}.json`
        );
        if (success) native.vibrate('medium');
      }
    },
    {
      icon: <Globe className="w-5 h-5" />,
      label: 'Browser',
      color: 'from-teal-500 to-cyan-500',
      action: async () => {
        await native.openInBrowser('https://github.com');
        native.vibrate('light');
      }
    },
    {
      icon: native.networkStatus.connected ? <Wifi className="w-5 h-5" /> : <WifiOff className="w-5 h-5" />,
      label: native.networkStatus.connected ? 'Online' : 'Offline',
      color: native.networkStatus.connected ? 'from-green-500 to-emerald-500' : 'from-gray-500 to-slate-500',
      action: () => {
        native.showToast(
          `Network: ${native.networkStatus.connectionType} (${native.networkStatus.connected ? 'Connected' : 'Disconnected'})`
        );
      }
    }
  ];

  return (
    <>
      {/* Floating Action Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileTap={{ scale: 0.9 }}
        className="fixed bottom-24 right-6 w-14 h-14 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 shadow-lg shadow-cyan-500/50 flex items-center justify-center z-40"
      >
        <motion.div
          animate={{ rotate: isOpen ? 45 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="text-white text-2xl font-bold">+</div>
        </motion.div>
      </motion.button>

      {/* Quick Actions Menu */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30"
            />

            {/* Actions Grid */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 50 }}
              className="fixed bottom-40 right-6 w-72 bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl z-40 p-4"
            >
              <div className="grid grid-cols-4 gap-3">
                {quickActions.map((action, i) => (
                  <motion.button
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => {
                      action.action();
                      setIsOpen(false);
                    }}
                    className="flex flex-col items-center gap-1 p-2 rounded-xl active:scale-95 transition-transform"
                  >
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center text-white shadow-lg`}>
                      {action.icon}
                    </div>
                    <span className="text-white text-[10px] font-medium text-center leading-tight">
                      {action.label}
                    </span>
                  </motion.button>
                ))}
              </div>

              {location && (
                <div className="mt-3 pt-3 border-t border-white/10">
                  <div className="text-white/50 text-xs">Last Location:</div>
                  <div className="text-white text-xs font-mono">{location}</div>
                </div>
              )}

              <div className="mt-3 pt-3 border-t border-white/10">
                <div className="flex items-center justify-between">
                  <span className="text-white/50 text-xs">Network</span>
                  <span className={`text-xs font-medium ${native.networkStatus.connected ? 'text-green-400' : 'text-red-400'}`}>
                    {native.networkStatus.connectionType}
                  </span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
