import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum ConstatStatus {
  PENDING = 'en_attente',
  COMPLETE = 'complet',
  VALID = 'valide',
  REJECTED = 'rejete',
}

@Entity('constats')
@Index('idx_qr_token', ['qr_token'], { unique: true })
@Index('idx_claim_id', ['claim_id'])
@Index('idx_constats_statut', ['statut'])
export class Constat {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'text', unique: true, nullable: true })
  reference!: string;

  // Link to claims table (optional)
  @Column('uuid', { nullable: true })
  claim_id!: string | null;

  @Column('text', { default: ConstatStatus.PENDING })
  statut!: ConstatStatus;

  @Column('timestamp', { nullable: true })
  date_accident!: Date | null;

  @Column('text', { nullable: true })
  lieu_accident!: string;

  @Column('text', { nullable: true })
  description_accident!: string;

  // QR Code & Expiration
  @Column('varchar', { unique: true })
  qr_token!: string;

  @Column('timestamp')
  qr_expires_at!: Date;

  @Column('jsonb', { nullable: true })
  metadata!: {
    user_agent?: string;
    ip_address?: string;
    device_info?: string;
  };

  // PDF
  @Column({ type: 'text', nullable: true })
  pdf_url!: string | null;

  @Column({ type: 'text', nullable: true })
  pdf_signed_url!: string | null;

  // Timestamps
  @CreateDateColumn({ type: 'timestamp' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at!: Date;

  @Column('timestamp', { nullable: true })
  completed_at!: Date | null;

  @Column('timestamp', { nullable: true })
  validated_at!: Date | null;

  // Logs d'actions
  @Column('jsonb', { default: '[]' })
  action_logs!: Array<{
    action: string;
    user_id: string;
    timestamp: Date;
    details?: any;
  }>;
}
