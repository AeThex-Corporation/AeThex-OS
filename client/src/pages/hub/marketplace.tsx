import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, ShoppingCart, Star, Plus, Loader2 } from "lucide-react";
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      {/* Header */}
      <div className="bg-slate-950 border-b border-slate-700 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Link href="/">
            <button className="text-slate-400 hover:text-white">
              <ArrowLeft className="w-5 h-5" />
            </button>
          </Link>
          <h1 className="text-2xl font-bold text-white">Marketplace</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-slate-800 px-4 py-2 rounded-lg border border-slate-700">
            <p className="text-sm text-slate-400">Balance</p>
            <p className="text-xl font-bold text-cyan-400">{balance} LP</p>
          </div>
          <Button className="bg-cyan-600 hover:bg-cyan-700 gap-2">
            <Plus className="w-4 h-4" />
            Sell Item
          </Button>
        </div>
      </div>

      <div className="p-6 max-w-7xl mx-auto">
        {/* Category Tabs */}
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="mb-6">
          <TabsList className="bg-slate-800 border-b border-slate-700">
            <TabsTrigger value="all" className="text-slate-300">
              All Items
            </TabsTrigger>
            <TabsTrigger value="code" className="text-slate-300">
              Code & Snippets
            </TabsTrigger>
            <TabsTrigger value="achievement" className="text-slate-300">
              Achievements
            </TabsTrigger>
            <TabsTrigger value="service" className="text-slate-300">
              Services
            </TabsTrigger>
            <TabsTrigger value="credential" className="text-slate-300">
              Credentials
            </TabsTrigger>
          </TabsList>

          <TabsContent value={selectedCategory} className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredListings.map((listing) => (
                <Card
                  key={listing.id}
                  className="bg-slate-800 border-slate-700 p-5 hover:border-cyan-500 transition-all group cursor-pointer"
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
                  <h3 className="text-white font-bold mb-2 text-lg group-hover:text-cyan-400 transition-colors">
                    {listing.title}
                  </h3>

                  {/* Seller Info */}
                  <div className="mb-3 text-sm">
                    <p className="text-slate-400">by {listing.seller}</p>
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
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold text-cyan-400">
                      {listing.price}
                      <span className="text-sm text-slate-400 ml-1">LP</span>
                    </div>
                    <Button className="bg-cyan-600 hover:bg-cyan-700 gap-2 h-9 px-3">
                      <ShoppingCart className="w-4 h-4" />
                      Buy
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Featured Section */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-white mb-4">Featured Sellers</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {["CodeMaster", "TechGuru", "AchievmentHunter"].map((seller) => (
              <Card
                key={seller}
                className="bg-slate-800 border-slate-700 p-4 hover:border-cyan-500 transition-colors"
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
