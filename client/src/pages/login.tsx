import { useState } from "react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { Shield, Lock, AlertCircle, UserPlus } from "lucide-react";
import { useAuth } from "@/lib/auth";
import gridBg from '@assets/generated_images/dark_subtle_digital_grid_texture.png';

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const { login, signup } = useAuth();
  const [, setLocation] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    
    setError("");
    setSuccess("");
    setIsLoading(true);
    
    try {
      if (mode === 'login') {
        await login(email, password);
        await new Promise(resolve => setTimeout(resolve, 100));
        setLocation("/admin");
      } else {
        const result = await signup(email, password);
        setSuccess(result.message || "Account created! Please check your email to confirm.");
        setMode('login');
      }
    } catch (err: any) {
      setError(err.message || `${mode === 'login' ? 'Login' : 'Signup'} failed`);
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
            {mode === 'login' ? 'Authorized Personnel Only' : 'Create Your Account'}
          </p>
        </div>

        <div className="flex mb-6 border border-white/10 rounded overflow-hidden">
          <button
            type="button"
            onClick={() => { setMode('login'); setError(''); setSuccess(''); }}
            className={`flex-1 py-2 text-sm uppercase tracking-wider transition-colors ${
              mode === 'login' ? 'bg-primary text-background' : 'bg-card text-muted-foreground hover:text-white'
            }`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => { setMode('signup'); setError(''); setSuccess(''); }}
            className={`flex-1 py-2 text-sm uppercase tracking-wider transition-colors ${
              mode === 'signup' ? 'bg-primary text-background' : 'bg-card text-muted-foreground hover:text-white'
            }`}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/30 text-destructive text-sm" data-testid="error-message">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}
          
          {success && (
            <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/30 text-green-400 text-sm" data-testid="success-message">
              {success}
            </div>
          )}
          
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground uppercase tracking-widest">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-card border border-white/10 px-4 py-3 text-white placeholder-muted-foreground focus:border-primary/50 focus:outline-none transition-colors"
              placeholder="Enter email"
              data-testid="input-email"
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
              placeholder={mode === 'signup' ? 'Min 6 characters' : 'Enter password'}
              data-testid="input-password"
              required
              minLength={mode === 'signup' ? 6 : undefined}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary text-background py-3 font-bold uppercase tracking-wider hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            data-testid="button-submit"
          >
            {isLoading ? (
              <>Processing...</>
            ) : mode === 'login' ? (
              <>
                <Lock className="w-4 h-4" />
                Authenticate
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                Create Account
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
