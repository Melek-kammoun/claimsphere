import { supabase } from "../db/supabaseClient.js";

// GET /claims
// GET /claims
export async function getAllClaims(req, res) {
  
  // OU plus simple, utilise une requête manuelle :
  const { data, error } = await supabase
    .from("claims")
    .select(`
      id,
      status,
      description,
      contract_id,
      contracts!claims_contract_id_fkey (
        client_id,
        type,
        montant_declare
      ),
      ai_scores!ai_scores_claim_id_fkey (
        score,
        risk_level
      )
    `);

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
}

// POST /claims/:id/approve
export async function approveClaim(req, res) {
  const { id } = req.params;
  const { error } = await supabase.from("claims").update({ status: "Approuvé" }).eq("id", id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
}

// POST /claims/:id/reject
export async function rejectClaim(req, res) {
  const { id } = req.params;
  const { error } = await supabase.from("claims").update({ status: "Refusé" }).eq("id", id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
}

// GET /claims/:id
export async function getClaimDetails(req, res) {
  const { id } = req.params;
  const { data, error } = await supabase.from("claims").select("*").eq("id", id).single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
}
