import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, ShoppingCart, Star, Plus, Loader2 } from "lucide-react";
import { isEmbedded, getResponsiveStyles } from "@/lib/embed-utils";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";

interface Listing {
  id: string;
  title: string;
  category: "achievement" | "code" | "service" | "credential";
  price: number;
  seller: string;
  rating: number;
  purchases: number;
  image?: string;
}

export default function Marketplace() {
  const { user } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [balance] = useState(2500);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchListings();
  }, [selectedCategory]);

  const fetchListings = async () => {
    try {
      let query = supabase.from('marketplace_listings').select('*');
      if (selectedCategory !== 'all') {
        query = query.eq('category', selectedCategory);
      }
      const { data, error } = await query.order('created_at', { ascending: false });
      if (!error && data) {
        setListings(data.map(l => ({
          id: l.id,
          title: l.title,
          category: l.category as any,
          price: l.price,
          seller: l.seller_id,
          rating: 4.5,
          purchases: l.purchase_count || 0
        })));
      }
    } catch (err) {
      console.error('Error fetching listings:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredListings =
    selectedCategory === "all"
      ? listings
      : listings.filter((l) => l.category === selectedCategory);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "achievement":
        return "bg-yellow-500";
      case "code":
        return "bg-blue-500";
      case "service":
        return "bg-purple-500";
      case "credential":
        return "bg-green-500";
      default:
        return "bg-gray-500";
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
                <ShoppingCart className={`w-5 h-5 ${theme.iconClass}`} />
              </div>
              <div>
                <h1 className={`${theme.primaryClass} font-bold text-lg`}>Marketplace</h1>
                <p className="text-zinc-500 text-xs">{listings.length} items</p>
              </div>
            </div>
            <div className={`${theme.cardBg} px-3 py-1.5 rounded-lg border ${theme.borderClass}`}>
              <p className={`text-sm font-bold ${theme.primaryClass}`}>{balance} LP</p>
            </div>
          </div>

          {/* Category Pills */}
          <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
            {["all", "code", "achievement", "service", "credential"].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === cat
                    ? `${theme.activeBtn} text-white`
                    : `${theme.cardBg} text-zinc-400 border ${theme.borderClass}`
                }`}
              >
                {cat === "all" ? "All" : cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className={`w-6 h-6 ${theme.iconClass} animate-spin`} />
            </div>
          )}

          {/* Listings Grid */}
          {!loading && (
            <div className="space-y-3">
              {filteredListings.length === 0 ? (
                <div className={`${theme.cardBg} border ${theme.borderClass} rounded-xl p-8 text-center`}>
                  <ShoppingCart className={`w-12 h-12 ${theme.iconClass} mx-auto mb-3 opacity-50`} />
                  <p className="text-zinc-500 text-sm">No items found</p>
                </div>
              ) : (
                filteredListings.map((listing) => (
                  <div
                    key={listing.id}
                    className={`${theme.cardBg} border ${theme.borderClass} rounded-xl p-4 active:scale-[0.98] transition-transform`}
                  >
                    {/* Category Badge */}
                    <div className="mb-2">
                      <span className={`${getCategoryColor(listing.category)} text-white text-[10px] font-bold px-2 py-0.5 rounded capitalize`}>
                        {listing.category}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="text-white font-bold text-sm mb-1">{listing.title}</h3>
                    <p className="text-zinc-400 text-xs mb-2">by {listing.seller}</p>

                    {/* Rating & Stats */}
                    <div className="flex items-center gap-3 mb-3 text-xs text-zinc-500">
                      <span className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                        {listing.rating}
                      </span>
                      <span>{listing.purchases} sold</span>
                    </div>

                    {/* Price & Buy */}
                    <div className="flex items-center justify-between">
                      <div className={`text-lg font-bold ${theme.primaryClass}`}>
                        {listing.price}
                        <span className="text-xs text-zinc-500 ml-1">LP</span>
                      </div>
                      <Button className={`${theme.activeBtn} ${theme.hoverBtn} gap-1 text-xs`} size="sm">
                        <ShoppingCart className="w-3 h-3" /> Buy
                      </Button>
                    </div>
                  </div>
                ))
              )}
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
        <div className="bg-slate-950 border-b border-slate-700 px-3 md:px-6 py-3 md:py-4 sticky top-0 z-10">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 md:gap-4 min-w-0 flex-1">
              <Link href="/">
                <button className="text-slate-400 hover:text-white shrink-0">
                  <ArrowLeft className="w-5 h-5" />
                </button>
              </Link>
              <h1 className="text-lg md:text-2xl font-bold text-white truncate">Marketplace</h1>
            </div>
            <div className="flex items-center gap-2 md:gap-4 shrink-0">
              <div className="bg-slate-800 px-2 md:px-4 py-1.5 md:py-2 rounded-lg border border-slate-700">
                <p className="text-xs text-slate-400 hidden sm:block">Balance</p>
                <p className="text-sm md:text-xl font-bold text-cyan-400">{balance} LP</p>
              </div>
              <Button className="bg-cyan-600 hover:bg-cyan-700 gap-1 md:gap-2 text-xs md:text-sm px-2 md:px-4 h-8 md:h-10">
                <Plus className="w-3 h-3 md:w-4 md:h-4" />
                <span className="hidden sm:inline">Sell Item</span>
                <span className="sm:hidden">Sell</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="p-3 md:p-6 max-w-7xl mx-auto">
        {/* Category Tabs */}
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="mb-6">
          <TabsList className="bg-slate-800 border-b border-slate-700 w-full overflow-x-auto flex-nowrap">
            <TabsTrigger value="all" className="text-slate-300 text-xs md:text-sm whitespace-nowrap">
              All Items
            </TabsTrigger>
            <TabsTrigger value="code" className="text-slate-300 text-xs md:text-sm whitespace-nowrap">
              Code
            </TabsTrigger>
            <TabsTrigger value="achievement" className="text-slate-300 text-xs md:text-sm whitespace-nowrap">
              Achievements
            </TabsTrigger>
            <TabsTrigger value="service" className="text-slate-300 text-xs md:text-sm whitespace-nowrap">
              Services
            </TabsTrigger>
            <TabsTrigger value="credential" className="text-slate-300 text-xs md:text-sm whitespace-nowrap">
              Credentials
            </TabsTrigger>
          </TabsList>

          <TabsContent value={selectedCategory} className="mt-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
              </div>
            ) : filteredListings.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No items found in this category</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
              {filteredListings.map((listing) => (
                <Card
                  key={listing.id}
                  className="bg-slate-800 border-slate-700 p-4 md:p-5 hover:border-cyan-500 transition-all group cursor-pointer active:scale-[0.98]"
                >
                  {/* Category Badge */}
                  <div className="mb-3 flex items-center gap-2">
                    <span
                      className={`${getCategoryColor(
                        listing.category
                      )} text-white text-xs font-bold px-2 py-1 rounded capitalize`}
                    >
                      {listing.category}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-white font-bold mb-2 text-base md:text-lg group-hover:text-cyan-400 transition-colors line-clamp-2">
                    {listing.title}
                  </h3>

                  {/* Seller Info */}
                  <div className="mb-3 text-sm">
                    <p className="text-slate-400 truncate">by {listing.seller}</p>
                  </div>

                  {/* Rating & Purchases */}
                  <div className="flex items-center justify-between mb-4 text-xs text-slate-400">
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                      <span>{listing.rating}</span>
                    </div>
                    <span>{listing.purchases} purchased</span>
                  </div>

                  {/* Price & Button */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-xl md:text-2xl font-bold text-cyan-400">
                      {listing.price}
                      <span className="text-xs md:text-sm text-slate-400 ml-1">LP</span>
                    </div>
                    <Button className="bg-cyan-600 hover:bg-cyan-700 gap-1 md:gap-2 h-8 md:h-9 px-2 md:px-3 text-xs md:text-sm">
                      <ShoppingCart className="w-3 h-3 md:w-4 md:h-4" />
                      Buy
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Featured Section */}
        <div className="mt-12">
          <h2 className="text-xl md:text-2xl font-bold text-white mb-4">Featured Sellers</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
            {["CodeMaster", "TechGuru", "AchievmentHunter"].map((seller) => (
              <Card
                key={seller}
                className="bg-slate-800 border-slate-700 p-4 hover:border-cyan-500 transition-colors cursor-pointer active:scale-[0.98]"
              >
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-cyan-600 mx-auto mb-3"></div>
                  <p className="text-white font-bold mb-1">{seller}</p>
                  <p className="text-slate-400 text-sm mb-3">★★★★★</p>
                  <Button variant="outline" className="w-full border-slate-600 text-slate-300">
                    View Store
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
