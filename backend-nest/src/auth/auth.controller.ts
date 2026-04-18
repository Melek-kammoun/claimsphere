import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Logger,
  Get,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger('AuthController');

  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  async signup(
    @Body()
    body: {
      email: string;
      password: string;
      full_name?: string;
      phone?: string;
    },
  ) {
    this.logger.log('🔍 POST /auth/signup', { email: body.email });
    const result = await this.authService.signup(
      body.email,
      body.password,
      body.full_name,
      body.phone,
    );
    return { success: true, data: result };
  }

  @Post('login')
  async login(@Body() body: { email: string; password: string }) {
    this.logger.log('🔍 POST /auth/login', { email: body.email });
    const result = await this.authService.login(body.email, body.password);
    return { success: true, data: result };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@Request() req: any) {
    this.logger.log('🔍 GET /auth/me');
    const user = await this.authService.getMe(req.user.id);
    return { success: true, user };
  }
}