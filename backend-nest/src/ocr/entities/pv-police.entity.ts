import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('pv_police')
export class PvPolice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text', nullable: true })
  pv_number: string;

  @Column({ type: 'date' })
  accident_date: Date;

  @Column({ type: 'time', nullable: true })
  accident_time: string;

  @Column({ type: 'text', nullable: true })
  accident_location: string;

  @Column({ type: 'text', nullable: true })
  driver_a_name: string;

  @Column({ type: 'text', nullable: true })
  driver_a_cin: string;

  @Column({ type: 'text', nullable: true })
  driver_a_permit: string;

  @Column({ type: 'text', nullable: true })
  driver_b_name: string;

  @Column({ type: 'text', nullable: true })
  driver_b_cin: string;

  @Column({ type: 'text', nullable: true })
  driver_b_permit: string;

  @Column({ type: 'text', nullable: true })
  vehicle_a_registration: string;

  @Column({ type: 'text', nullable: true })
  vehicle_b_registration: string;

  @Column({ type: 'text', nullable: true })
  circumstances: string;

  @Column({ type: 'text', nullable: true })
  responsibility: string; // 'A', 'B', or 'Shared'

  @Column({ type: 'text', nullable: true })
  injured_persons: string;

  @Column({ type: 'text', nullable: true })
  witnesses: string;

  @Column({ type: 'text', nullable: true })
  officer_name: string;

  @Column({ type: 'text', nullable: true })
  officer_badge: string;

  @Column({ type: 'text', nullable: true })
  police_station: string;

  @Column({ type: 'text' })
  file_name: string;

  @Column({ type: 'text', nullable: true })
  extracted_text: string;

  @Column({ type: 'jsonb', nullable: true })
  parsed_data: Record<string, any>;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}