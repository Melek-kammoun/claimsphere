import dotenv from "dotenv";
dotenv.config({ quiet: true });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const openaiApiKey = process.env.OPENAI_API_KEY;

const requiredEnv = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "OPENAI_API_KEY"];
for (const name of requiredEnv) {
  if (name === "SUPABASE_URL" && !supabaseUrl) {
    throw new Error("Missing required environment variable: SUPABASE_URL");
  }
  if (name === "SUPABASE_SERVICE_ROLE_KEY" && !supabaseServiceRoleKey) {
    throw new Error("Missing required environment variable: SUPABASE_SERVICE_ROLE_KEY");
  }
  if (name === "OPENAI_API_KEY" && !openaiApiKey) {
    throw new Error("Missing required environment variable: OPENAI_API_KEY");
  }
}

export const config = {
  port: Number(process.env.PORT || 4000),
  supabaseUrl,
  supabaseServiceRoleKey,
  openaiApiKey,
};
