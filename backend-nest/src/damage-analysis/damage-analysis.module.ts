import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DamageAnalysisController } from './damage-analysis.controller';
import { DamageAnalysisService } from './damage-analysis.service';

@Module({
  imports: [ConfigModule],
  controllers: [DamageAnalysisController],
  providers: [DamageAnalysisService],
  exports: [DamageAnalysisService],
})
export class DamageAnalysisModule {}
