import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, Radio, Eye, Heart, MessageCircle, Share2, 
  Twitch, Youtube, Play, Clock, Users, TrendingUp, Filter, Search
} from "lucide-react";
import { isEmbedded } from "@/lib/embed-utils";

interface Stream {
  id: string;
  title: string;
  channel: string;
  platform: "twitch" | "youtube";
  viewers: number;
  likes: number;
  comments: number;
  game: string;
  thumbnail: string;
  isLive: boolean;
  duration?: string;
  uploadedAt: Date;
  description: string;
}

interface StreamStat {
  label: string;
  value: number | string;
  change?: string;
  icon: React.ReactNode;
}

export default function GameStreaming() {
  const [streams, setStreams] = useState<Stream[]>([]);
  const [stats, setStats] = useState<StreamStat[]>([]);
  const [selectedPlatform, setSelectedPlatform] = useState<"all" | "twitch" | "youtube">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const mockStreams: Stream[] = [
    {
      id: "1",
      title: "Minecraft Server Tournament - Finals LIVE",
      channel: "MinecraftPro",
      platform: "twitch",
      viewers: 15420,
      likes: 3200,
      comments: 4100,
      game: "Minecraft",
      thumbnail: "🎮",
      isLive: true,
      description: "Intense Minecraft PvP tournament with $10,000 prize pool",
      uploadedAt: new Date()
    },
    {
      id: "2",
      title: "Roblox Game Dev Speedrun Challenge",
      channel: "RobloxStudios",
      platform: "youtube",
      viewers: 8940,
      likes: 1200,
      comments: 890,
      game: "Roblox",
      thumbnail: "🎯",
      isLive: true,
      description: "Can we build a full game in 2 hours? Watch the chaos!",
      uploadedAt: new Date()
    },
    {
      id: "3",
      title: "Steam Game Review - Latest AAA Releases",
      channel: "GameCritic",
      platform: "youtube",
      viewers: 12300,
      likes: 2100,
      comments: 1560,
      game: "Steam Ecosystem",
      thumbnail: "⭐",
      isLive: false,
      duration: "1h 23m",
      description: "In-depth review of the hottest games on Steam this week",
      uploadedAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
    },
    {
      id: "4",
      title: "Meta Horizon Worlds - Building Tour",
      channel: "VRBuilder",
      platform: "twitch",
      viewers: 2340,
      likes: 450,
      comments: 320,
      game: "Meta Horizon",
      thumbnail: "🌐",
      isLive: true,
      description: "Exploring the best worlds created by the community",
      uploadedAt: new Date()
    },
    {
      id: "5",
      title: "Twitch Streamer Setup Compilation",
      channel: "StreamSetup",
      platform: "youtube",
      viewers: 6500,
      likes: 890,
      comments: 450,
      game: "Streaming Content",
      thumbnail: "📺",
      isLive: false,
      duration: "18m 45s",
      description: "Top 10 gaming streaming setups of 2024",
      uploadedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
    },
    {
      id: "6",
      title: "YouTube Gaming Awards Live Stream",
      channel: "YouTubeGaming",
      platform: "youtube",
      viewers: 45000,
      likes: 12000,
      comments: 8900,
      game: "Community Event",
      thumbnail: "🎬",
      isLive: true,
      description: "Annual celebration of top gaming creators and moments",
      uploadedAt: new Date()
    }
  ];

  const mockStats: StreamStat[] = [
    {
      label: "Total Viewers",
      value: "87,932",
      change: "+12%",
      icon: <Eye className="w-5 h-5 text-cyan-400" />
    },
    {
      label: "Live Streams",
      value: 4,
      change: "+2",
      icon: <Radio className="w-5 h-5 text-red-400" />
    },
    {
      label: "Total Likes",
      value: "19,840",
      change: "+8%",
      icon: <Heart className="w-5 h-5 text-pink-400" />
    },
    {
      label: "Engagement Rate",
      value: "8.4%",
      change: "+1.2%",
      icon: <TrendingUp className="w-5 h-5 text-green-400" />
    }
  ];

  useEffect(() => {
    loadStreams();
  }, []);

  const loadStreams = async () => {
    try {
      // In production: await fetch("/api/game/streams")
      setStreams(mockStreams);
      setStats(mockStats);
    } catch (err) {
      console.error("Error loading streams:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredStreams = streams.filter(stream => {
    const platformMatch = selectedPlatform === "all" || stream.platform === selectedPlatform;
    const searchMatch = stream.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                       stream.channel.toLowerCase().includes(searchQuery.toLowerCase());
    return platformMatch && searchMatch;
  });

  const liveStreams = filteredStreams.filter(s => s.isLive);
  const recordedStreams = filteredStreams.filter(s => !s.isLive);

  const embedded = isEmbedded();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-950 text-white">
      {/* Header - hidden when embedded in OS iframe */}
      {!embedded && (
        <div className="bg-slate-950 border-b border-slate-700 sticky top-0 z-10 py-4 px-4 md:px-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-3 mb-4">
              <Link href="/hub">
                <button className="text-slate-400 hover:text-white transition-colors">
                  <ArrowLeft className="w-5 h-5" />
                </button>
              </Link>
              <h1 className="text-2xl font-bold">Game Streaming Hub</h1>
            </div>

            {/* Search & Filter */}
            <div className="flex gap-2 flex-col sm:flex-row">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <input
                  placeholder="Search streams, channels..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm placeholder-slate-400"
                />
              </div>
              <select
                value={selectedPlatform}
                onChange={(e) => setSelectedPlatform(e.target.value as any)}
                className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm"
              >
                <option value="all">All Platforms</option>
                <option value="twitch">Twitch</option>
                <option value="youtube">YouTube</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          {mockStats.map((stat, idx) => (
            <Card key={idx} className="bg-slate-800 border-slate-700 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-400 uppercase">{stat.label}</span>
                {stat.icon}
              </div>
              <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
              {stat.change && <span className="text-xs text-green-400">{stat.change}</span>}
            </Card>
          ))}
        </div>

        {/* Live Streams */}
        {liveStreams.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Radio className="w-5 h-5 text-red-500 animate-pulse" />
              <h2 className="text-xl font-bold">
                Live Now ({liveStreams.length})
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {liveStreams.map((stream) => (
                <Card
                  key={stream.id}
                  className="bg-slate-800 border-red-500/30 border-2 overflow-hidden hover:border-red-500 transition-all cursor-pointer group"
                >
                  {/* Thumbnail */}
                  <div className="relative h-40 bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center text-4xl group-hover:scale-105 transition-transform">
                    {stream.thumbnail}
                    <div className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded font-bold flex items-center gap-1">
                      <Radio className="w-3 h-3 animate-pulse" /> LIVE
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <h3 className="font-bold text-white mb-1 line-clamp-2 group-hover:text-cyan-400">
                      {stream.title}
                    </h3>
                    <p className="text-xs text-slate-400 mb-2">
                      {stream.channel} • {stream.game}
                    </p>

                    <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" /> {stream.viewers.toLocaleString()}
                        </span>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        stream.platform === 'twitch'
                          ? 'bg-purple-500/20 text-purple-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {stream.platform === 'twitch' ? <Twitch className="w-3 h-3 inline mr-1" /> : <Youtube className="w-3 h-3 inline mr-1" />}
                        {stream.platform}
                      </span>
                    </div>

                    <Button className="w-full bg-cyan-600 hover:bg-cyan-700 gap-1" size="sm">
                      <Play className="w-3 h-3" /> Watch Live
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Recorded Streams */}
        {recordedStreams.length > 0 && (
          <div>
            <h2 className="text-xl font-bold mb-4">Recorded Streams</h2>

            <div className="space-y-2">
              {recordedStreams.map((stream) => (
                <Card
                  key={stream.id}
                  className="bg-slate-800 border-slate-700 p-4 hover:border-cyan-500 transition-all cursor-pointer group"
                >
                  <div className="flex gap-4">
                    {/* Thumbnail */}
                    <div className="w-32 h-20 bg-gradient-to-br from-slate-700 to-slate-900 rounded flex items-center justify-center text-3xl flex-shrink-0 group-hover:scale-105 transition-transform">
                      {stream.thumbnail}
                      {stream.duration && (
                        <div className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1 py-0.5 rounded font-bold flex items-center gap-1">
                          <Clock className="w-2 h-2" /> {stream.duration}
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-white mb-1 line-clamp-2 group-hover:text-cyan-400">
                        {stream.title}
                      </h3>
                      <p className="text-xs text-slate-400 mb-2">
                        {stream.channel} • {stream.game}
                      </p>
                      <p className="text-xs text-slate-500 mb-2 line-clamp-1">{stream.description}</p>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-xs text-slate-400">
                          <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3" /> {stream.viewers.toLocaleString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <Heart className="w-3 h-3" /> {stream.likes.toLocaleString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageCircle className="w-3 h-3" /> {stream.comments.toLocaleString()}
                          </span>
                        </div>
                        <Button className="bg-cyan-600 hover:bg-cyan-700 gap-1 h-7 px-2" size="sm">
                          <Play className="w-3 h-3" /> Watch
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
