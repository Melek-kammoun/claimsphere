import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrchestratorService } from './orchestrator.service';
import { OrchestratorController } from './orchestrator.controller';
import { Claim } from '../claims/entities/claim.entity';
import { SupabaseModule } from '../supabase/supabase.module';
import { ClaimsModule } from '../claims/claims.module';
import { AiScoresModule } from '../ai-scores/ai-scores.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { DamageAnalysisModule } from '../damage-analysis/damage-analysis.module';
import { DamageAgentModule } from '../damage-agent/damage-agent.module';
import { OcrModule } from '../ocr/ocr.module';
import { DocumentsModule } from '../documents/documents.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Claim]),
    SupabaseModule,
    forwardRef(() => ClaimsModule),
    AiScoresModule,
    NotificationsModule,
    DamageAnalysisModule,
    DamageAgentModule,
    OcrModule,
    DocumentsModule,
  ],
  controllers: [OrchestratorController],
  providers: [OrchestratorService],
  exports: [OrchestratorService],
})
export class OrchestratorModule {}
