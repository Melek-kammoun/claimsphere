import { Module } from '@nestjs/common';
import { AiScoresService } from './ai-scores.service';
import { AiScoresController } from './ai-scores.controller';

@Module({
  controllers: [AiScoresController],
  providers: [AiScoresService],
})
export class AiScoresModule {}
