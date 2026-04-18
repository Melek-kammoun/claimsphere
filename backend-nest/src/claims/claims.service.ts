import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Claim } from './entities/claim.entity';
import { NotificationsService } from '../notifications/notifications.service';

export type ClaimStatus =
  | 'pending'
  | 'in_review'
  | 'documents_requested'
  | 'approved'
  | 'rejected';

@Injectable()
export class ClaimsService {
  constructor(
    @InjectRepository(Claim)
    private claimsRepository: Repository<Claim>,
    private notificationsService: NotificationsService,
  ) {}

  async create(claimData: Partial<Claim>): Promise<Claim> {
    const reference = `SN-${new Date().getFullYear()}-${Math.floor(Math.random() * 90000 + 10000)}`;
    const claim = this.claimsRepository.create({
      ...claimData,
      reference,
      status: 'pending',
    });
    return this.claimsRepository.save(claim);
  }

  async findByUserId(userId: string): Promise<Claim[]> {
    return this.claimsRepository.find({
      where: { user_id: userId },
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Claim | null> {
    return this.claimsRepository.findOne({ where: { id } });
  }

  async findAll(): Promise<Claim[]> {
    return this.claimsRepository.find({ order: { created_at: 'DESC' } });
  }

  async updateStatus(id: string, status: ClaimStatus): Promise<Claim> {
    await this.claimsRepository.update(id, { status });
    const updated = await this.findOne(id);
    if (!updated) throw new NotFoundException('Claim not found');
    return updated;
  }

  async updateAiSuggestion(
    id: string,
    suggestion: string,
    amount?: number,
  ): Promise<Claim> {
    const patch: Partial<Claim> = { ai_suggestion: suggestion };
    if (amount !== undefined) patch.amount = amount;
    await this.claimsRepository.update(id, patch);
    const updated = await this.findOne(id);
    if (!updated) throw new NotFoundException('Claim not found');
    return updated;
  }

  async linkConstat(claimId: string, _constatId: string): Promise<Claim> {
    const updated = await this.findOne(claimId);
    if (!updated) throw new NotFoundException('Claim not found');
    return updated;
  }

  async updateWorkflowData(
    id: string,
    documents: Record<string, unknown>,
  ): Promise<Claim> {
    await this.claimsRepository.update(id, { documents: documents as any });
    const updated = await this.findOne(id);
    if (!updated) throw new NotFoundException('Claim not found');
    return updated;
  }

  async approveClaim(id: string, amount?: number): Promise<Claim> {
    const claim = await this.findOne(id);
    if (!claim) throw new NotFoundException('Claim not found');

    const patch: Partial<Claim> = { status: 'approved' };
    if (amount !== undefined) patch.amount = amount;
    await this.claimsRepository.update(id, patch);

    void this.notificationsService.create({
      user_id: claim.user_id,
      message: `Votre sinistre ${claim.reference} a été approuvé${amount ? ` — montant: ${amount} DH` : ''}.`,
    });

    return (await this.findOne(id)) as Claim;
  }

  async rejectClaim(id: string, reason: string): Promise<Claim> {
    const claim = await this.findOne(id);
    if (!claim) throw new NotFoundException('Claim not found');

    await this.claimsRepository.update(id, { status: 'rejected' });

    void this.notificationsService.create({
      user_id: claim.user_id,
      message: `Votre sinistre ${claim.reference} a été refusé. Motif: ${reason}`,
    });

    return (await this.findOne(id)) as Claim;
  }

  async requestDocuments(id: string, docsNeeded: string): Promise<Claim> {
    const claim = await this.findOne(id);
    if (!claim) throw new NotFoundException('Claim not found');

    await this.claimsRepository.update(id, { status: 'documents_requested' });

    void this.notificationsService.create({
      user_id: claim.user_id,
      message: `Documents requis pour votre sinistre ${claim.reference}: ${docsNeeded}`,
    });

    return (await this.findOne(id)) as Claim;
  }

  assertOwnership(claim: Claim, userId: string): void {
    if (claim.user_id !== userId) {
      throw new ForbiddenException('Access denied');
    }
  }
}
