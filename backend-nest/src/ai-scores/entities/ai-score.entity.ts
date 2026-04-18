import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';

@Entity('ai_scores')
export class AiScore {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'uuid', nullable: true })
  claim_id: string;

  @Column({ type: 'float8' })
  score: number;

  @Column({ type: 'text' })
  risk_level: string;

  @CreateDateColumn({ name: 'evaluated_at' })
  evaluated_at: Date;
}
