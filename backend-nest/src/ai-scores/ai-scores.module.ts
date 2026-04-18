import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiScoresService } from './ai-scores.service';
import { AiScoresController } from './ai-scores.controller';
import { AiScore } from './entities/ai-score.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AiScore])],
  controllers: [AiScoresController],
  providers: [AiScoresService],
  exports: [AiScoresService],
})
export class AiScoresModule {}
