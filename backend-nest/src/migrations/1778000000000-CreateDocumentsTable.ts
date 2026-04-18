import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDocumentsTable1778000000000 implements MigrationInterface {
  name = 'CreateDocumentsTable1778000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "documents" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "claim_id" uuid,
        "constat_id" uuid,
        "document_type" text NOT NULL,
        "original_name" text NOT NULL,
        "mime_type" text,
        "file_size" integer,
        "storage_bucket" text,
        "storage_path" text,
        "public_url" text,
        "source_table" text,
        "source_id" uuid,
        "extracted_data" jsonb,
        "metadata" jsonb,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_documents_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_documents_claim_id" ON "documents" ("claim_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_documents_constat_id" ON "documents" ("constat_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_documents_document_type" ON "documents" ("document_type")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_documents_document_type"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_documents_constat_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_documents_claim_id"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "documents"`);
  }
}
