import { Injectable } from '@nestjs/common';
import { DamageAgentStateBuilder } from './damage-agent-state.builder';
import {
  DamageAgentEnvelope,
  DamageAnalysisOutput,
  DamageAgentDecision,
  VehicleDetails,
} from './damage-agent.types';
import { DamageAgentLLMService } from './damage-agent-llm.service';
import { DamageAnalysisService } from '../damage-analysis/damage-analysis.service';
import { ContratsService } from '../contrats/contrats.service';

@Injectable()
export class DamageAgentService {
  constructor(
    private readonly stateBuilder: DamageAgentStateBuilder,
    private readonly llmService: DamageAgentLLMService,
    private readonly damageAnalysisService: DamageAnalysisService,
    private readonly contratsService: ContratsService,
  ) {}

  prepareAgentEnvelope(analysis: DamageAnalysisOutput): DamageAgentEnvelope {
    return this.stateBuilder.buildFromAnalysis(analysis);
  }

  async decideDamage(
    analysis: DamageAnalysisOutput,
    vehicle?: VehicleDetails,
  ): Promise<DamageAgentDecision> {
    return this.llmService.decideDamage(analysis, vehicle);
  }

  async assessContractDamage(input: {
    fileName: string;
    mimeType: string;
    buffer: Buffer;
    threshold?: number;
    contractId: string | number;
  }): Promise<DamageAgentDecision> {
    const contract = await this.contratsService.getContratById(input.contractId);
    const analysis = await this.damageAnalysisService.predict({
      fileName: input.fileName,
      mimeType: input.mimeType,
      buffer: input.buffer,
      threshold: input.threshold,
    });

    const vehicle: VehicleDetails = {
      brand: contract.marque,
      model: contract.modele,
      year:
        contract.age !== undefined && contract.age !== null
          ? new Date().getFullYear() - contract.age
          : undefined,
      age: contract.age,
      kilometrage: contract.kilometrage,
      serie: contract.serie,
      num_voiture: contract.num_voiture,
    };

    return this.llmService.decideDamage(analysis, vehicle);
  }
}
