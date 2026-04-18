import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('claims')
export class Claim {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  user_id: string;

  @Column({ nullable: true })  // ← ADD THIS
  contract_id: string;

  @Column({ type: 'text', nullable: true })
  reference: string;

  @Column({ type: 'date', nullable: true })
  date: Date;

  @Column({ type: 'text', nullable: true })
  type: string;

  @Column({ type: 'text', default: 'pending' })
  status: string;

  @Column({ type: 'text', nullable: true })
  vehicle: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  amount: number;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'text', nullable: true })
  location: string;

  @Column({ type: 'jsonb', nullable: true })
  documents: Record<string, any> | null;

  @Column({ type: 'text', nullable: true })
  ai_suggestion: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
