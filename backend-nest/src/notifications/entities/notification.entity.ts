import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'uuid' })
  user_id: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'bool', default: false })
  read: boolean;

  @CreateDateColumn()
  created_at: Date;
}
