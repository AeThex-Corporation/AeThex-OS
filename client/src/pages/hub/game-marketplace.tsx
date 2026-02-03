import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { 
  ArrowLeft, ShoppingCart, Star, Plus, Loader2, Gamepad2, 
  Zap, Trophy, Users, DollarSign, TrendingUp, Filter, Search
} from "lucide-react";
import { isEmbedded } from "@/lib/embed-utils";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";

interface GameItem {
  id: string;
  name: string;
  type: "game" | "asset" | "cosmetic" | "pass";
  price: number;
  platform: string;
  rating: number;
  purchases: number;
  image?: string;
  seller: string;
  description: string;
  tags: string[];
}

interface GameWallet {
  balance: number;
  currency: string;
  lastUpdated: Date;
}

export default function GameMarketplace() {
  const { user } = useAuth();
  const [items, setItems] = useState<GameItem[]>([]);
  const [wallet, setWallet] = useState<GameWallet>({ balance: 5000, currency: "LP", lastUpdated: new Date() });
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedPlatform, setSelectedPlatform] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<"newest" | "popular" | "price-low" | "price-high">("newest");

  const mockGames: GameItem[] = [
    {
      id: "1",
      name: "Minecraft Premium Skin Pack",
      type: "cosmetic",
      price: 450,
      platform: "minecraft",
      rating: 4.8,
      purchases: 1240,
      seller: "SkinMaster",
      description: "20 exclusive Minecraft skins from top creators",
      tags: ["cosmetic", "minecraft", "skins"],
      image: "🎮"
    },
    {
      id: "2",
      name: "Roblox Game Pass Bundle",
      type: "pass",
      price: 800,
      platform: "roblox",
      rating: 4.6,
      purchases: 890,
      seller: "RobloxStudios",
      description: "Permanent access to 5 premium Roblox games",
      tags: ["pass", "roblox", "games"],
      image: "🎯"
    },
    {
      id: "3",
      name: "Steam Cosmetics Collection",
      type: "cosmetic",
      price: 350,
      platform: "steam",
      rating: 4.9,
      purchases: 2100,
      seller: "SteamVault",
      description: "Ultimate cosmetics for all popular Steam games",
      tags: ["cosmetic", "steam", "skins"],
      image: "⭐"
    },
    {
      id: "4",
      name: "Meta Horizon World Pass",
      type: "pass",
      price: 600,
      platform: "meta",
      rating: 4.4,
      purchases: 450,
      seller: "MetaWorlds",
      description: "Premium world building tools & content",
      tags: ["pass", "meta", "vr"],
      image: "🌐"
    },
    {
      id: "5",
      name: "Twitch Streamer Pack",
      type: "asset",
      price: 250,
      platform: "twitch",
      rating: 4.7,
      purchases: 1560,
      seller: "StreamSetup",
      description: "Overlays, alerts, and emote packs for streamers",
      tags: ["asset", "twitch", "streaming"],
      image: "📺"
    },
    {
      id: "6",
      name: "YouTube Gaming Studio",
      type: "asset",
      price: 550,
      platform: "youtube",
      rating: 4.5,
      purchases: 890,
      seller: "ContentMakers",
      description: "Professional gaming thumbnail & video templates",
      tags: ["asset", "youtube", "content"],
      image: "🎬"
    }
  ];

  useEffect(() => {
    loadMarketplace();
  }, [selectedCategory, selectedPlatform, sortBy]);

  const loadMarketplace = async () => {
    setLoading(true);
    try {
      // In production, fetch from /api/game/marketplace
      let filtered = mockGames;

      if (selectedCategory !== "all") {
        filtered = filtered.filter(item => item.type === selectedCategory);
      }

      if (selectedPlatform !== "all") {
        filtered = filtered.filter(item => item.platform === selectedPlatform);
      }

      if (searchQuery) {
        filtered = filtered.filter(item =>
          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.seller.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }

      // Sort
      filtered.sort((a, b) => {
        switch (sortBy) {
          case "popular":
            return b.purchases - a.purchases;
          case "price-low":
            return a.price - b.price;
          case "price-high":
            return b.price - a.price;
          default: // newest
            return 0;
        }
      });

      setItems(filtered);
    } catch (err) {
      console.error("Error loading marketplace:", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (item: GameItem) => {
    if (wallet.balance < item.price) {
      alert("Insufficient LP balance!");
      return;
    }

    try {
      const response = await fetch("/api/game/marketplace/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ itemId: item.id, price: item.price })
      });

      if (response.ok) {
        setWallet(prev => ({ ...prev, balance: prev.balance - item.price }));
        alert(`Purchased "${item.name}"!`);
      }
    } catch (err) {
      console.error("Purchase error:", err);
    }
  };

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const embedded = isEmbedded();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-950 text-white">
      {/* Header - hidden when embedded in OS iframe */}
      {!embedded && (
        <div className="bg-slate-950 border-b border-slate-700 sticky top-0 z-10 py-4 px-4 md:px-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-4 gap-2">
              <div className="flex items-center gap-3">
                <Link href="/hub">
                  <button className="text-slate-400 hover:text-white transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                </Link>
                <div className="flex items-center gap-2">
                  <Gamepad2 className="w-6 h-6 text-cyan-400" />
                  <h1 className="text-2xl font-bold">Game Marketplace</h1>
                </div>
              </div>

              {/* Wallet Balance */}
              <div className="bg-slate-800 px-4 py-2 rounded-lg border border-slate-700 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-yellow-400" />
                <span className="font-mono font-bold text-lg text-cyan-400">{wallet.balance} {wallet.currency}</span>
              </div>
            </div>

            {/* Search & Filter */}
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search games, assets, creators..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm"
              >
                <option value="newest">Newest</option>
                <option value="popular">Popular</option>
                <option value="price-low">Price: Low→High</option>
                <option value="price-high">Price: High→Low</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        {/* Category Tabs */}
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="mb-8">
          <TabsList className="bg-slate-800 border border-slate-700">
            <TabsTrigger value="all" className="data-[state=active]:bg-cyan-600">All Items</TabsTrigger>
            <TabsTrigger value="game" className="data-[state=active]:bg-cyan-600">Games</TabsTrigger>
            <TabsTrigger value="cosmetic" className="data-[state=active]:bg-cyan-600">Cosmetics</TabsTrigger>
            <TabsTrigger value="pass" className="data-[state=active]:bg-cyan-600">Passes</TabsTrigger>
            <TabsTrigger value="asset" className="data-[state=active]:bg-cyan-600">Assets</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Platform Filter */}
        <div className="mb-6 flex gap-2 flex-wrap">
          <button
            onClick={() => setSelectedPlatform("all")}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
              selectedPlatform === "all"
                ? "bg-cyan-600 text-white"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            All Platforms
          </button>
          {["minecraft", "roblox", "steam", "meta", "twitch", "youtube"].map(platform => (
            <button
              key={platform}
              onClick={() => setSelectedPlatform(platform)}
              className={`px-3 py-1 rounded-lg text-sm font-medium capitalize transition-colors ${
                selectedPlatform === platform
                  ? "bg-cyan-600 text-white"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              {platform}
            </button>
          ))}
        </div>

        {/* Items Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <Gamepad2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No items found matching your criteria</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredItems.map((item) => (
              <Card
                key={item.id}
                className="bg-slate-800 border-slate-700 overflow-hidden hover:border-cyan-500 transition-all group"
              >
                {/* Image */}
                <div className="h-48 bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center text-6xl border-b border-slate-700 group-hover:scale-105 transition-transform">
                  {item.image}
                </div>

                {/* Content */}
                <div className="p-4">
                  {/* Badge */}
                  <div className="mb-2 flex items-center gap-2">
                    <span className={`text-xs font-bold px-2 py-1 rounded uppercase ${
                      item.type === "game" ? "bg-purple-500/20 text-purple-400" :
                      item.type === "cosmetic" ? "bg-pink-500/20 text-pink-400" :
                      item.type === "pass" ? "bg-blue-500/20 text-blue-400" :
                      "bg-green-500/20 text-green-400"
                    }`}>
                      {item.type}
                    </span>
                    <span className="text-xs text-slate-400 capitalize bg-slate-700/50 px-2 py-1 rounded">
                      {item.platform}
                    </span>
                  </div>

                  {/* Name */}
                  <h3 className="text-lg font-bold text-white mb-1 line-clamp-2 group-hover:text-cyan-400 transition-colors">
                    {item.name}
                  </h3>

                  {/* Description */}
                  <p className="text-xs text-slate-400 mb-3 line-clamp-2">{item.description}</p>

                  {/* Rating & Purchases */}
                  <div className="flex items-center justify-between mb-3 text-xs text-slate-400">
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                      <span className="font-bold text-white">{item.rating}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <ShoppingCart className="w-3 h-3" />
                      <span>{item.purchases.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Seller */}
                  <div className="text-xs text-slate-400 mb-3 pb-3 border-b border-slate-700">
                    by <span className="text-cyan-400 font-bold">{item.seller}</span>
                  </div>

                  {/* Price & Button */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-2xl font-bold text-cyan-400">
                      {item.price}
                      <span className="text-xs text-slate-400 ml-1">LP</span>
                    </div>
                    <Button
                      onClick={() => handlePurchase(item)}
                      className="bg-cyan-600 hover:bg-cyan-700 gap-1 flex-1"
                      disabled={wallet.balance < item.price}
                    >
                      <ShoppingCart className="w-4 h-4" />
                      <span className="hidden sm:inline">Buy</span>
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
