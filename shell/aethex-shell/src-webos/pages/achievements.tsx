import { motion } from "framer-motion";
import { Link } from "wouter";
import { ArrowLeft, Trophy, Star, Lock, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import gridBg from '@assets/generated_images/dark_subtle_digital_grid_texture.png';

export default function Achievements() {
  const { user } = useAuth();

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["/api/me/profile"],
    enabled: !!user
  });

  const { data: userAchievements, isLoading: achievementsLoading } = useQuery<any[]>({
    queryKey: ["/api/me/achievements"],
    enabled: !!user
  });

  const { data: allAchievements, isLoading: allLoading } = useQuery<any[]>({
    queryKey: ["/api/achievements"],
    enabled: !!user
  });

  const isLoading = profileLoading || achievementsLoading || allLoading;

  if (!user) {
    return (
      <div className="min-h-screen bg-black text-foreground font-mono flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Please log in to view achievements</p>
          <Link href="/login">
            <button className="px-4 py-2 bg-primary text-black font-bold uppercase tracking-wider hover:bg-primary/90 transition-colors">
              Login
            </button>
          </Link>
        </div>
      </div>
    );
  }

  // Create a set of unlocked achievement IDs
  const unlockedIds = new Set((userAchievements || []).map((a: any) => a.achievement_id || a.id));

  // Separate unlocked and locked achievements
  const unlocked = userAchievements || [];
  const locked = (allAchievements || []).filter((a: any) => !unlockedIds.has(a.id));

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
            Achievements
          </h1>
          <p className="text-primary text-sm uppercase tracking-wider">
            Total XP: {(profile as any)?.total_xp?.toLocaleString() || 0} · Unlocked: {unlocked.length} / {allAchievements?.length || 0}
          </p>
        </motion.div>

        {isLoading ? (
          <div className="flex items-center justify-center gap-2 text-primary py-12">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span>Loading achievements...</span>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Unlocked Achievements */}
            {unlocked.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-secondary uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Trophy className="w-5 h-5" /> Unlocked ({unlocked.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {unlocked.map((achievement: any, index: number) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-card border border-secondary/30 p-4 shadow-lg hover:shadow-secondary/20 transition-all hover:scale-105"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-12 h-12 bg-secondary/20 border border-secondary/50 flex items-center justify-center">
                          <Star className="w-6 h-6 text-secondary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-white uppercase text-sm tracking-wide truncate">
                            {achievement.title}
                          </h3>
                          {achievement.description && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {achievement.description}
                            </p>
                          )}
                          <div className="mt-2 flex items-center justify-between">
                            <span className="text-secondary font-bold text-sm">
                              +{achievement.xp_reward || 0} XP
                            </span>
                            {achievement.earned_at && (
                              <span className="text-xs text-muted-foreground">
                                {new Date(achievement.earned_at).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Locked Achievements */}
            {locked.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Lock className="w-5 h-5" /> Locked ({locked.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {locked.map((achievement: any, index: number) => (
                    <motion.div
                      key={achievement.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: (unlocked.length + index) * 0.05 }}
                      className="bg-card/50 border border-white/10 p-4 opacity-60"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-12 h-12 bg-white/5 border border-white/20 flex items-center justify-center">
                          <Lock className="w-6 h-6 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-muted-foreground uppercase text-sm tracking-wide truncate">
                            {achievement.title}
                          </h3>
                          {achievement.description && (
                            <p className="text-xs text-muted-foreground/70 mt-1 line-clamp-2">
                              {achievement.description}
                            </p>
                          )}
                          <div className="mt-2">
                            <span className="text-muted-foreground font-bold text-sm">
                              +{achievement.xp_reward || 0} XP
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {unlocked.length === 0 && locked.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Trophy className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p className="text-lg">No achievements available yet.</p>
                <p className="text-sm mt-2">Start building to earn your first achievement!</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
