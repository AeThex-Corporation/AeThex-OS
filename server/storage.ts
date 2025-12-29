import {
  type Profile,
  type Project,
  type ChatMessage,
  type AethexSite,
  type Application,
  type Achievement,
  type AethexAlert,
} from "../shared/schema.js";
import { supabase } from "./supabase.js";

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
  getSites(): Promise<AethexSite[]>;
  createSite(site: Partial<AethexSite>): Promise<AethexSite>;
  updateSite(id: string, updates: Partial<AethexSite>): Promise<AethexSite>;
  deleteSite(id: string): Promise<boolean>;

  // Auth Logs
  getAuthLogs(): Promise<any[]>;

  // Achievements
  getAchievements(): Promise<Achievement[]>;
  getUserAchievements(userId: string): Promise<any[]>;
  
  // Passports
  getUserPassport(userId: string): Promise<any | undefined>;
  createUserPassport(userId: string): Promise<any>;
  
  // Applications
  getApplications(): Promise<Application[]>;
  updateApplication(id: string, updates: Partial<Application>): Promise<Application>;

  // Alerts
  getAlerts(): Promise<AethexAlert[]>;
  updateAlert(id: string, updates: Partial<AethexAlert>): Promise<AethexAlert>;
  
  // Notifications (for WebSocket)
  getNotifications(): Promise<any[]>;
  
  // Opportunities
  getOpportunities(): Promise<any[]>;
  getOpportunity(id: string): Promise<any | undefined>;
  createOpportunity(data: any): Promise<any>;
  updateOpportunity(id: string, updates: any): Promise<any>;
  deleteOpportunity(id: string): Promise<boolean>;
  
  // Events
  getEvents(): Promise<any[]>;
  getEvent(id: string): Promise<any | undefined>;
  createEvent(data: any): Promise<any>;
  updateEvent(id: string, updates: any): Promise<any>;
  deleteEvent(id: string): Promise<boolean>;
  
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

  // Funnel tracking
  logFunnelEvent(event: { user_id?: string; event_type: string; source?: string; payload?: any; created_at?: string }): Promise<void>;
}

export class SupabaseStorage implements IStorage {
  private filterDefined<T extends Record<string, any>>(updates: Partial<T>): Partial<T> {
    return Object.fromEntries(
      Object.entries(updates).filter(([, value]) => value !== undefined)
    ) as Partial<T>;
  }

  private ensureUpdates<T extends Record<string, any>>(updates: Partial<T>, entity: string): asserts updates is Partial<T> & Record<string, any> {
    if (Object.keys(updates).length === 0) {
      throw new Error(`No ${entity} fields provided for update`);
    }
  }

  // Create a new site
  async createSite(site: Partial<AethexSite>): Promise<AethexSite> {
    const cleanSite = this.filterDefined<AethexSite>(site);
    const { data, error } = await supabase
      .from('aethex_sites')
      .insert(cleanSite)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as AethexSite;
  }

  // Update a site
  async updateSite(id: string, updates: Partial<AethexSite>): Promise<AethexSite> {
    const cleanUpdates = this.filterDefined<AethexSite>(updates);
    this.ensureUpdates(cleanUpdates, 'site');
    const { data, error } = await supabase
      .from('aethex_sites')
      .update({ ...cleanUpdates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as AethexSite;
  }

  // Delete a site
  async deleteSite(id: string): Promise<boolean> {
    const { error, data } = await supabase
      .from('aethex_sites')
      .delete()
      .eq('id', id)
      .select('id');
    if (error) throw new Error(error.message);
    return (data?.length ?? 0) > 0;
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
    const cleanUpdates = this.filterDefined<Profile>(updates);
    this.ensureUpdates(cleanUpdates, 'profile');
    const { data, error } = await supabase
      .from('profiles')
      .update({ ...cleanUpdates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error || !data) return undefined;
    return data as Profile;
  }

  async getLeadershipProfiles(): Promise<Profile[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .in('role', ['admin', 'architect', 'oversee'])
      .order('total_xp', { ascending: false });
    
    if (error) return [];
    return data as Profile[];
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
  
  async getSites(): Promise<AethexSite[]> {
    const { data, error } = await supabase
      .from('aethex_sites')
      .select('*')
      .order('last_check', { ascending: false });

    if (error || !data) return [];
    return data as AethexSite[];
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
  
  async getAchievements(): Promise<Achievement[]> {
    const { data, error } = await supabase
      .from('achievements')
      .select('*')
      .order('name', { ascending: true });

    if (error || !data) return [];
    return data as Achievement[];
  }

  async getUserAchievements(userId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('user_achievements')
      .select(`
        *,
        achievement:achievements(*)
      `)
      .eq('user_id', userId)
      .order('earned_at', { ascending: false });
    
    if (error) {
      console.error('Get user achievements error:', error);
      return [];
    }
    return data || [];
  }

  async getUserPassport(userId: string): Promise<any | undefined> {
    const { data, error } = await supabase
      .from('aethex_passports')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return undefined; // No rows returned
      console.error('Get user passport error:', error);
      return undefined;
    }
    return data;
  }

  async createUserPassport(userId: string): Promise<any> {
    const { data, error } = await supabase
      .from('aethex_passports')
      .insert({ user_id: userId })
      .select()
      .single();
    
    if (error) {
      console.error('Create user passport error:', error);
      throw new Error(error.message);
    }
    return data;
  }
  
  async getApplications(): Promise<Application[]> {
    const { data, error } = await supabase
      .from('applications')
      .select('*')
      .order('submitted_at', { ascending: false });

    if (error || !data) return [];
    return data as Application[];
  }

  async getAlerts(): Promise<AethexAlert[]> {
    const { data, error } = await supabase
      .from('aethex_alerts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error || !data) return [];
    return data as AethexAlert[];
  }
  
  async updateAlert(id: string, updates: Partial<AethexAlert>): Promise<AethexAlert> {
    const updateData = this.filterDefined<AethexAlert>({
      message: updates.message,
      severity: updates.severity,
      is_resolved: updates.is_resolved,
      resolved_at: updates.resolved_at,
    });
    this.ensureUpdates(updateData, 'alert');

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
    return data as AethexAlert;
  }

  async updateApplication(id: string, updates: Partial<Application>): Promise<Application> {
    const updateData = this.filterDefined<Application>({
      status: updates.status,
      response_message: updates.response_message,
    });
    this.ensureUpdates(updateData, 'application');

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
    return data as Application;
  }
  
  // Chat Messages (AI memory)
  async getChatHistory(userId: string, limit: number = 50): Promise<ChatMessage[]> {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) return [];
    return (data || []).reverse() as ChatMessage[]; // Reverse to get chronological order
  }
  
  async saveChatMessage(id: string, userId: string, role: string, content: string): Promise<void> {
    const { error } = await supabase
      .from('chat_messages')
      .insert({
        id,
        user_id: userId,
        role,
        content,
      });
    
    if (error) {
      console.error('Save chat message error:', error);
      throw new Error('Failed to save chat message');
    }
  }
  
  async clearChatHistory(userId: string): Promise<void> {
    const { error } = await supabase
      .from('chat_messages')
      .delete()
      .eq('user_id', userId);
    
    if (error) {
      console.error('Clear chat history error:', error);
      throw new Error('Failed to clear chat history');
    }
  }
  
  async getNotifications(): Promise<any[]> {
    // Get recent activity - applications, alerts, etc.
    const [applications, alerts] = await Promise.all([
      this.getApplications(),
      this.getAlerts()
    ]);
    
    // Transform into notification format
    const notifications = [
      ...applications.slice(0, 5).map(app => ({
        id: app.id,
        type: 'application',
        message: `New application from ${app.full_name}`,
        timestamp: app.submitted_at,
        unread: true
      })),
      ...alerts.filter(a => !a.is_resolved).slice(0, 5).map(alert => ({
        id: alert.id,
        type: 'alert',
        message: alert.message,
        severity: alert.severity,
        timestamp: alert.created_at,
        unread: true
      }))
    ];
    
    // Sort by timestamp desc
    return notifications.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  async logFunnelEvent(event: { user_id?: string; event_type: string; source?: string; payload?: any; created_at?: string }): Promise<void> {
    const { error } = await supabase
      .from('funnel_events')
      .insert({
        user_id: event.user_id || null,
        event_type: event.event_type,
        source: event.source || null,
        payload: event.payload || null,
        created_at: event.created_at || new Date().toISOString(),
      });
    if (error) {
      console.error('Log funnel event error:', error);
    }
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

  // ========== OPPORTUNITIES METHODS ==========
  
  async getOpportunities(): Promise<any[]> {
    const { data, error } = await supabase
      .from('aethex_opportunities')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) return [];
    return data || [];
  }

  async getOpportunity(id: string): Promise<any | undefined> {
    const { data, error } = await supabase
      .from('aethex_opportunities')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) return undefined;
    return data;
  }

  async createOpportunity(opportunityData: any): Promise<any> {
    const { data, error } = await supabase
      .from('aethex_opportunities')
      .insert(opportunityData)
      .select()
      .single();
    
    if (error) throw new Error(error.message);
    return data;
  }

  async updateOpportunity(id: string, updates: any): Promise<any> {
    const { data, error } = await supabase
      .from('aethex_opportunities')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw new Error(error.message);
    return data;
  }

  async deleteOpportunity(id: string): Promise<boolean> {
    const { error, count } = await supabase
      .from('aethex_opportunities')
      .delete({ count: 'exact' })
      .eq('id', id);
    
    if (error) throw new Error(error.message);
    return (count ?? 0) > 0;
  }

  // ========== EVENTS METHODS ==========
  
  async getEvents(): Promise<any[]> {
    const { data, error } = await supabase
      .from('aethex_events')
      .select('*')
      .order('date', { ascending: true });
    
    if (error) return [];
    return data || [];
  }

  async getEvent(id: string): Promise<any | undefined> {
    const { data, error } = await supabase
      .from('aethex_events')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) return undefined;
    return data;
  }

  async createEvent(eventData: any): Promise<any> {
    const { data, error } = await supabase
      .from('aethex_events')
      .insert(eventData)
      .select()
      .single();
    
    if (error) throw new Error(error.message);
    return data;
  }

  async updateEvent(id: string, updates: any): Promise<any> {
    const { data, error } = await supabase
      .from('aethex_events')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw new Error(error.message);
    return data;
  }

  async deleteEvent(id: string): Promise<boolean> {
    const { error, count } = await supabase
      .from('aethex_events')
      .delete({ count: 'exact' })
      .eq('id', id);
    
    if (error) throw new Error(error.message);
    return (count ?? 0) > 0;
  }
}

export const storage = new SupabaseStorage();

// Export helper functions for WebSocket
export const getAlerts = () => storage.getAlerts();
export const getNotifications = () => storage.getNotifications();
