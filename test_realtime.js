import { createClient } from '@supabase/supabase-js';
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'missing';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'missing';
console.log('URL:', supabaseUrl, 'KEY:', supabaseKey.substring(0,10));
