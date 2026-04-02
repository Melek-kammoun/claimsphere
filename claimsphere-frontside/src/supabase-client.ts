import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://raizxiwxrkgnhnlccvcx.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_89f3vjoo-r8J70JkZVzFpA_UammS2HA';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);