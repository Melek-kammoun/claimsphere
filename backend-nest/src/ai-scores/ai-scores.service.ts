import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AiScore } from './entities/ai-score.entity';

@Injectable()
export class AiScoresService {
  constructor(
    @InjectRepository(AiScore)
    private readonly repo: Repository<AiScore>,
  ) {}

  async upsertForClaim(claimId: string, score: number, riskLevel: string): Promise<AiScore> {
    const existing = await this.repo.findOne({ where: { claim_id: claimId } });
    if (existing) {
      existing.score = score;
      existing.risk_level = riskLevel;
      return this.repo.save(existing);
    }
    const record = this.repo.create({ claim_id: claimId, score, risk_level: riskLevel });
    return this.repo.save(record);
  }

  async findByClaim(claimId: string): Promise<AiScore | null> {
    return this.repo.findOne({ where: { claim_id: claimId } });
  }

  async findAll(): Promise<AiScore[]> {
    return this.repo.find({ order: { evaluated_at: 'DESC' } });
  }
}
