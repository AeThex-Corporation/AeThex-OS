import dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: './.env' });

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kmdeisowhtsalsekkzqd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttZGVpc293aHRzYWxzZWtrenFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3Mzc2NTIsImV4cCI6MjA2OTMxMzY1Mn0.2mvk-rDZnHOzdx6Cgcysh51a3cflOlRWO6OA1Z5YWuQ';

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseKey);
