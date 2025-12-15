import { useState } from "react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { Shield, Lock, AlertCircle } from "lucide-react";
import { useAuth } from "@/lib/auth";
import gridBg from '@assets/generated_images/dark_subtle_digital_grid_texture.png';

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const [, setLocation] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    
    try {
      await login(username, password);
      setLocation("/admin");
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-mono flex items-center justify-center relative overflow-hidden">
      <div 
        className="absolute inset-0 opacity-20 pointer-events-none z-0"
        style={{ backgroundImage: `url(${gridBg})`, backgroundSize: 'cover' }}
      />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md p-8"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 border border-primary/30 mb-4">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-display font-bold text-white uppercase tracking-wider">
            AeThex Command
          </h1>
          <p className="text-muted-foreground text-sm mt-2">
            Authorized Personnel Only
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/30 text-destructive text-sm" data-testid="error-message">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}
          
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground uppercase tracking-widest">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-card border border-white/10 px-4 py-3 text-white placeholder-muted-foreground focus:border-primary/50 focus:outline-none transition-colors"
              placeholder="Enter username"
              data-testid="input-username"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs text-muted-foreground uppercase tracking-widest">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-card border border-white/10 px-4 py-3 text-white placeholder-muted-foreground focus:border-primary/50 focus:outline-none transition-colors"
              placeholder="Enter password"
              data-testid="input-password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary text-background py-3 font-bold uppercase tracking-wider hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            data-testid="button-login"
          >
            {isLoading ? (
              <>Processing...</>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                Authenticate
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center text-xs text-muted-foreground/50">
          <a href="/" className="hover:text-primary transition-colors">
            Return to Public Site
          </a>
        </div>
      </motion.div>
    </div>
  );
}
