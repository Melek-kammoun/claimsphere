import { Controller, Get, Post, Delete, Param, Body } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()                          // GET /users → tous les users
  findAll() {
    return this.usersService.findAll();
  }

  @Get('agents')                  // GET /users/agents → seulement les agents
  findAgents() {
    return this.usersService.findByRole('agent');
  }

  @Get('clients')                 // GET /ux  sers/clients → seulement les clients
  findClients() {
    return this.usersService.findByRole('client');
  }

 @Post()
create(@Body() dto: CreateUserDto) {
  return this.usersService.create(dto);
}

  // users/users.controller.ts
@Delete(':id')
async remove(@Param('id') id: string) { // ← string au lieu de number
  return this.usersService.remove(id);
}
}