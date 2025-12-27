
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
// ⚠️ Important: Must use Service Key (role: service_role)
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error("❌ Error: Missing Supabase Environment Variables.");
    process.exit(1);
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
