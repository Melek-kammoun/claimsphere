import { ConstatStatus } from '../entities/constat.entity';

export class ConstatResponseDto {
  id!: string;
  reference!: string | null;
  claim_id!: string | null;
  qr_token!: string;
  statut!: ConstatStatus;
  date_accident!: Date | null;
  lieu_accident!: string | null;
  description_accident!: string | null;
  metadata!: any | null;
  parties!: any[] | null;
  created_at!: Date;
  updated_at!: Date;
  qr_expires_at!: Date;
  completed_at!: Date | null;
  validated_at!: Date | null;
  pdf_url!: string | null;
}
