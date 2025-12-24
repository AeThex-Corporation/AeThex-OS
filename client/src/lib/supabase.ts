import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('[Supabase] URL env var:', supabaseUrl ? '✓ Present' : '✗ Missing');
console.log('[Supabase] Key env var:', supabaseAnonKey ? '✓ Present' : '✗ Missing');

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not found. Auth features may not work.');
  console.warn('[Supabase] VITE_SUPABASE_URL:', supabaseUrl);
  console.warn('[Supabase] VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? supabaseAnonKey.substring(0, 20) + '...' : undefined);
}

export const supabase = createClient(
  supabaseUrl || 'https://kmdeisowhtsalsekkzqd.supabase.co',
  supabaseAnonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttZGVpc293aHRzYWxzZWtrenFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3Mzc2NTIsImV4cCI6MjA2OTMxMzY1Mn0.2mvk-rDZnHOzdx6Cgcysh51a3cflOlRWO6OA1Z5YWuQ'
);
