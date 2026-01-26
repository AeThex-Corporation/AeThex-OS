import { supabase } from './supabase';
import { isDesktop, isMobile, platformConfig } from './platform';

/**
 * Data service that routes queries to Supabase (desktop/mobile) or API server (web)
 */

// Helper to fetch from API or Supabase
async function fetchData<T>(
  apiEndpoint: string,
  supabaseQuery: () => Promise<{ data: T | null; error: any }>
): Promise<T> {
  // For desktop and mobile, use Supabase directly
  if (isDesktop() || isMobile()) {
    const { data, error } = await supabaseQuery();
    if (error) throw new Error(error.message);
    return data as T;
  }

  // For web, use API server
  const res = await fetch(`${platformConfig.apiBaseUrl}${apiEndpoint}`, {
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to fetch data');
  return res.json();
}

// Profile queries
export async function fetchUserProfile(userId: string) {
  return fetchData(
    `/api/me/profile`,
    async () => {
      return await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
    }
  );
}

export async function fetchAllProfiles() {
  return fetchData(
    `/api/os/architects`,
    async () => {
      return await supabase
        .from('profiles')
        .select('*')
        .order('total_xp', { ascending: false });
    }
  );
}

// Project queries
export async function fetchProjects() {
  return fetchData(
    `/api/os/projects`,
    async () => {
      return await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });
    }
  );
}

// Achievements queries
export async function fetchUserAchievements(userId: string) {
  return fetchData(
    `/api/me/achievements`,
    async () => {
      return await supabase
        .from('user_achievements')
        .select('*, achievement:achievements(*)')
        .eq('user_id', userId);
    }
  );
}

export async function fetchAllAchievements() {
  return fetchData(
    `/api/achievements`,
    async () => {
      return await supabase
        .from('achievements')
        .select('*')
        .order('rarity', { ascending: true });
    }
  );
}

// Metrics queries
export async function fetchMetrics() {
  return fetchData(
    `/api/metrics`,
    async () => {
      // Generate mock metrics from Supabase data
      const { data: profiles } = await supabase.from('profiles').select('*');
      const { data: projects } = await supabase.from('projects').select('*');
      
      return {
        data: {
          totalUsers: profiles?.length || 0,
          activeProjects: projects?.filter(p => p.status === 'active').length || 0,
          totalProjects: projects?.length || 0,
          communityXP: profiles?.reduce((sum, p) => sum + (p.total_xp || 0), 0) || 0,
        },
        error: null,
      };
    }
  );
}

// Notifications queries
export async function fetchNotifications(userId: string) {
  return fetchData(
    `/api/os/notifications`,
    async () => {
      return await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);
    }
  );
}

// Activity tracking
export async function trackEvent(event: string, metadata?: Record<string, any>) {
  // For desktop/mobile, could log to Supabase or skip
  if (isDesktop() || isMobile()) {
    console.log('[Track Event]', event, metadata);
    return;
  }

  // For web, use API
  await fetch(`${platformConfig.apiBaseUrl}/api/track/event`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ event, metadata }),
  });
}

// Leaderboard
export async function fetchLeaderboard() {
  return fetchData(
    `/api/directory/architects`,
    async () => {
      return await supabase
        .from('profiles')
        .select('id, username, avatar_url, total_xp, level')
        .order('total_xp', { ascending: false })
        .limit(10);
    }
  );
}

// Activities/Events
export async function fetchActivities(limit = 20) {
  return fetchData(
    `/api/track/events?limit=${limit}`,
    async () => {
      // Return empty array for now - could implement activity tracking in Supabase
      return { data: [], error: null };
    }
  );
}

// Opportunities (placeholder - returns mock data)
export async function fetchOpportunities() {
  return fetchData(
    `/api/opportunities`,
    async () => {
      return { data: [], error: null };
    }
  );
}

// Events (placeholder - returns mock data)
export async function fetchEvents() {
  return fetchData(
    `/api/events`,
    async () => {
      return { data: [], error: null };
    }
  );
}
