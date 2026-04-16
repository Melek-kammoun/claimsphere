import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Claim } from './entities/claim.entity';

@Injectable()
export class ClaimsService {
  private readonly logger = new Logger('ClaimsService');

  constructor(
    @InjectRepository(Claim)
    private claimsRepository: Repository<Claim>,
  ) {}

  /**
   * Find all claims for a user
   */
  async findByUserId(userId: string): Promise<Claim[]> {
    this.logger.log(`🔍 Finding claims for user: ${userId}`);
    
    const claims = await this.claimsRepository.find({
      where: { user_id: userId },
      order: { created_at: 'DESC' },
    });
    
    this.logger.log(`✅ Found ${claims.length} claims`);
    return claims;
  }

  /**
   * Find claim by ID
   */
  async findOne(id: string): Promise<Claim | null> {
    this.logger.log(`🔍 Finding claim with id: ${id}`);
    const claim = await this.claimsRepository.findOne({
      where: { id },
    });
    this.logger.log(`✅ Claim found:`, claim);
    return claim || null;
  }

  /**
   * Update claim status
   */
  async updateStatus(id: string, status: string): Promise<Claim> {
    this.logger.log(`🔍 Updating claim ${id} status to ${status}`);
    await this.claimsRepository.update(id, { status });
    const updatedClaim = await this.findOne(id);
    
    if (!updatedClaim) {
      throw new Error('Claim not found after update');
    }
    
    this.logger.log(`✅ Claim updated:`, updatedClaim);
    return updatedClaim;
  }

  /**
   * Create new claim
   */
  async create(claimData: Partial<Claim>): Promise<Claim> {
    this.logger.log(`🔍 Creating new claim:`, claimData);
    const claim = this.claimsRepository.create(claimData);
    const savedClaim = await this.claimsRepository.save(claim);
    this.logger.log(`✅ Claim created:`, savedClaim);
    return savedClaim;
  }

  /**
   * Get all claims (admin)
   */
  async findAll(): Promise<Claim[]> {
    this.logger.log(`🔍 Fetching all claims (admin)`);
    const claims = await this.claimsRepository.find({
      order: { created_at: 'DESC' },
    });
    this.logger.log(`✅ Found ${claims.length} claims`);
    return claims;
  }
}