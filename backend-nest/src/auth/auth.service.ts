import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger('AuthService');

  constructor(
    private supabaseService: SupabaseService,
    private usersService: UsersService,
  ) {}

  async signup(email: string, password: string, full_name?: string, phone?: string) {
    const supabase = this.supabaseService.getClient();

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name, phone },
    });

    if (authError) throw new BadRequestException(authError.message);

    const userId = authData.user.id;
    this.logger.log(`Supabase user created: ${userId}`);

    const user = await this.usersService.create({
      id: userId,
      email,
      full_name: full_name ?? undefined,
      phone: phone ?? undefined,
      role: 'client',
    });

    // Sign in to get the session token
    const { data: sessionData } = await supabase.auth.signInWithPassword({ email, password });

    return {
      user,
      access_token: sessionData?.session?.access_token ?? null,
    };
  }

  async login(email: string, password: string) {
    const supabase = this.supabaseService.getClient();

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) throw new BadRequestException('Email ou mot de passe invalide');

    const userId = authData.user.id;

    let user = await this.usersService.findOne(userId);
    if (!user) {
      user = await this.usersService.create({
        id: userId,
        email,
        full_name: authData.user.user_metadata?.full_name ?? undefined,
        phone: authData.user.user_metadata?.phone ?? undefined,
        role: (authData.user.user_metadata?.role as string) ?? 'client',
      });
    }

    this.logger.log(`User authenticated: ${email}`);
    return {
      user,
      access_token: authData.session?.access_token,
    };
  }

  async getMe(userId: string) {
    const user = await this.usersService.findOne(userId);
    if (!user) throw new BadRequestException('User not found');
    return user;
  }
}
