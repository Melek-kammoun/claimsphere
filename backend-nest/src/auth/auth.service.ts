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

  /**
   * Sign up a new user
   */
  async signup(
    email: string,
    password: string,
    full_name?: string,
    phone?: string,
  ) {
    try {
      this.logger.log(`🔍 Signing up user: ${email}`);

      const supabase = this.supabaseService.getClient();

      // Create user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        this.logger.error(`❌ Supabase signup error: ${authError.message}`);
        throw new BadRequestException(authError.message);
      }

      const userId = authData.user.id;
      this.logger.log(`✅ Supabase user created: ${userId}`);

      // Create user profile in database
      const user = await this.usersService.create({
        id: userId,
        email,
        full_name: full_name || undefined,
        phone: phone || undefined,
        role: 'client',
      });

      this.logger.log(`✅ User profile created: ${user.id}`);

      return {
        user,
        access_token: authData.session?.access_token,
      };
    } catch (error) {
      this.logger.error(`❌ Signup error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Login user
   */
  async login(email: string, password: string) {
    try {
      this.logger.log(`🔍 Logging in user: ${email}`);

      const supabase = this.supabaseService.getClient();

      // Authenticate with Supabase
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        this.logger.error(`❌ Login failed: ${authError.message}`);
        throw new BadRequestException('Invalid email or password');
      }

      const userId = authData.user.id;
      this.logger.log(`✅ Supabase login successful: ${userId}`);

      // Check if user exists in database
      let user = await this.usersService.findOne(userId);

      if (!user) {
        this.logger.log(`⚠️ User not in database, creating profile for: ${userId}`);
        // Create user profile if it doesn't exist
        user = await this.usersService.create({
          id: userId,
          email,
          full_name: authData.user.user_metadata?.full_name || undefined,
          phone: authData.user.user_metadata?.phone || undefined,
          role: 'client',
        });
        this.logger.log(`✅ User profile created: ${userId}`);
      } else {
        // Update user profile with any metadata from Supabase
        if (authData.user.user_metadata) {
          this.logger.log(`🔄 Updating user metadata: ${userId}`);
          user = await this.usersService.update(userId, {
            full_name: authData.user.user_metadata.full_name || user.full_name,
            phone: authData.user.user_metadata.phone || user.phone,
          } as any);
        }
      }

      this.logger.log(`✅ User authenticated: ${email}`);

      return {
        user,
        access_token: authData.session?.access_token,
      };
    } catch (error) {
      this.logger.error(`❌ Login error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get current authenticated user
   */
  async getMe(userId: string) {
    this.logger.log(`🔍 Getting user: ${userId}`);
    const user = await this.usersService.findOne(userId);

    if (!user) {
      this.logger.error(`❌ User not found: ${userId}`);
      throw new BadRequestException('User not found');
    }

    this.logger.log(`✅ User found: ${userId}`);
    return user;
  }
}