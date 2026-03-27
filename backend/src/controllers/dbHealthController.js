import { supabase } from "../db/supabaseClient.js";

export async function dbHealthController(req, res, next) {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("id")
      .limit(1);

    if (error) {
      return res.status(500).json({
        status: "error",
        message: "Base de donnees non accessible",
        details: error.message,
      });
    }

    return res.status(200).json({
      status: "ok",
      message: "Connexion DB OK",
      sample: data?.[0] ?? null,
    });
  } catch (err) {
    next(err);
  }
}
