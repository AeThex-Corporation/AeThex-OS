import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, TrendingUp, Code, Star, Eye, Heart, Share2, Loader2 } from "lucide-react";
import { isEmbedded } from "@/lib/embed-utils";
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
