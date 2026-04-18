import { Controller, Post, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OrchestratorService } from './orchestrator.service';

@Controller('api/orchestrator')
@UseGuards(JwtAuthGuard)
export class OrchestratorController {
  constructor(private readonly orchestratorService: OrchestratorService) {}

  @Post('analyze/:claimId')
  analyze(@Param('claimId') claimId: string) {
    return this.orchestratorService.orchestrateClaim(claimId);
  }
}
