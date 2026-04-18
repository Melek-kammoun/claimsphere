import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('claims')
export class Claim {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text', nullable: true })
  extracted_text: string;

  @Column({ type: 'jsonb', nullable: true })
  parsed_data: Record<string, any>;

  @Column({ type: 'text' })
  file_name: string;

  @Column({ type: 'text', nullable: true })
  claimant_name: string;

  @Column({ type: 'text', nullable: true })
  claim_number: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  claim_amount: number;

  @Column({ type: 'text', nullable: true })
  claim_type: string;

  @Column({ type: 'text', default: 'processed' })
  status: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}