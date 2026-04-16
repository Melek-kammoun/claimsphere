import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SupabaseModule } from './supabase/supabase.module';
import { ClaimsModule } from './claims/claims.module';
import { EstimateModule } from './estimate/estimate.module';
import { ContratsModule } from './contrats/contrats.module';
import { DamageAnalysisModule } from './damage-analysis/damage-analysis.module';
import { DamageAgentModule } from './damage-agent/damage-agent.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    SupabaseModule,
    ClaimsModule,
    EstimateModule,
    ContratsModule,
    DamageAnalysisModule,
    DamageAgentModule,
  ],
})
export class AppModule {}
