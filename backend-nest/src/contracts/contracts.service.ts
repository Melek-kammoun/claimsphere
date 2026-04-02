import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateContractDto } from './dto/create-contract.dto';
import { UpdateContractDto } from './dto/update-contract.dto';

@Injectable()
export class ContractsService {
  constructor(private supabaseService: SupabaseService) {}

  async findAll(): Promise<any[]> {
    const { data, error } = await this.supabaseService.getClient()
      .from('contracts')
      .select('*') as { data: any[]; error: any };
    if (error) throw error;
    return data ?? [];
  }

  async findOne(id: number): Promise<any> {
    const { data, error } = await this.supabaseService.getClient()
      .from('contracts')
      .select('*')
      .eq('id', id)
      .single() as { data: any; error: any };
    if (error) throw error;
    return data;
  }

  async findByUser(userId: string): Promise<any[]> {
    const { data, error } = await this.supabaseService.getClient()
      .from('contracts')
      .select('*')
      .eq('client_id', userId) as { data: any[]; error: any };
    if (error) throw error;
    return data ?? [];
  }

  async create(createContractDto: CreateContractDto): Promise<any> {
    const { data, error } = await this.supabaseService.getClient()
      .from('contracts')
      .insert([createContractDto])
      .select()
      .single() as { data: any; error: any };
    if (error) throw error;
    return data;
  }

  async update(id: number, updateContractDto: UpdateContractDto): Promise<any> {
    const { data, error } = await this.supabaseService.getClient()
      .from('contracts')
      .update(updateContractDto)
      .eq('id', id)
      .select()
      .single() as { data: any; error: any };
    if (error) throw error;
    return data;
  }

  async remove(id: number): Promise<{ message: string }> {
    const { error } = await this.supabaseService.getClient()
      .from('contracts')
      .delete()
      .eq('id', id) as { data: any; error: any };
    if (error) throw error;
    return { message: 'Contract deleted successfully' };
  }
}