import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || localStorage.getItem('supabase_url');
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || localStorage.getItem('supabase_anon_key');

// Note: In production, these should be in .env file (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
// For now, we fallback to localStorage for dynamic setup

export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

// Helper to set config dynamically
export const setSupabaseConfig = (url, key) => {
  localStorage.setItem('supabase_url', url);
  localStorage.setItem('supabase_anon_key', key);
  window.location.reload();
}
