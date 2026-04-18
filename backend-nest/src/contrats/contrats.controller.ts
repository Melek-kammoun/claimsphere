import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateContratDto, UpdateContratStatusDto } from './contrats.dto';
import { ContratsService } from './contrats.service';

interface AuthRequest {
  user: { id: string };
}

@Controller('api/contrats')
export class ContratsController {
  constructor(private readonly contratsService: ContratsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  createContrat(@Body() dto: CreateContratDto, @Req() req: AuthRequest) {
    // FIX: always use the authenticated user's ID, ignore any client_id from the body.
    // This prevents a client from creating contracts on behalf of other users.
    return this.contratsService.createContrat({
      ...dto,
      client_id: req.user.id,
    });
  }

  @Get()
  getAllContrats(@Query('status') status?: string) {
    return this.contratsService.getAllContrats(status);
  }

  // FIX: /pending kept as a convenience alias — delegates to getAllContrats('non_traite')
  @Get('pending')
  getPendingContrats() {
    return this.contratsService.getPendingContrats();
  }

  @Get('client/me')
  @UseGuards(JwtAuthGuard)
  getMyContrats(@Req() req: AuthRequest) {
    return this.contratsService.getContratsByClientId(req.user.id);
  }

  @Get('client/:clientId')
  getContratsByClientId(@Param('clientId') clientId: string) {
    return this.contratsService.getContratsByClientId(clientId);
  }

  @Get(':id')
  getContratById(@Param('id') id: string) {
    return this.contratsService.getContratById(id);
  }

  @Patch(':id/status')
  updateContratStatus(
    @Param('id') id: string,
    @Body() dto: UpdateContratStatusDto,
  ) {
    return this.contratsService.updateContratStatus(id, dto.status);
  }
}