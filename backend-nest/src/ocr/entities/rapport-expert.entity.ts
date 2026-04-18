import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('rapport_expert')
export class RapportExpert {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text', nullable: true })
  reference: string;

  @Column({ type: 'text', nullable: true })
  expert_name: string;

  @Column({ type: 'text', nullable: true })
  expert_agrément: string;

  @Column({ type: 'date', nullable: true })
  expertise_date: Date;

  @Column({ type: 'text', nullable: true })
  vehicle_make: string;

  @Column({ type: 'text', nullable: true })
  vehicle_model: string;

  @Column({ type: 'text', nullable: true })
  vehicle_registration: string;

  @Column({ type: 'text', nullable: true })
  vehicle_vin: string;

  @Column({ type: 'integer', nullable: true })
  vehicle_mileage: number;

  @Column({ type: 'integer', nullable: true })
  vehicle_year: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  vehicle_value_new: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  vehicle_value_market: number;

  @Column({ type: 'text', nullable: true })
  damages_description: string;

  @Column({ type: 'text', nullable: true })
  parts_to_replace: string;

  @Column({ type: 'text', nullable: true })
  parts_to_repair: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  repair_value_estimate: number;

  @Column({ type: 'text', nullable: true })
  conclusion: string; // 'Repairable' or 'Total Loss'

  @Column({ type: 'text', nullable: true })
  expert_signature: string;

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