import { Module } from '@nestjs/common';
import { AiScoresService } from './ai_scores.service';
import { AiScoresController } from './ai_scores.controller';

@Module({
  controllers: [AiScoresController],
  providers: [AiScoresService],
})
export class AiScoresModule {}
