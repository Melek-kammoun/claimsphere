import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('devis')
export class Devis {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text', nullable: true })
  reference: string;

  @Column({ type: 'date', nullable: true })
  devis_date: Date;

  @Column({ type: 'text', nullable: true })
  garage_name: string;

  @Column({ type: 'text', nullable: true })
  garage_address: string;

  @Column({ type: 'text', nullable: true })
  garage_fiscal_id: string;

  @Column({ type: 'text', nullable: true })
  vehicle_make: string;

  @Column({ type: 'text', nullable: true })
  vehicle_model: string;

  @Column({ type: 'text', nullable: true })
  vehicle_registration: string;

  @Column({ type: 'text', nullable: true })
  owner_name: string;

  @Column({ type: 'text', nullable: true })
  items_list: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  labor_hours: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  labor_rate_per_hour: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  subtotal_ht: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  tva_19: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  total_ttc: number;

  @Column({ type: 'integer', nullable: true })
  validity_days: number;

  @Column({ type: 'text', nullable: true })
  garage_signature: string;

  @Column({ type: 'text' })
  file_name: string;

  @Column({ type: 'text', nullable: true })
  extracted_text: string;

  @Column({ type: 'jsonb', nullable: true })
  parsed_data: Record<string, any>;

  @Column({ type: 'uuid', nullable: true })
  claim_id: string | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}