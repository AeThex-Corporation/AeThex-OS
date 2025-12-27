import { createContext, useContext, ReactNode } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "./supabase";
import { isMobile } from "./platform";

interface User {
  id: string;
  email?: string;
  username: string;
  isAdmin: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, username?: string) => Promise<{ message: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  
  const { data: session, isLoading } = useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      // On mobile, use Supabase directly
      if (isMobile()) {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (!data.session) return { authenticated: false };
        
        return {
          authenticated: true,
          user: {
            id: data.session.user.id,
            email: data.session.user.email,
            username: data.session.user.email?.split('@')[0] || 'user',
            isAdmin: false
          }
        };
      }
      
      // On web/desktop, use API server
      const res = await fetch("/api/auth/session", { credentials: "include" });
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });
  
  const loginMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      // On mobile, use Supabase directly
      if (isMobile()) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw new Error(error.message);
        return { success: true, user: data.user };
      }
      
      // On web/desktop, use API server
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Login failed");
      }
      return res.json();
    },
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: ["session"] });
    },
  });
  
  const signupMutation = useMutation({
    mutationFn: async ({ email, password, username }: { email: string; password: string; username?: string }) => {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password, username }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Signup failed");
      }
      return res.json();
    },
  });
  
  const logoutMutation = useMutation({
    mutationFn: async () => {
      // On mobile, use Supabase directly
      if (isMobile()) {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        return;
      }
      
      // On web/desktop, use API server
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["session"] });
    },
  });
  
  const login = async (email: string, password: string) => {
    await loginMutation.mutateAsync({ email, password });
  };
  
  const signup = async (email: string, password: string, username?: string) => {
    return await signupMutation.mutateAsync({ email, password, username });
  };
  
  const logout = async () => {
    await logoutMutation.mutateAsync();
  };
  
  const value: AuthContextType = {
    user: session?.authenticated ? session.user : null,
    isLoading,
    isAuthenticated: !!session?.authenticated,
    isAdmin: session?.user?.isAdmin || false,
    login,
    signup,
    logout,
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
