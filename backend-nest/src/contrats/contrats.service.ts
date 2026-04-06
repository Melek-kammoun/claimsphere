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

  async createContrat(createContratDto: CreateContratDto) {
    if (!createContratDto.client_id) {
      throw new BadRequestException('client_id est requis');
    }

    if (!createContratDto.type) {
      throw new BadRequestException('type est requis');
    }

    const payload = {
      ...createContratDto,
      status: createContratDto.status ?? 'non_traite',
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

  async getContratById(id: number) {
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

  async updateContratStatus(id: number, status: string) {
    if (!status) {
      throw new BadRequestException('status est requis');
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
