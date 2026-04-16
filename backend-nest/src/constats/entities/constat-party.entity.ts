import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('constat_parties')
@Index('idx_constat_parties_constat_id', ['constat_id'])
@Index('idx_constat_parties_user_id', ['user_id'])
@Index('idx_constat_parties_role', ['role'])
export class ConstatParty {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid', { nullable: true })
  constat_id!: string | null;

  @Column('text')
  role!: string;

  @Column('uuid', { nullable: true })
  user_id!: string | null;

  @Column('text', { nullable: true })
  nom!: string | null;

  @Column('text', { nullable: true })
  prenom!: string | null;

  @Column('text', { nullable: true })
  telephone!: string | null;

  @Column('date', { nullable: true })
  date_naissance!: string | null;

  @Column('text', { nullable: true })
  adresse!: string | null;

  @Column('text', { nullable: true })
  num_permis!: string | null;

  @Column('date', { nullable: true })
  permis_delivre_le!: string | null;

  @Column('text', { nullable: true })
  permis_delivre_par!: string | null;

  @Column('text', { nullable: true })
  num_assurance!: string | null;

  @Column('text', { nullable: true })
  compagnie_assurance!: string | null;

  @Column('date', { nullable: true })
  validite_assurance!: string | null;

  @Column('text', { nullable: true })
  agence_assurance!: string | null;

  @Column('text', { nullable: true })
  immatriculation!: string | null;

  @Column('text', { nullable: true })
  marque!: string | null;

  @Column('text', { nullable: true })
  modele!: string | null;

  @Column('int4', { nullable: true })
  annee!: number | null;

  @Column('jsonb', { nullable: true })
  circonstances!: any;

  @Column('text', { nullable: true })
  degats_description!: string | null;

  @Column('text', { nullable: true })
  degats_zone!: string | null;

  @Column('text', { nullable: true })
  signature!: string | null;

  @Column('jsonb', { nullable: true })
  photos!: string[] | null;

  @Column('timestamp', { nullable: true })
  rempli_le!: Date | null;

  @CreateDateColumn({ type: 'timestamp' })
  created_at!: Date;
}
