import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Only log in development
if (import.meta.env.DEV) {
  console.log('[Supabase] URL env var:', supabaseUrl ? '✓ Present' : '✗ Missing');
  console.log('[Supabase] Key env var:', supabaseAnonKey ? '✓ Present' : '✗ Missing');
}

if (!supabaseUrl || !supabaseAnonKey) {
  if (import.meta.env.DEV) {
    console.warn('Supabase credentials not found. Using fallback credentials.');
  }
}

export const supabase = createClient(
  supabaseUrl || 'https://kmdeisowhtsalsekkzqd.supabase.co',
  supabaseAnonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttZGVpc293aHRzYWxzZWtrenFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3Mzc2NTIsImV4cCI6MjA2OTMxMzY1Mn0.2mvk-rDZnHOzdx6Cgcysh51a3cflOlRWO6OA1Z5YWuQ'
);

// Verify supabase client is properly initialized
if (!supabase || typeof supabase.from !== 'function') {
  console.error('[Supabase] Client initialization failed - supabase.from is not available');
}

// Suppress noisy console errors in production
if (!import.meta.env.DEV) {
  const originalError = console.error;
  console.error = (...args) => {
    const message = args[0]?.toString() || '';
    // Filter out known non-critical errors
    if (message.includes('Reaction XP') || message.includes('tracking error')) {
      return;
    }
    originalError.apply(console, args);
  };
}
