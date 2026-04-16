import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Request,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('users')
export class UsersController {
  private readonly logger = new Logger('UsersController');

  constructor(private readonly usersService: UsersService) {}

  @Get()
  async findAll() {
    this.logger.log('🔍 GET /users');
    const users = await this.usersService.findAll();
    return {
      success: true,
      data: users,
    };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@Request() req: { user: { id: string } }) {
    this.logger.log(`🔍 GET /users/me for user ${req.user.id}`);
    const user = await this.usersService.findOne(req.user.id);
    this.logger.log(`✅ User found:`, user);
    return {
      success: true,
      user,
    };
  }

  @Get('agents')
  async findAgents() {
    this.logger.log('🔍 GET /users/agents');
    const agents = await this.usersService.findByRole('agent');
    return {
      success: true,
      data: agents,
    };
  }

  @Get('clients')
  async findClients() {
    this.logger.log('🔍 GET /users/clients');
    const clients = await this.usersService.findByRole('client');
    return {
      success: true,
      data: clients,
    };
  }

  @Post()
  async create(@Body() dto: CreateUserDto) {
    this.logger.log('🔍 POST /users', dto);
    const user = await this.usersService.create(dto);
    return {
      success: true,
      data: user,
    };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    this.logger.log(`🔍 DELETE /users/${id}`);
    const result = await this.usersService.remove(id);
    return {
      success: true,
      data: result,
    };
  }
}