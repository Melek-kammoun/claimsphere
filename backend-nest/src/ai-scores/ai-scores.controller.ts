import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AiScoresService } from './ai-scores.service';

@Controller('api/ai-scores')
@UseGuards(JwtAuthGuard)
export class AiScoresController {
  constructor(private readonly aiScoresService: AiScoresService) {}

  @Get()
  findAll() {
    return this.aiScoresService.findAll();
  }

  @Get('claim/:claimId')
  findByClaim(@Param('claimId') claimId: string) {
    return this.aiScoresService.findByClaim(claimId);
  }
}
