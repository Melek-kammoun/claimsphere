import { createClient } from "@supabase/supabase-js";
import { config } from "../config/index.js";

console.log("SUPABASE_URL:", config.supabaseUrl);
console.log("SUPABASE_KEY:", config.supabaseServiceRoleKey ? "OK" : "MANQUANTE");

export const supabase = createClient(config.supabaseUrl, config.supabaseServiceRoleKey, {
  auth: { persistSession: false },
});