import { motion } from "framer-motion";
import { Link } from "wouter";
import { ArrowLeft, Calendar, Clock, MapPin, Users, Loader2, Star } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import gridBg from '@assets/generated_images/dark_subtle_digital_grid_texture.png';

export default function Events() {
  const { data: events, isLoading } = useQuery<any[]>({
    queryKey: ["/api/events"],
  });

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const formatPrice = (price: string | number | null) => {
    if (!price || price === 0) return "Free";
    return `$${Number(price).toFixed(2)}`;
  };

  const getCategoryColor = (category?: string) => {
    switch (category?.toLowerCase()) {
      case 'workshop': return 'text-purple-400 border-purple-400/30 bg-purple-500/10';
      case 'conference': return 'text-blue-400 border-blue-400/30 bg-blue-500/10';
      case 'hackathon': return 'text-green-400 border-green-400/30 bg-green-500/10';
      case 'meetup': return 'text-yellow-400 border-yellow-400/30 bg-yellow-500/10';
      default: return 'text-cyan-400 border-cyan-400/30 bg-cyan-500/10';
    }
  };

  return (
    <div className="min-h-screen bg-black text-foreground font-mono relative p-4 md:p-8">
      {/* Background */}
      <div 
        className="absolute inset-0 opacity-10 pointer-events-none z-0"
        style={{ backgroundImage: `url(${gridBg})`, backgroundSize: 'cover' }}
      />

      <div className="relative z-10 max-w-6xl mx-auto">
        <Link href="/">
          <button className="mb-8 text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 uppercase text-xs tracking-widest">
            <ArrowLeft className="w-4 h-4" /> Return to Axiom
          </button>
        </Link>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-display font-bold text-white tracking-widest uppercase mb-2">
            Events
          </h1>
          <p className="text-primary text-sm uppercase tracking-wider">
            Connect. Learn. Build. · {events?.length || 0} Upcoming Events
          </p>
        </motion.div>

        {isLoading ? (
          <div className="flex items-center justify-center gap-2 text-primary py-12">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span>Loading events...</span>
          </div>
        ) : !events || events.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Calendar className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p className="text-lg">No events scheduled yet.</p>
            <p className="text-sm mt-2">Check back soon for upcoming events!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event: any, index: number) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className="bg-card border border-white/10 overflow-hidden hover:border-primary/30 transition-all hover:shadow-lg hover:shadow-primary/10"
              >
                {/* Event Image */}
                {event.image_url && (
                  <div className="aspect-video bg-white/5 relative overflow-hidden">
                    <img 
                      src={event.image_url} 
                      alt={event.title}
                      className="w-full h-full object-cover opacity-80"
                    />
                    {event.featured && (
                      <div className="absolute top-2 right-2 px-2 py-1 bg-yellow-500/20 border border-yellow-400/50 text-yellow-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                        <Star className="w-3 h-3 fill-current" /> Featured
                      </div>
                    )}
                  </div>
                )}

                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <h3 className="text-lg font-bold text-white line-clamp-2 flex-1">
                      {event.title}
                    </h3>
                    {event.category && (
                      <span className={`px-2 py-1 text-xs font-bold uppercase tracking-wider border ${getCategoryColor(event.category)}`}>
                        {event.category}
                      </span>
                    )}
                  </div>

                  {event.description && (
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {event.description}
                    </p>
                  )}

                  <div className="space-y-2 text-sm text-muted-foreground mb-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-primary" />
                      <span>{formatDate(event.date)}</span>
                    </div>
                    {event.time && (
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-primary" />
                        <span>{event.time}</span>
                      </div>
                    )}
                    {event.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-primary" />
                        <span className="truncate">{event.location}</span>
                      </div>
                    )}
                    {event.capacity && (
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-primary" />
                        <span>{event.capacity} spots available</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-white/10">
                    <div className="text-xl font-bold text-primary">
                      {formatPrice(event.price)}
                    </div>
                    <button className="px-4 py-2 bg-primary text-black font-bold uppercase tracking-wider hover:bg-primary/90 transition-colors text-xs">
                      Register
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
