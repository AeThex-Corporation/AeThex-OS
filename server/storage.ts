import { type Profile, type Project, type ChatMessage } from "@shared/schema";
import { supabase } from "./supabase";

export interface IStorage {
  // Profiles
  getProfiles(): Promise<Profile[]>;
  getProfile(id: string): Promise<Profile | undefined>;
  getProfileByUsername(username: string): Promise<Profile | undefined>;
  updateProfile(id: string, data: Partial<Profile>): Promise<Profile | undefined>;
  getLeadershipProfiles(): Promise<Profile[]>;
  
  // Projects
  getProjects(): Promise<Project[]>;
  getProject(id: string): Promise<Project | undefined>;
  
  // Sites
  getSites(): Promise<any[]>;
  
  // Auth Logs
  getAuthLogs(): Promise<any[]>;
  
  // Achievements
  getAchievements(): Promise<any[]>;
  
  // Applications
  getApplications(): Promise<any[]>;
  updateApplication(id: string, updates: any): Promise<any>;
  
  // Alerts
  getAlerts(): Promise<any[]>;
  updateAlert(id: string, updates: any): Promise<any>;
  
  // Chat Messages (AI memory)
  getChatHistory(userId: string, limit?: number): Promise<ChatMessage[]>;
  saveChatMessage(id: string, userId: string, role: string, content: string): Promise<void>;
  clearChatHistory(userId: string): Promise<void>;
  
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
  
  async getSites(): Promise<any[]> {
    const { data, error } = await supabase
      .from('aethex_sites')
      .select('*')
      .order('last_check', { ascending: false });
    
    if (error) return [];
    return data || [];
  }
  
  async getAuthLogs(): Promise<any[]> {
    const { data, error } = await supabase
      .from('auth_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);
    
    if (error) return [];
    return data || [];
  }
  
  async getAchievements(): Promise<any[]> {
    const { data, error } = await supabase
      .from('achievements')
      .select('*')
      .order('name', { ascending: true });
    
    if (error) return [];
    return data || [];
  }
  
  async getApplications(): Promise<any[]> {
    const { data, error } = await supabase
      .from('applications')
      .select('*')
      .order('submitted_at', { ascending: false });
    
    if (error) return [];
    return data || [];
  }
  
  async getAlerts(): Promise<any[]> {
    const { data, error } = await supabase
      .from('aethex_alerts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (error) return [];
    return data || [];
  }
  
  async updateAlert(id: string, updates: any): Promise<any> {
    const updateData: any = {};
    if ('is_resolved' in updates) {
      updateData.is_resolved = updates.is_resolved;
    }
    
    const { data, error } = await supabase
      .from('aethex_alerts')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Update alert error:', error);
      throw new Error(error.message);
    }
    return data;
  }
  
  async updateApplication(id: string, updates: any): Promise<any> {
    const updateData: any = {};
    if ('status' in updates) {
      updateData.status = updates.status;
    }
    
    const { data, error } = await supabase
      .from('applications')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Update application error:', error);
      throw new Error(error.message);
    }
    return data;
  }
  
  async getMetrics(): Promise<{
    totalProfiles: number;
    totalProjects: number;
    onlineUsers: number;
    verifiedUsers: number;
    totalXP: number;
    avgLevel: number;
  }> {
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
