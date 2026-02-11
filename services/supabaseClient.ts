import { createClient } from '@supabase/supabase-js';

// Supabase Configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://iwlfnnlmutefskkrfbau.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3bGZubmxtdXRlZnNra3JmYmF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5OTEyNTksImV4cCI6MjA4MzU2NzI1OX0.ccV0oxkKXu3fhztL4JSh3rnkykZu0-FItDRiO1RTzls';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
