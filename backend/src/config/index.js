import dotenv from "dotenv";
dotenv.config({ quiet: true });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
// const openaiApiKey = process.env.OPENAI_API_KEY; // pas encore utilisé

if (!supabaseUrl) {
  throw new Error("Missing required environment variable: SUPABASE_URL");
}
if (!supabaseServiceRoleKey) {
  throw new Error("Missing required environment variable: SUPABASE_SERVICE_ROLE_KEY");
}

export const config = {
  port: Number(process.env.PORT || 4000),
  supabaseUrl,
  supabaseServiceRoleKey,
  // openaiApiKey, // décommente quand tu travailles sur l'IA
};