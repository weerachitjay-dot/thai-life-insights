import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Debug logging for environment variables (only in development)
if (import.meta.env.DEV) {
    console.log('Supabase URL:', supabaseUrl ? '✓ Set' : '✗ Missing');
    console.log('Supabase Key:', supabaseKey ? '✓ Set' : '✗ Missing');
}

// Better error message if env vars are missing
if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Supabase configuration missing!');
    console.error('VITE_SUPABASE_URL:', supabaseUrl || 'NOT SET');
    console.error('VITE_SUPABASE_ANON_KEY:', supabaseKey ? 'SET (hidden)' : 'NOT SET');
    throw new Error(
        'Supabase configuration is missing. Please check environment variables in Vercel dashboard:\n' +
        '- VITE_SUPABASE_URL\n' +
        '- VITE_SUPABASE_ANON_KEY'
    );
}

export const supabase = createClient<Database>(supabaseUrl, supabaseKey);
