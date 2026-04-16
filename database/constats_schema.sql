-- Migration NON destructive adaptee au schema existant:
-- constats(id, reference, claim_id, statut, date_accident, lieu_accident, description_accident, qr_token, qr_expires_at, created_at, updated_at)
-- constat_parties(..., constat_id, role, user_id, ...)

-- 1) Etendre constats avec les colonnes utiles au flux QR en 4 phases
ALTER TABLE constats
  ADD COLUMN IF NOT EXISTS metadata JSONB,
  ADD COLUMN IF NOT EXISTS pdf_url TEXT,
  ADD COLUMN IF NOT EXISTS pdf_signed_url TEXT,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS validated_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS action_logs JSONB DEFAULT '[]'::jsonb;

-- 2) Harmoniser le statut pour supporter le workflow
ALTER TABLE constats
  DROP CONSTRAINT IF EXISTS constats_statut_check;

ALTER TABLE constats
  ADD CONSTRAINT constats_statut_check
  CHECK (statut IN ('en_attente', 'complet', 'valide', 'rejete'));

-- 3) Valeurs par defaut coherentes
ALTER TABLE constats
  ALTER COLUMN statut SET DEFAULT 'en_attente';

ALTER TABLE constats
  ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE constats
  ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP;

-- 4) Indexes utiles (idempotent)
CREATE INDEX IF NOT EXISTS idx_constats_claim_id ON constats(claim_id);
CREATE INDEX IF NOT EXISTS idx_constats_statut ON constats(statut);
CREATE INDEX IF NOT EXISTS idx_constats_created_at ON constats(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_constats_qr_expires_at ON constats(qr_expires_at);
CREATE INDEX IF NOT EXISTS idx_constat_parties_constat_id ON constat_parties(constat_id);
CREATE INDEX IF NOT EXISTS idx_constat_parties_user_id ON constat_parties(user_id);
CREATE INDEX IF NOT EXISTS idx_constat_parties_role ON constat_parties(role);

-- 5) Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_constats_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS constats_update_timestamp ON constats;

CREATE TRIGGER constats_update_timestamp
BEFORE UPDATE ON constats
FOR EACH ROW
EXECUTE FUNCTION update_constats_updated_at();

-- 6) Permissions
GRANT SELECT, INSERT, UPDATE ON constats TO authenticated;
GRANT SELECT, INSERT, UPDATE ON constat_parties TO authenticated;
GRANT SELECT ON constats TO anon;

-- 7) RLS basee sur constat_parties (schema reel)
ALTER TABLE constats ENABLE ROW LEVEL SECURITY;
ALTER TABLE constat_parties ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can see their own constats" ON constats;
DROP POLICY IF EXISTS "Users can create constats" ON constats;
DROP POLICY IF EXISTS "Users can update their own constats" ON constats;
DROP POLICY IF EXISTS "Public can scan QR codes" ON constats;

DROP POLICY IF EXISTS "Users can see own parties" ON constat_parties;
DROP POLICY IF EXISTS "Users can insert own parties" ON constat_parties;
DROP POLICY IF EXISTS "Users can update own parties" ON constat_parties;

CREATE POLICY "Users can see their own constats" ON constats
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM constat_parties cp
      WHERE cp.constat_id = constats.id
        AND cp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create constats" ON constats
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own constats" ON constats
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM constat_parties cp
      WHERE cp.constat_id = constats.id
        AND cp.user_id = auth.uid()
    )
  );

-- Important:
-- Cette policy expose les constats anon pour permettre /scan/:token.
-- En production, preferer une RPC/edge function SECURISER pour filtrer strictement par token.
CREATE POLICY "Public can scan QR codes" ON constats
  FOR SELECT
  USING (
    qr_token IS NOT NULL
    AND qr_expires_at IS NOT NULL
    AND qr_expires_at > now()
  );

CREATE POLICY "Users can see own parties" ON constat_parties
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own parties" ON constat_parties
  FOR INSERT
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Users can update own parties" ON constat_parties
  FOR UPDATE
  USING (user_id = auth.uid());

-- 8) Documentation
COMMENT ON TABLE constats IS 'Constats d''accident relies a claims et details parties dans constat_parties';
COMMENT ON COLUMN constats.qr_token IS 'Token unique QR pour partage du constat';
COMMENT ON COLUMN constats.qr_expires_at IS 'Expiration du token QR (ex: now + 30 min)';
COMMENT ON COLUMN constats.action_logs IS 'Historique JSON des actions importantes';
