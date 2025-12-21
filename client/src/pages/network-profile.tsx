import { motion } from "framer-motion";
import { Link, useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { 
  ArrowLeft, Shield, Zap, ExternalLink, Github, Twitter, 
  Globe, Award, Code, User, Loader2, AlertCircle
} from "lucide-react";

interface ArchitectProfile {
  id: string;
  name: string;
  role: string;
  bio: string | null;
  level: number;
  xp: number;
  passportId: string | null;
  skills: string[] | null;
  isVerified: boolean;
  avatarUrl: string | null;
  github: string | null;
  twitter: string | null;
  website: string | null;
}

export default function NetworkProfile() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;

  const { data: profile, isLoading, error } = useQuery<ArchitectProfile>({
    queryKey: ['architect', slug],
    queryFn: async () => {
      const res = await fetch(`/api/directory/architects/${slug}`);
      if (!res.ok) {
        throw new Error('Architect not found');
      }
      return res.json();
    },
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white font-mono flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-black text-white font-mono flex flex-col items-center justify-center gap-4">
        <AlertCircle className="w-12 h-12 text-red-500" />
        <h1 className="text-2xl font-bold">Architect Not Found</h1>
        <p className="text-cyan-500/60">The requested profile does not exist in our directory.</p>
        <Link href="/network">
          <button className="mt-4 flex items-center gap-2 text-cyan-500 hover:text-cyan-400 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Network
          </button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white font-mono selection:bg-cyan-500 selection:text-black">
      <div className="fixed inset-0 opacity-5 pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(0,255,255,0.03) 1px, rgba(0,255,255,0.03) 2px)`,
          backgroundSize: '100% 4px'
        }} />
      </div>

      <nav className="relative z-20 flex justify-between items-center px-6 py-4 border-b border-cyan-500/20">
        <Link href="/network">
          <button className="flex items-center gap-2 text-cyan-500/60 hover:text-cyan-500 transition-colors" data-testid="link-back-network">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-xs uppercase tracking-wider">Network</span>
          </button>
        </Link>
        <div className="text-cyan-500 font-bold tracking-widest uppercase text-sm">
          Architect Profile
        </div>
        <div className="w-20" />
      </nav>

      <main className="relative z-10 max-w-2xl mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          <div className="text-center space-y-4">
            <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center">
              {profile.avatarUrl ? (
                <img 
                  src={profile.avatarUrl} 
                  alt={profile.name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <User className="w-10 h-10 text-white" />
              )}
            </div>
            
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center justify-center gap-2">
                {profile.name}
                {profile.isVerified && (
                  <Shield className="w-5 h-5 text-cyan-500" />
                )}
              </h1>
              <p className="text-cyan-500/60 uppercase tracking-wider text-sm">
                {profile.role}
              </p>
            </div>

            {profile.passportId && (
              <div className="inline-block border border-cyan-500/30 bg-cyan-500/10 px-4 py-2">
                <span className="text-cyan-500/60 text-xs uppercase tracking-wider">Passport ID</span>
                <p className="text-cyan-500 font-bold">{profile.passportId}</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="border border-purple-500/30 bg-purple-500/10 p-4 text-center">
              <div className="flex items-center justify-center gap-1 text-purple-500 mb-1">
                <Award className="w-4 h-4" />
                <span className="text-xs uppercase tracking-wider">Level</span>
              </div>
              <p className="text-2xl font-bold text-white">{profile.level || 1}</p>
            </div>
            <div className="border border-yellow-500/30 bg-yellow-500/10 p-4 text-center">
              <div className="flex items-center justify-center gap-1 text-yellow-500 mb-1">
                <Zap className="w-4 h-4" />
                <span className="text-xs uppercase tracking-wider">XP</span>
              </div>
              <p className="text-2xl font-bold text-white">{profile.xp?.toLocaleString() || 0}</p>
            </div>
          </div>

          {profile.bio && (
            <div className="border border-cyan-500/20 bg-cyan-500/5 p-6">
              <h3 className="text-cyan-500/60 text-xs uppercase tracking-wider mb-2">Bio</h3>
              <p className="text-white/80">{profile.bio}</p>
            </div>
          )}

          {profile.skills && profile.skills.length > 0 && (
            <div>
              <h3 className="text-cyan-500/60 text-xs uppercase tracking-wider mb-3 flex items-center gap-2">
                <Code className="w-4 h-4" />
                Skills
              </h3>
              <div className="flex flex-wrap gap-2">
                {profile.skills.map((skill) => (
                  <span 
                    key={skill}
                    className="px-3 py-1 border border-cyan-500/30 bg-cyan-500/10 text-cyan-500 text-sm"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {(profile.github || profile.twitter || profile.website) && (
            <div className="flex justify-center gap-4 pt-4 border-t border-cyan-500/20">
              {profile.github && (
                <a 
                  href={profile.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-cyan-500/60 hover:text-cyan-500 transition-colors"
                  data-testid="link-github"
                >
                  <Github className="w-5 h-5" />
                  <span className="text-sm">GitHub</span>
                </a>
              )}
              {profile.twitter && (
                <a 
                  href={profile.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-cyan-500/60 hover:text-cyan-500 transition-colors"
                  data-testid="link-twitter"
                >
                  <Twitter className="w-5 h-5" />
                  <span className="text-sm">Twitter</span>
                </a>
              )}
              {profile.website && (
                <a 
                  href={profile.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-cyan-500/60 hover:text-cyan-500 transition-colors"
                  data-testid="link-website"
                >
                  <Globe className="w-5 h-5" />
                  <span className="text-sm">Website</span>
                </a>
              )}
            </div>
          )}
        </motion.div>
      </main>

      <footer className="relative z-10 border-t border-cyan-500/10 py-8 px-6 text-center">
        <div className="text-cyan-500/30 text-xs uppercase tracking-wider">
          AeThex Network // Architect Profile
        </div>
      </footer>
    </div>
  );
}
