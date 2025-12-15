import { type User, type Profile, type Project } from "@shared/schema";
import { supabase } from "./supabase";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  
  // Profiles
  getProfiles(): Promise<Profile[]>;
  getProfile(id: string): Promise<Profile | undefined>;
  getProfileByUsername(username: string): Promise<Profile | undefined>;
  updateProfile(id: string, data: Partial<Profile>): Promise<Profile | undefined>;
  
  // Projects
  getProjects(): Promise<Project[]>;
  getProject(id: string): Promise<Project | undefined>;
  
  // Metrics
  getMetrics(): Promise<{
    totalProfiles: number;
    totalProjects: number;
    onlineUsers: number;
    verifiedUsers: number;
    totalXP: number;
    avgLevel: number;
  }>;
}

export class SupabaseStorage implements IStorage {
  
  async getUser(id: string): Promise<User | undefined> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !data) return undefined;
    return data as User;
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .single();
    
    if (error || !data) return undefined;
    return data as User;
  }
  
  async getProfiles(): Promise<Profile[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) return [];
    return data as Profile[];
  }
  
  async getProfile(id: string): Promise<Profile | undefined> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !data) return undefined;
    return data as Profile;
  }
  
  async getProfileByUsername(username: string): Promise<Profile | undefined> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', username)
      .single();
    
    if (error || !data) return undefined;
    return data as Profile;
  }
  
  async updateProfile(id: string, updates: Partial<Profile>): Promise<Profile | undefined> {
    const { data, error } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    
    if (error || !data) return undefined;
    return data as Profile;
  }
  
  async getProjects(): Promise<Project[]> {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) return [];
    return data as Project[];
  }
  
  async getProject(id: string): Promise<Project | undefined> {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !data) return undefined;
    return data as Project;
  }
  
  async getMetrics(): Promise<{
    totalProfiles: number;
    totalProjects: number;
    onlineUsers: number;
    verifiedUsers: number;
    totalXP: number;
    avgLevel: number;
  }> {
    // Get profiles for metrics
    const profiles = await this.getProfiles();
    const projects = await this.getProjects();
    
    const onlineUsers = profiles.filter(p => p.status === 'online').length;
    const verifiedUsers = profiles.filter(p => p.is_verified).length;
    const totalXP = profiles.reduce((sum, p) => sum + (p.total_xp || 0), 0);
    const avgLevel = profiles.length > 0 
      ? profiles.reduce((sum, p) => sum + (p.level || 1), 0) / profiles.length 
      : 1;
    
    return {
      totalProfiles: profiles.length,
      totalProjects: projects.length,
      onlineUsers,
      verifiedUsers,
      totalXP,
      avgLevel: Math.round(avgLevel * 10) / 10,
    };
  }
}

export const storage = new SupabaseStorage();
