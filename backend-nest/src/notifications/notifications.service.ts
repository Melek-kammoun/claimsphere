import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateNotificationDto } from './dto/create-notification.dto';

@Injectable()
export class NotificationsService {
  constructor(private readonly supabase: SupabaseService) {}

  async create(dto: CreateNotificationDto) {
    const { data, error } = await this.supabase
      .getClient()
      .from('notifications')
      .insert({ user_id: dto.user_id, message: dto.message, read: dto.read ?? false })
      .select('*')
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  async findByUser(userId: string) {
    const { data, error } = await this.supabase
      .getClient()
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data;
  }

  async markRead(id: number) {
    const { data, error } = await this.supabase
      .getClient()
      .from('notifications')
      .update({ read: true })
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw new Error(error.message);
    if (!data) throw new NotFoundException(`Notification ${id} not found`);
    return data;
  }

  async remove(id: number) {
    const { error } = await this.supabase
      .getClient()
      .from('notifications')
      .delete()
      .eq('id', id);
    if (error) throw new Error(error.message);
    return { deleted: true };
  }
}
