import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('users')
export class User {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ default: 'client' })
  role: string;

  @CreateDateColumn()
  created_at: Date;

  @Column({ nullable: true, type: 'int2' })
  contract_number: number;

  @Column({ nullable: true })
  full_name: string;

  @Column({ nullable: true })
  phone: string;
}