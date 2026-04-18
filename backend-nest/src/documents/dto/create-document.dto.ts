import { ClaimDocumentType } from '../entities/document.entity';

export class CreateDocumentDto {
  claim_id?: string | null;
  constat_id?: string | null;
  document_type!: ClaimDocumentType;
  original_name!: string;
  mime_type?: string | null;
  file_size?: number | null;
  storage_bucket?: string | null;
  storage_path?: string | null;
  public_url?: string | null;
  source_table?: string | null;
  source_id?: string | null;
  extracted_data?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
}
