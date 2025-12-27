import { useState, useEffect } from 'react';
import { Cookie, Zap, TrendingUp, Award } from 'lucide-react';

interface Upgrade {
  id: string;
  name: string;
  cost: number;
  cps: number; // cookies per second
  owned: number;
  icon: string;
}

export function CookieClicker() {
  const [cookies, setCookies] = useState(0);
  const [totalCookies, setTotalCookies] = useState(0);
  const [cps, setCps] = useState(0);
  const [clickPower, setClickPower] = useState(1);
  
  const [upgrades, setUpgrades] = useState<Upgrade[]>([
    { id: 'cursor', name: 'Cursor', cost: 15, cps: 0.1, owned: 0, icon: '👆' },
    { id: 'grandma', name: 'Grandma', cost: 100, cps: 1, owned: 0, icon: '👵' },
    { id: 'farm', name: 'Cookie Farm', cost: 500, cps: 8, owned: 0, icon: '🌾' },
    { id: 'factory', name: 'Factory', cost: 3000, cps: 47, owned: 0, icon: '🏭' },
    { id: 'mine', name: 'Cookie Mine', cost: 10000, cps: 260, owned: 0, icon: '⛏️' },
    { id: 'quantum', name: 'Quantum Oven', cost: 50000, cps: 1400, owned: 0, icon: '🔬' },
  ]);

  // Auto-generate cookies
  useEffect(() => {
    if (cps > 0) {
      const interval = setInterval(() => {
        setCookies(prev => prev + cps / 10);
        setTotalCookies(prev => prev + cps / 10);
      }, 100);
      return () => clearInterval(interval);
    }
  }, [cps]);

  const handleClick = () => {
    setCookies(prev => prev + clickPower);
    setTotalCookies(prev => prev + clickPower);
  };

  const buyUpgrade = (upgrade: Upgrade) => {
    if (cookies >= upgrade.cost) {
      setCookies(prev => prev - upgrade.cost);
      
      setUpgrades(prev => prev.map(u => {
        if (u.id === upgrade.id) {
          return {
            ...u,
            owned: u.owned + 1,
            cost: Math.floor(u.cost * 1.15)
          };
        }
        return u;
      }));
      
      setCps(prev => prev + upgrade.cps);
    }
  };

  const buyClickUpgrade = () => {
    const cost = clickPower * 10;
    if (cookies >= cost) {
      setCookies(prev => prev - cost);
      setClickPower(prev => prev + 1);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return Math.floor(num).toString();
  };

  const getMilestone = () => {
    if (totalCookies >= 1000000) return '🏆 Cookie Tycoon';
    if (totalCookies >= 100000) return '⭐ Cookie Master';
    if (totalCookies >= 10000) return '🎖️ Cookie Expert';
    if (totalCookies >= 1000) return '🥈 Cookie Baker';
    if (totalCookies >= 100) return '🥉 Cookie Novice';
    return '🍪 Cookie Beginner';
  };

  return (
    <div className="h-full bg-gradient-to-br from-amber-950 via-orange-950 to-red-950 overflow-auto">
      {/* Header Stats */}
      <div className="sticky top-0 bg-black/40 backdrop-blur-md border-b border-white/10 p-4 z-10">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Cookie className="w-6 h-6 text-amber-400" />
            <span className="text-2xl font-bold text-white">{formatNumber(cookies)}</span>
            <span className="text-sm text-white/60">cookies</span>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 text-cyan-400">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm font-mono">{cps.toFixed(1)}/s</span>
            </div>
            <div className="flex items-center gap-1 text-yellow-400 text-xs mt-1">
              <Award className="w-3 h-3" />
              <span>{getMilestone()}</span>
            </div>
          </div>
        </div>
        
        <div className="text-xs text-white/40 text-center">
          Total: {formatNumber(totalCookies)} cookies baked
        </div>
      </div>

      {/* Cookie Clicker Area */}
      <div className="flex flex-col items-center py-8">
        <button
          onClick={handleClick}
          className="relative group active:scale-95 transition-transform"
        >
          <div className="absolute inset-0 bg-amber-500/20 rounded-full blur-2xl group-active:bg-amber-500/40 transition-all" />
          <div className="relative w-40 h-40 bg-gradient-to-br from-amber-400 to-orange-600 rounded-full flex items-center justify-center text-8xl shadow-2xl border-4 border-amber-300/50 cursor-pointer hover:scale-105 transition-transform">
            🍪
          </div>
        </button>
        
        <div className="mt-4 text-white font-mono text-sm">
          +{clickPower} per click
        </div>

        <button
          onClick={buyClickUpgrade}
          disabled={cookies < clickPower * 10}
          className="mt-2 px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 disabled:bg-gray-700/20 disabled:text-gray-500 text-purple-300 rounded-lg border border-purple-500/50 disabled:border-gray-600 transition-colors text-sm font-mono"
        >
          <Zap className="w-4 h-4 inline mr-2" />
          Upgrade Click ({clickPower * 10} cookies)
        </button>
      </div>

      {/* Upgrades Shop */}
      <div className="px-4 pb-6">
        <h3 className="text-white font-bold text-lg mb-3 flex items-center gap-2">
          <Award className="w-5 h-5 text-cyan-400" />
          Cookie Producers
        </h3>
        
        <div className="space-y-2">
          {upgrades.map(upgrade => {
            const canAfford = cookies >= upgrade.cost;
            
            return (
              <button
                key={upgrade.id}
                onClick={() => buyUpgrade(upgrade)}
                disabled={!canAfford}
                className={`w-full p-3 rounded-lg border transition-all ${
                  canAfford 
                    ? 'bg-gradient-to-r from-cyan-900/40 to-blue-900/40 border-cyan-500/50 hover:border-cyan-400 hover:shadow-lg hover:shadow-cyan-500/20' 
                    : 'bg-slate-900/40 border-slate-700 opacity-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{upgrade.icon}</span>
                    <div className="text-left">
                      <div className="text-white font-semibold">{upgrade.name}</div>
                      <div className="text-xs text-cyan-400 font-mono">+{upgrade.cps}/s</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-amber-400 font-bold">{formatNumber(upgrade.cost)}</div>
                    {upgrade.owned > 0 && (
                      <div className="text-xs text-white/60">Owned: {upgrade.owned}</div>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
