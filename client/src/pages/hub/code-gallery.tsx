import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, TrendingUp, Code, Star, Eye, Heart, Share2, Loader2 } from "lucide-react";
import { isEmbedded, getResponsiveStyles } from "@/lib/embed-utils";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";

interface CodeSnippet {
  id: string;
  creator_id: string;
  title: string;
  code: string;
  description?: string;
  language: string;
  category: string;
  creator: string;
  likes: number;
  views: number;
  tags: string[];
  created_at?: Date;
}

export default function CodeGallery() {
  const { user } = useAuth();
  const [snippets, setSnippets] = useState<CodeSnippet[]>([]);
  const [selectedSnippet, setSelectedSnippet] = useState<CodeSnippet | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSnippets();
  }, []);

  const fetchSnippets = async () => {
    try {
      const { data, error } = await supabase
        .from('code_gallery')
        .select('*')
        .eq('is_public', true)
        .order('created_at', { ascending: false });
      if (!error && data) {
        setSnippets(data.map(s => ({
          ...s,
          creator: s.creator_id,
          tags: Array.isArray(s.tags) ? s.tags : []
        })));
        if (data.length > 0) setSelectedSnippet(data[0] as any);
      }
    } catch (err) {
      console.error('Error fetching snippets:', err);
    } finally {
      setLoading(false);
    }
  };

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
                <Code className={`w-5 h-5 ${theme.iconClass}`} />
              </div>
              <div>
                <h1 className={`${theme.primaryClass} font-bold text-lg`}>Code Gallery</h1>
                <p className="text-zinc-500 text-xs">{snippets.length} snippets</p>
              </div>
            </div>
            <Button className={`${theme.activeBtn} ${theme.hoverBtn} gap-1`} size="sm">
              Share
            </Button>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className={`w-6 h-6 ${theme.iconClass} animate-spin`} />
            </div>
          )}

          {/* Snippets List */}
          {!loading && (
            <div className="space-y-3">
              {snippets.length === 0 ? (
                <div className={`${theme.cardBg} border ${theme.borderClass} rounded-xl p-8 text-center`}>
                  <Code className={`w-12 h-12 ${theme.iconClass} mx-auto mb-3 opacity-50`} />
                  <p className="text-zinc-500 text-sm">No snippets yet</p>
                  <p className="text-zinc-600 text-xs mt-1">Share your first code snippet</p>
                </div>
              ) : (
                snippets.map((snippet) => (
                  <div
                    key={snippet.id}
                    onClick={() => setSelectedSnippet(snippet)}
                    className={`${theme.cardBg} border ${theme.borderClass} rounded-xl p-4 active:scale-[0.98] transition-all ${
                      selectedSnippet?.id === snippet.id ? `border-2 ${theme.isFoundation ? 'border-red-500' : 'border-blue-500'}` : ''
                    }`}
                  >
                    {/* Language & Category */}
                    <div className="flex gap-2 mb-2">
                      <span className={`${theme.isFoundation ? 'bg-red-500' : 'bg-blue-500'} text-white text-[10px] px-2 py-0.5 rounded`}>
                        {snippet.language.toUpperCase()}
                      </span>
                      <span className="bg-purple-500 text-white text-[10px] px-2 py-0.5 rounded capitalize">
                        {snippet.category}
                      </span>
                    </div>

                    {/* Title & Author */}
                    <h3 className="text-white font-bold text-sm mb-1">{snippet.title}</h3>
                    <p className="text-zinc-400 text-xs mb-2">by {snippet.creator}</p>

                    {/* Stats */}
                    <div className="flex gap-4 text-xs text-zinc-500">
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" /> {snippet.views}
                      </span>
                      <span className="flex items-center gap-1">
                        <Heart className="w-3 h-3" /> {snippet.likes}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Selected Snippet Preview */}
          {selectedSnippet && (
            <div className={`mt-4 ${theme.cardBg} border ${theme.borderClass} rounded-xl overflow-hidden`}>
              <div className={`px-4 py-3 border-b ${theme.borderClass} flex items-center justify-between`}>
                <span className="text-white font-medium text-sm">{selectedSnippet.title}</span>
                <button onClick={() => setSelectedSnippet(null)} className="text-zinc-400">✕</button>
              </div>
              
              {/* Code Preview */}
              <div className="bg-zinc-950 p-4 font-mono text-xs text-zinc-300 overflow-x-auto max-h-40">
                {selectedSnippet.code}
              </div>

              {/* Tags */}
              <div className="px-4 py-3 flex flex-wrap gap-1">
                {selectedSnippet.tags.map((tag) => (
                  <span key={tag} className={`${theme.bgAccent} ${theme.primaryClass} text-[10px] px-2 py-0.5 rounded`}>
                    #{tag}
                  </span>
                ))}
              </div>

              {/* Actions */}
              <div className={`px-4 py-3 border-t ${theme.borderClass} flex gap-2`}>
                <Button className={`flex-1 ${theme.activeBtn} ${theme.hoverBtn} gap-1 text-xs`} size="sm">
                  <Heart className="w-3 h-3" /> Like
                </Button>
                <Button variant="outline" className="flex-1 border-zinc-700 text-zinc-300 gap-1 text-xs" size="sm">
                  <Share2 className="w-3 h-3" /> Share
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      {/* Header - hidden when embedded in OS iframe */}
      {!embedded && (
        <div className="bg-slate-950 border-b border-slate-700 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <Link href="/">
              <button className="text-slate-400 hover:text-white">
                <ArrowLeft className="w-5 h-5" />
              </button>
            </Link>
            <Code className="w-6 h-6 text-cyan-400" />
            <h1 className="text-2xl font-bold text-white">Code Gallery</h1>
          </div>
          <Button className="bg-cyan-600 hover:bg-cyan-700">Share Snippet</Button>
        </div>
      )}

      <div className="p-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Snippet List */}
          <div className="lg:col-span-1">
            <h2 className="text-lg font-bold text-white mb-4">Popular Snippets</h2>
            <div className="space-y-2">
              {snippets.map((snippet) => (
                <button
                  key={snippet.id}
                  onClick={() => setSelectedSnippet(snippet)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    selectedSnippet?.id === snippet.id
                      ? "bg-slate-700 border-cyan-500"
                      : "bg-slate-800 border-slate-700 hover:bg-slate-700"
                  }`}
                >
                  <p className="text-white font-medium truncate">{snippet.title}</p>
                  <p className="text-xs text-slate-400 mt-1">
                    by {snippet.creator}
                  </p>
                  <div className="flex gap-3 mt-2 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" /> {snippet.views}
                    </span>
                    <span className="flex items-center gap-1">
                      <Heart className="w-3 h-3" /> {snippet.likes}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Selected Snippet Preview */}
          {selectedSnippet && (
            <div className="lg:col-span-2">
              <Card className="bg-slate-800 border-slate-700 p-6">
                {/* Title & Creator */}
                <h2 className="text-2xl font-bold text-white mb-2">
                  {selectedSnippet.title}
                </h2>
                <p className="text-slate-400 mb-4">by {selectedSnippet.creator}</p>

                {/* Language & Category */}
                <div className="flex gap-2 mb-4">
                  <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded">
                    {selectedSnippet.language.toUpperCase()}
                  </span>
                  <span className="bg-purple-500 text-white text-xs px-2 py-1 rounded capitalize">
                    {selectedSnippet.category}
                  </span>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {selectedSnippet.tags.map((tag) => (
                    <span
                      key={tag}
                      className="bg-slate-700 text-cyan-300 text-xs px-2 py-1 rounded"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>

                {/* Code Block */}
                <div className="bg-slate-900 rounded-lg p-4 mb-6 font-mono text-sm text-slate-100 overflow-x-auto">
                  {selectedSnippet.code}
                </div>

                {/* Stats & Actions */}
                <div className="flex items-center justify-between border-t border-slate-700 pt-4">
                  <div className="flex gap-6 text-slate-400">
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4" />
                      <span className="text-sm">{selectedSnippet.views} views</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Heart className="w-4 h-4" />
                      <span className="text-sm">{selectedSnippet.likes} likes</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button className="bg-cyan-600 hover:bg-cyan-700 gap-2">
                      <Heart className="w-4 h-4" />
                      Like
                    </Button>
                    <Button variant="outline" className="border-slate-600 gap-2">
                      <Share2 className="w-4 h-4" />
                      Share
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
