import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class ClaimsService {
  constructor(private supabase: SupabaseService) {}

  async getAllClaims() {
    const { data, error } = await this.supabase
      .getClient()
      .from('claims')
      .select(
        `
        id,
        status,
        description,
        contracts (
          client_id,
          type,
          montant_declare
        ),
        ai_scores (
          score,
          risk_level
        )
      `,
      )
      .eq('status', 'non_traite');

    if (error) throw new Error(error.message);
    return data;
  }

  async approveClaim(id: number) {
    const { error } = await this.supabase
      .getClient()
      .from('claims')
      .update({ status: 'approuve' })
      .eq('id', id);

    if (error) throw new Error(error.message);
    return { success: true };
  }

  async rejectClaim(id: number) {
    const { error } = await this.supabase
      .getClient()
      .from('claims')
      .update({ status: 'refuse' })
      .eq('id', id);

    if (error) throw new Error(error.message);
    return { success: true };
  }
}
