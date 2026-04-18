import { Controller, Get, Post, Delete, Patch, Param, Body, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@Req() req: any) {
    const user = await this.usersService.findOne(req.user.id);
    return { success: true, user };
  }

  @Get('agents')
  async findAgents() {
    return { success: true, data: await this.usersService.findByRole('agent') };
  }

  @Get('clients')
  async findClients() {
    return { success: true, data: await this.usersService.findByRole('client') };
  }

  @Get()
  async findAll() {
    return { success: true, data: await this.usersService.findAll() };
  }

  @Post()
  async create(@Body() dto: CreateUserDto) {
    return { success: true, data: await this.usersService.create(dto) };
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(@Param('id') id: string, @Body() body: Partial<CreateUserDto>) {
    return { success: true, data: await this.usersService.update(id, body as any) };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async remove(@Param('id') id: string) {
    await this.usersService.remove(id);
    return { success: true };
  }
}
