import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export type ClaimDocumentType =
  | 'pv_police'
  | 'accident_image'
  | 'rapport_expert'
  | 'devis'
  | 'other';

@Entity('documents')
export class Document {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true })
  claim_id: string | null;

  @Column({ type: 'uuid', nullable: true })
  constat_id: string | null;

  @Column({ type: 'text' })
  document_type: ClaimDocumentType;

  @Column({ type: 'text' })
  original_name: string;

  @Column({ type: 'text', nullable: true })
  mime_type: string | null;

  @Column({ type: 'integer', nullable: true })
  file_size: number | null;

  @Column({ type: 'text', nullable: true })
  storage_bucket: string | null;

  @Column({ type: 'text', nullable: true })
  storage_path: string | null;

  @Column({ type: 'text', nullable: true })
  public_url: string | null;

  @Column({ type: 'text', nullable: true })
  source_table: string | null;

  @Column({ type: 'uuid', nullable: true })
  source_id: string | null;

  @Column({ type: 'jsonb', nullable: true })
  extracted_data: Record<string, unknown> | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
