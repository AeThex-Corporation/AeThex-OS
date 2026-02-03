import { useState, useRef } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  ArrowLeft, Upload, Download, Star, Eye, Heart, Share2, 
  Trash2, Award, User, Calendar, Search, Filter, Plus, Loader2,
  Package, AlertCircle, CheckCircle
} from "lucide-react";
import { isEmbedded, getResponsiveStyles } from "@/lib/embed-utils";

interface Mod {
  id: string;
  name: string;
  description: string;
  author: string;
  game: string;
  version: string;
  rating: number;
  reviews: number;
  downloads: number;
  likes: number;
  views: number;
  image: string;
  uploadedAt: Date;
  tags: string[];
  category: "gameplay" | "cosmetic" | "utility" | "enhancement";
  fileSize: string;
  status: "approved" | "reviewing" | "rejected";
}

export default function ModWorkshop() {
  const [mods, setMods] = useState<Mod[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<"all" | Mod["category"]>("all");
  const [selectedGame, setSelectedGame] = useState("all");
  const [sortBy, setSortBy] = useState<"newest" | "popular" | "trending" | "rating">("trending");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const mockMods: Mod[] = [
    {
      id: "1",
      name: "Better Graphics Overhaul",
      description: "Dramatic improvements to textures, lighting, and particle effects for all games",
      author: "GraphicsGuru",
      game: "Minecraft",
      version: "1.20.1",
      rating: 4.9,
      reviews: 3240,
      downloads: 145000,
      likes: 8900,
      views: 234000,
      image: "🎨",
      uploadedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      tags: ["graphics", "visual", "enhancement"],
      category: "enhancement",
      fileSize: "285 MB",
      status: "approved"
    },
    {
      id: "2",
      name: "Quality of Life Plus",
      description: "QoL improvements including better menus, shortcuts, and UI enhancements",
      author: "UIWizard",
      game: "Roblox",
      version: "2.1.0",
      rating: 4.7,
      reviews: 1820,
      downloads: 89000,
      likes: 5200,
      views: 120000,
      image: "⚙️",
      uploadedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      tags: ["ui", "qol", "gameplay"],
      category: "utility",
      fileSize: "42 MB",
      status: "approved"
    },
    {
      id: "3",
      name: "Premium Skins Collection",
      description: "200+ high-quality character skins and cosmetics from top artists",
      author: "SkinMaster",
      game: "Steam Games",
      version: "3.0.0",
      rating: 4.8,
      reviews: 2100,
      downloads: 156000,
      likes: 9800,
      views: 298000,
      image: "👕",
      uploadedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      tags: ["cosmetic", "skins", "aesthetic"],
      category: "cosmetic",
      fileSize: "612 MB",
      status: "approved"
    },
    {
      id: "4",
      name: "Performance Optimizer",
      description: "Advanced optimization reducing lag and improving FPS across games",
      author: "OptimizeKing",
      game: "All Games",
      version: "1.5.0",
      rating: 4.6,
      reviews: 945,
      downloads: 67000,
      likes: 3400,
      views: 89000,
      image: "⚡",
      uploadedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      tags: ["performance", "optimization", "utility"],
      category: "utility",
      fileSize: "18 MB",
      status: "approved"
    },
    {
      id: "5",
      name: "New Game Mode - Apocalypse",
      description: "Intense survival mode with new mechanics, creatures, and challenges",
      author: "GameDeveloper",
      game: "Minecraft",
      version: "1.0.0",
      rating: 4.4,
      reviews: 420,
      downloads: 32000,
      likes: 1800,
      views: 45000,
      image: "🌍",
      uploadedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      tags: ["gameplay", "mode", "survival"],
      category: "gameplay",
      fileSize: "428 MB",
      status: "approved"
    },
    {
      id: "6",
      name: "Sound Design Enhancement",
      description: "Immersive audio with realistic sound effects and enhanced music",
      author: "AudioEnthusiast",
      game: "All Games",
      version: "2.0.0",
      rating: 4.5,
      reviews: 680,
      downloads: 54000,
      likes: 2900,
      views: 76000,
      image: "🔊",
      uploadedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      tags: ["audio", "sound", "immersion"],
      category: "enhancement",
      fileSize: "356 MB",
      status: "approved"
    }
  ];

  const filteredMods = mockMods.filter(mod => {
    const searchMatch = mod.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                       mod.author.toLowerCase().includes(searchQuery.toLowerCase());
    const categoryMatch = selectedCategory === "all" || mod.category === selectedCategory;
    const gameMatch = selectedGame === "all" || mod.game === selectedGame || mod.game === "All Games";
    return searchMatch && categoryMatch && gameMatch;
  });

  const sortedMods = [...filteredMods].sort((a, b) => {
    switch (sortBy) {
      case "popular":
        return b.downloads - a.downloads;
      case "trending":
        return b.likes - a.likes;
      case "rating":
        return b.rating - a.rating;
      default: // newest
        return b.uploadedAt.getTime() - a.uploadedAt.getTime();
    }
  });

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadStatus("uploading");
    try {
      // Simulate upload delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In production: upload to /api/game/workshop/upload
      setUploadStatus("success");
      setTimeout(() => setShowUploadModal(false), 1500);
    } catch (error) {
      setUploadStatus("error");
    }
  };

  const games = ["all", "Minecraft", "Roblox", "Steam Games", "All Games"];

  const embedded = isEmbedded();
  const { useMobileStyles, theme } = getResponsiveStyles();

  // Mobile-optimized layout when embedded or on mobile device
  if (useMobileStyles) {
    return (
      <div className="min-h-screen" style={{ background: theme.gradientBg }}>
        <div className="p-4 pb-20">
          {/* Mobile Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${theme.bgAccent} border ${theme.borderClass} flex items-center justify-center`}>
                <Package className={`w-5 h-5 ${theme.iconClass}`} />
              </div>
              <div>
                <h1 className={`${theme.primaryClass} font-bold text-lg`}>Mod Workshop</h1>
                <p className="text-zinc-500 text-xs">{sortedMods.length} mods</p>
              </div>
            </div>
            <Button
              onClick={() => setShowUploadModal(true)}
              className={`${theme.activeBtn} ${theme.hoverBtn} gap-1`}
              size="sm"
            >
              <Upload className="w-4 h-4" />
            </Button>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
            <input
              placeholder="Search mods..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 ${theme.inputBg} border border-zinc-700 rounded-xl text-white text-sm`}
            />
          </div>

          {/* Category Pills */}
          <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
            {(["all", "gameplay", "cosmetic", "utility", "enhancement"] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors capitalize ${
                  selectedCategory === cat
                    ? `${theme.activeBtn} text-white`
                    : `${theme.cardBg} text-zinc-400 border ${theme.borderClass}`
                }`}
              >
                {cat === "all" ? "All" : cat}
              </button>
            ))}
          </div>

          {/* Sort & Game Filter */}
          <div className="flex gap-2 mb-4">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className={`flex-1 px-3 py-2 ${theme.inputBg} border border-zinc-700 rounded-lg text-white text-xs`}
            >
              <option value="trending">Trending</option>
              <option value="newest">Newest</option>
              <option value="popular">Most Downloaded</option>
              <option value="rating">Highest Rated</option>
            </select>
            <select
              value={selectedGame}
              onChange={(e) => setSelectedGame(e.target.value)}
              className={`flex-1 px-3 py-2 ${theme.inputBg} border border-zinc-700 rounded-lg text-white text-xs`}
            >
              {games.map(game => (
                <option key={game} value={game}>
                  {game === "all" ? "All Games" : game}
                </option>
              ))}
            </select>
          </div>

          {/* Mods Grid */}
          <div className="space-y-3">
            {sortedMods.length === 0 ? (
              <div className={`${theme.cardBg} border ${theme.borderClass} rounded-xl p-8 text-center`}>
                <Package className={`w-12 h-12 ${theme.iconClass} mx-auto mb-3 opacity-50`} />
                <p className="text-zinc-500 text-sm">No mods found</p>
              </div>
            ) : (
              sortedMods.map((mod) => (
                <div
                  key={mod.id}
                  className={`${theme.cardBg} border ${theme.borderClass} rounded-xl overflow-hidden active:scale-[0.98] transition-transform`}
                >
                  {/* Image */}
                  <div className="h-24 bg-gradient-to-br from-zinc-700 to-zinc-900 flex items-center justify-center text-4xl relative">
                    {mod.image}
                    <div className={`absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 ${
                      mod.status === "approved" ? "bg-green-500/20 text-green-400" :
                      mod.status === "reviewing" ? "bg-yellow-500/20 text-yellow-400" :
                      "bg-red-500/20 text-red-400"
                    }`}>
                      {mod.status === "approved" ? <CheckCircle className="w-2 h-2" /> : <AlertCircle className="w-2 h-2" />}
                      {mod.status}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    {/* Badges */}
                    <div className="flex gap-2 mb-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded capitalize ${
                        mod.category === "gameplay" ? "bg-purple-500/20 text-purple-400" :
                        mod.category === "cosmetic" ? "bg-pink-500/20 text-pink-400" :
                        mod.category === "utility" ? `${theme.bgAccent} ${theme.primaryClass}` :
                        "bg-green-500/20 text-green-400"
                      }`}>
                        {mod.category}
                      </span>
                      <span className="text-[10px] text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded">
                        v{mod.version}
                      </span>
                    </div>

                    {/* Name & Author */}
                    <h3 className="text-white font-bold text-sm mb-1 line-clamp-1">{mod.name}</h3>
                    <p className="text-[10px] text-zinc-400 flex items-center gap-1 mb-2">
                      <User className="w-2 h-2" /> {mod.author}
                    </p>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-2 mb-3 text-[10px]">
                      <div className="bg-zinc-800/50 p-2 rounded">
                        <div className="text-zinc-500">Rating</div>
                        <div className="font-bold text-yellow-400">{mod.rating} ⭐</div>
                      </div>
                      <div className="bg-zinc-800/50 p-2 rounded">
                        <div className="text-zinc-500">Downloads</div>
                        <div className={`font-bold ${theme.primaryClass}`}>{(mod.downloads / 1000).toFixed(0)}K</div>
                      </div>
                    </div>

                    {/* Download Button */}
                    <Button className={`w-full ${theme.activeBtn} ${theme.hoverBtn} gap-1 text-xs`} size="sm">
                      <Download className="w-3 h-3" /> Download ({mod.fileSize})
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Upload Modal */}
        {showUploadModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className={`${theme.cardBg} border ${theme.borderClass} rounded-xl w-full max-w-sm p-4`}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-white font-bold text-sm">Upload Mod</h2>
                <button onClick={() => setShowUploadModal(false)} className="text-zinc-400">✕</button>
              </div>

              {uploadStatus === "idle" && (
                <div className="space-y-3">
                  <div
                    className={`border-2 border-dashed ${theme.borderClass} rounded-xl p-6 text-center cursor-pointer`}
                    onClick={handleUploadClick}
                  >
                    <Upload className={`w-6 h-6 mx-auto mb-2 ${theme.iconClass}`} />
                    <p className="text-xs text-zinc-400">Tap to select mod file</p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".zip,.rar"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="Mod Title"
                    className={`w-full px-3 py-2 ${theme.inputBg} border border-zinc-700 rounded-lg text-white text-xs`}
                  />
                  <textarea
                    placeholder="Description..."
                    rows={2}
                    className={`w-full px-3 py-2 ${theme.inputBg} border border-zinc-700 rounded-lg text-white text-xs resize-none`}
                  />
                  <div className="flex gap-2">
                    <Button onClick={() => setShowUploadModal(false)} variant="outline" className="flex-1 border-zinc-700 text-xs" size="sm">
                      Cancel
                    </Button>
                    <Button onClick={() => setUploadStatus("uploading")} className={`flex-1 ${theme.activeBtn} text-xs`} size="sm">
                      Upload
                    </Button>
                  </div>
                </div>
              )}

              {uploadStatus === "uploading" && (
                <div className="text-center py-6">
                  <Loader2 className={`w-6 h-6 mx-auto mb-3 animate-spin ${theme.iconClass}`} />
                  <p className="text-zinc-400 text-xs">Uploading...</p>
                </div>
              )}

              {uploadStatus === "success" && (
                <div className="text-center py-6">
                  <CheckCircle className="w-6 h-6 mx-auto mb-3 text-green-400" />
                  <p className="text-white text-xs font-bold">Upload Complete!</p>
                </div>
              )}

              {uploadStatus === "error" && (
                <div className="text-center py-6">
                  <AlertCircle className="w-6 h-6 mx-auto mb-3 text-red-400" />
                  <p className="text-white text-xs font-bold">Upload Failed</p>
                  <Button onClick={() => setUploadStatus("idle")} className={`mt-3 ${theme.activeBtn} text-xs`} size="sm">
                    Try Again
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

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
                  <Package className="w-6 h-6 text-cyan-400" />
                  <h1 className="text-2xl font-bold">Mod Workshop</h1>
                </div>
              </div>

              <Button
                onClick={() => setShowUploadModal(true)}
                className="bg-cyan-600 hover:bg-cyan-700 gap-2"
              >
                <Upload className="w-4 h-4" />
                <span className="hidden sm:inline">Upload Mod</span>
                <span className="sm:hidden">Upload</span>
              </Button>
            </div>

            {/* Search & Filters */}
            <div className="space-y-2">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input
                    placeholder="Search mods, authors..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm placeholder-slate-400"
                  />
                </div>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm"
                >
                  <option value="trending">Trending</option>
                  <option value="newest">Newest</option>
                  <option value="popular">Most Downloaded</option>
                  <option value="rating">Highest Rated</option>
                </select>
              </div>

              {/* Category & Game Filters */}
              <div className="flex gap-2 flex-wrap">
                <div className="flex gap-2">
                  {(["all", "gameplay", "cosmetic", "utility", "enhancement"] as const).map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium capitalize transition-colors ${
                        selectedCategory === cat
                          ? "bg-cyan-600 text-white"
                          : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                    }`}
                  >
                    {cat === "all" ? "All Categories" : cat}
                  </button>
                ))}
                </div>

                <div className="ml-auto">
                  <select
                    value={selectedGame}
                    onChange={(e) => setSelectedGame(e.target.value)}
                    className="px-3 py-1 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs"
                  >
                    {games.map(game => (
                      <option key={game} value={game}>
                        {game === "all" ? "All Games" : game}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mods Grid */}
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        {sortedMods.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-slate-400">No mods found matching your criteria</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedMods.map((mod) => (
              <Card
                key={mod.id}
                className="bg-slate-800 border-slate-700 overflow-hidden hover:border-cyan-500 transition-all group cursor-pointer"
              >
                {/* Image */}
                <div className="h-40 bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center text-5xl relative group-hover:scale-105 transition-transform">
                  {mod.image}
                  <div className={`absolute top-2 right-2 px-2 py-1 rounded text-xs font-bold flex items-center gap-1 ${
                    mod.status === "approved" ? "bg-green-500/20 text-green-400" :
                    mod.status === "reviewing" ? "bg-yellow-500/20 text-yellow-400" :
                    "bg-red-500/20 text-red-400"
                  }`}>
                    {mod.status === "approved" ? <CheckCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                    {mod.status}
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  {/* Header */}
                  <div className="mb-2">
                    <span className={`text-xs font-bold px-2 py-1 rounded capitalize mr-2 ${
                      mod.category === "gameplay" ? "bg-purple-500/20 text-purple-400" :
                      mod.category === "cosmetic" ? "bg-pink-500/20 text-pink-400" :
                      mod.category === "utility" ? "bg-blue-500/20 text-blue-400" :
                      "bg-green-500/20 text-green-400"
                    }`}>
                      {mod.category}
                    </span>
                    <span className="text-xs text-slate-400 bg-slate-700/50 px-2 py-1 rounded">
                      v{mod.version}
                    </span>
                  </div>

                  {/* Name & Author */}
                  <h3 className="text-lg font-bold text-white mb-1 line-clamp-2 group-hover:text-cyan-400">
                    {mod.name}
                  </h3>
                  <p className="text-xs text-slate-400 flex items-center gap-1 mb-2">
                    <User className="w-3 h-3" /> {mod.author}
                  </p>

                  {/* Description */}
                  <p className="text-xs text-slate-400 mb-3 line-clamp-2">{mod.description}</p>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                    <div className="bg-slate-700/30 p-2 rounded">
                      <div className="text-slate-400">Rating</div>
                      <div className="font-bold text-yellow-400">{mod.rating} ⭐</div>
                    </div>
                    <div className="bg-slate-700/30 p-2 rounded">
                      <div className="text-slate-400">Downloads</div>
                      <div className="font-bold text-cyan-400">{(mod.downloads / 1000).toFixed(0)}K</div>
                    </div>
                  </div>

                  {/* Engagement */}
                  <div className="flex gap-2 text-xs text-slate-400 mb-3 pb-3 border-b border-slate-700">
                    <span className="flex items-center gap-1">
                      <Heart className="w-3 h-3" /> {mod.likes.toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" /> {mod.views.toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Award className="w-3 h-3" /> {mod.reviews}
                    </span>
                  </div>

                  {/* Download Button */}
                  <Button className="w-full bg-cyan-600 hover:bg-cyan-700 gap-1" size="sm">
                    <Download className="w-4 h-4" />
                    Download ({mod.fileSize})
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="bg-slate-800 border-slate-700 w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Upload Mod</h2>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {uploadStatus === "idle" && (
              <div className="space-y-4">
                <div className="border-2 border-dashed border-slate-600 rounded-lg p-8 text-center hover:border-cyan-500 transition-colors cursor-pointer"
                  onClick={handleUploadClick}>
                  <Upload className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                  <p className="text-sm text-slate-300 mb-1">Drag mod file here or click to select</p>
                  <p className="text-xs text-slate-500">Max 2GB • ZIP or RAR format</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".zip,.rar"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-slate-300 block">Mod Title</label>
                  <input
                    type="text"
                    placeholder="My Awesome Mod"
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-slate-300 block">Description</label>
                  <textarea
                    placeholder="Describe your mod..."
                    rows={3}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm resize-none"
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => setShowUploadModal(false)}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => setUploadStatus("uploading")}
                    className="flex-1 bg-cyan-600 hover:bg-cyan-700"
                  >
                    Upload
                  </Button>
                </div>
              </div>
            )}

            {uploadStatus === "uploading" && (
              <div className="text-center py-8">
                <Loader2 className="w-8 h-8 mx-auto mb-3 animate-spin text-cyan-400" />
                <p className="text-slate-300">Uploading your mod...</p>
                <p className="text-xs text-slate-500 mt-2">Please wait while we verify your mod</p>
              </div>
            )}

            {uploadStatus === "success" && (
              <div className="text-center py-8">
                <CheckCircle className="w-8 h-8 mx-auto mb-3 text-green-400" />
                <p className="text-slate-300 font-bold">Upload Complete!</p>
                <p className="text-xs text-slate-500 mt-2">Your mod is under review and will be available soon</p>
              </div>
            )}

            {uploadStatus === "error" && (
              <div className="text-center py-8">
                <AlertCircle className="w-8 h-8 mx-auto mb-3 text-red-400" />
                <p className="text-slate-300 font-bold">Upload Failed</p>
                <p className="text-xs text-slate-500 mt-2">Please try again or contact support</p>
                <Button
                  onClick={() => setUploadStatus("idle")}
                  className="mt-4 w-full bg-cyan-600 hover:bg-cyan-700"
                  size="sm"
                >
                  Try Again
                </Button>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
