import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DamageAnalysisModule } from '../damage-analysis/damage-analysis.module';
import { ContratsModule } from '../contrats/contrats.module';
import { DamageAgentController } from './damage-agent.controller';
import { DamageAgentService } from './damage-agent.service';
import { DamageAgentStateBuilder } from './damage-agent-state.builder';
import { DamageAgentLLMService } from './damage-agent-llm.service';

@Module({
  imports: [ConfigModule, DamageAnalysisModule, ContratsModule],
  controllers: [DamageAgentController],
  providers: [DamageAgentService, DamageAgentStateBuilder, DamageAgentLLMService],
  exports: [DamageAgentService, DamageAgentLLMService],
})
export class DamageAgentModule {}
