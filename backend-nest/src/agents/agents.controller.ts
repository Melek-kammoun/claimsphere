import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { AgentsService } from './agents.service';
import { CreateAgentDto } from './dto/create-agent.dto';
import { UpdateAgentDto } from './dto/update-agent.dto';
import { AdminGuard } from '../auth/guards/admin.guard';

@Controller('agents')
@UseGuards(AdminGuard)
export class AgentsController {
  constructor(private readonly agentsService: AgentsService) {}

  /**
   * GET /agents
   * Récupérer tous les agents
   */
  @Get()
  findAll() {
    return this.agentsService.findAll();
  }

  /**
   * GET /agents/:id
   * Récupérer un agent spécifique
   */
  @Get(':id')
  findById(@Param('id') id: string) {
    return this.agentsService.findById(id);
  }

  /**
   * POST /agents
   * Créer un nouvel agent (admin only)
   * Body: { full_name, email, password, phone?, specialty? }
   */
  @Post()
  create(@Body() dto: CreateAgentDto) {
    return this.agentsService.create(dto);
  }

  /**
   * PATCH /agents/:id
   * Mettre à jour un agent
   * Body: { full_name?, email?, phone?, specialty?, status? }
   */
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateAgentDto) {
    return this.agentsService.update(id, dto);
  }

  /**
   * PATCH /agents/:id/status
   * Changer le statut d'un agent (Actif/En attente/Suspendu)
   */
  @Patch(':id/status')
  changeStatus(
    @Param('id') id: string,
    @Body() body: { status: 'Actif' | 'En attente' | 'Suspendu' },
  ) {
    if (!['Actif', 'En attente', 'Suspendu'].includes(body.status)) {
      throw new BadRequestException(
        'Le statut doit être Actif, En attente ou Suspendu',
      );
    }
    return this.agentsService.changeStatus(id, body.status);
  }

  /**
   * DELETE /agents/:id
   * Supprimer un agent
   */
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.agentsService.remove(id);
  }
}
