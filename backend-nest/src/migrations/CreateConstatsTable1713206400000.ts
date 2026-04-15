import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateConstatsTable1713206400000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      -- Create ENUM type for constat status
      CREATE TYPE "constat_status" AS ENUM ('en_attente', 'complet', 'valide', 'rejete');
    `);

    await queryRunner.query(`
      -- Create constats table
      CREATE TABLE "constats" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        
        -- User A (Creator)
        "user_a_id" uuid NOT NULL,
        "user_a_data" jsonb,
        "vehicle_a_data" jsonb,
        "insurance_a_data" jsonb,
        "photos_a" text[],
        "signature_a" text,
        "user_a_signed_at" timestamp,
        
        -- User B (Respondent)
        "user_b_id" uuid,
        "user_b_data" jsonb,
        "vehicle_b_data" jsonb,
        "insurance_b_data" jsonb,
        "photos_b" text[],
        "signature_b" text,
        "user_b_signed_at" timestamp,
        
        -- Accident details
        "accident_details" jsonb NOT NULL,
        
        -- QR Code management
        "qr_token" varchar(36) UNIQUE NOT NULL,
        "qr_expires_at" timestamp NOT NULL,
        
        -- Status
        "status" "constat_status" DEFAULT 'en_attente',
        
        -- Metadata
        "metadata" jsonb,
        
        -- PDF
        "pdf_url" text,
        "pdf_signed_url" text,
        
        -- Timestamps
        "created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
        "updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
        "completed_at" timestamp,
        "validated_at" timestamp,
        
        -- Action logs
        "action_logs" jsonb DEFAULT '[]'::jsonb,
        
        -- Constraints
        CONSTRAINT "check_users_different" CHECK ("user_a_id" IS DISTINCT FROM "user_b_id"),
        CONSTRAINT "check_status_valid" CHECK ("status" IN ('en_attente', 'complet', 'valide', 'rejete'))
      );
    `);

    // Create indexes
    await queryRunner.query(
      `CREATE INDEX "idx_constats_user_a_id" ON "constats" ("user_a_id")`
    );
    await queryRunner.query(
      `CREATE INDEX "idx_constats_user_b_id" ON "constats" ("user_b_id")`
    );
    await queryRunner.query(
      `CREATE INDEX "idx_constats_qr_token" ON "constats" ("qr_token")`
    );
    await queryRunner.query(
      `CREATE INDEX "idx_constats_status" ON "constats" ("status")`
    );
    await queryRunner.query(
      `CREATE INDEX "idx_constats_created_at" ON "constats" ("created_at" DESC)`
    );
    await queryRunner.query(
      `CREATE INDEX "idx_constats_qr_expires_at" ON "constats" ("qr_expires_at")`
    );

    // Create trigger for updated_at
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION update_constats_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW."updated_at" = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    await queryRunner.query(`
      CREATE TRIGGER constats_update_timestamp
      BEFORE UPDATE ON "constats"
      FOR EACH ROW
      EXECUTE FUNCTION update_constats_updated_at();
    `);

    // Add comments
    await queryRunner.query(
      `COMMENT ON TABLE "constats" IS 'Stores accident reports (constats) between two parties with QR code linking'`
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "constats"."qr_token" IS 'Unique token for QR code generation and scanning'`
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "constats"."qr_expires_at" IS 'Expiration time for QR code (typically 30 minutes)'`
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "constats"."action_logs" IS 'JSON array of all actions taken on this constat'`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop trigger
    await queryRunner.query(`DROP TRIGGER IF EXISTS constats_update_timestamp ON "constats"`);
    await queryRunner.query(`DROP FUNCTION IF EXISTS update_constats_updated_at`);

    // Drop table
    await queryRunner.query(`DROP TABLE IF EXISTS "constats"`);

    // Drop enum
    await queryRunner.query(`DROP TYPE IF EXISTS "constat_status"`);
  }
}
