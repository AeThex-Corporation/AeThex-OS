// Vercel serverless function for /api/auth/login
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { loginSchema } from '../shared/schema.js';
import { supabase } from '../server/supabase.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const result = loginSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: 'Invalid email or password format' });
    return;
  }

  const { email, password } = result.data;
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user) {
    res.status(401).json({ error: error?.message || 'Invalid credentials' });
    return;
  }

  // You may want to set a cookie or return a token here for client auth
  res.status(200).json({ user: data.user });
}
