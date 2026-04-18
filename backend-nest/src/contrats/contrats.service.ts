import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateContratDto } from './contrats.dto';

@Injectable()
export class ContratsService {
  constructor(private readonly supabase: SupabaseService) {}

  private buildContractNumber(): string {
    const year = new Date().getFullYear();
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    return `CS-${year}-${randomDigits}`;
  }

  private buildContractReference(): string {
    const timestamp = Date.now().toString().slice(-6);
    const randomDigits = Math.floor(100 + Math.random() * 900);
    return `REF-${timestamp}-${randomDigits}`;
  }

  async createContrat(createContratDto: CreateContratDto) {
    if (!createContratDto.client_id) {
      throw new BadRequestException('client_id est requis');
    }

    const type = createContratDto.type?.trim() || 'Serenite';

    // FIX: serie is now stored as-is (string). No numeric coercion.
    const payload = {
      ...createContratDto,
      type,
      status: createContratDto.status ?? 'non_traite',
      contract_number:
        createContratDto.contract_number?.trim() || this.buildContractNumber(),
      contract_reference:
        createContratDto.contract_reference?.trim() || this.buildContractReference(),
    };

    const { data, error } = await this.supabase
      .getClient()
      .from('contracts')
      .insert(payload)
      .select('*')
      .single();

    if (error) {
      throw new InternalServerErrorException(error.message);
    }

    return data;
  }

  async getAllContrats(status?: string) {
    let query = this.supabase
      .getClient()
      .from('contracts')
      .select('*')
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      throw new InternalServerErrorException(error.message);
    }

    return data;
  }

  async getPendingContrats() {
    return this.getAllContrats('non_traite');
  }

  async getContratById(id: string | number) {
    const { data, error } = await this.supabase
      .getClient()
      .from('contracts')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException(error.message);
    }

    if (!data) {
      throw new NotFoundException(`Contrat ${id} introuvable`);
    }

    return data;
  }

  async getContratsByClientId(clientId: string) {
    const { data, error } = await this.supabase
      .getClient()
      .from('contracts')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new InternalServerErrorException(error.message);
    }

    return data;
  }

  async updateContratStatus(id: string | number, status: string) {
    if (!status) {
      throw new BadRequestException('status est requis');
    }

    // FIX: validate allowed status values to prevent garbage data
    const allowed = ['non_traite', 'approuve', 'refuse'];
    if (!allowed.includes(status)) {
      throw new BadRequestException(`status invalide. Valeurs autorisees: ${allowed.join(', ')}`);
    }

    const { data, error } = await this.supabase
      .getClient()
      .from('contracts')
      .update({ status })
      .eq('id', id)
      .select('*')
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException(error.message);
    }

    if (!data) {
      throw new NotFoundException(`Contrat ${id} introuvable`);
    }

    return data;
  }
}