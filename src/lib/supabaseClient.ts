import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Supabase URL or Anon Key is missing. Check your environment variables.");
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');

// Only use this in Server Components or API Routes
export const supabaseAdmin = createClient(
  supabaseUrl || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey || ''
);
