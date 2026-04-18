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

  @Column({ default: 'client', type: 'varchar' })
  role: string;

  @CreateDateColumn()
  created_at: Date;

  @Column({ nullable: true, type: 'int2' })
  contract_number: number | null;

  @Column({ nullable: true, type: 'varchar' })
  full_name: string | null;

  @Column({ nullable: true, type: 'varchar' })
  phone: string | null;
}