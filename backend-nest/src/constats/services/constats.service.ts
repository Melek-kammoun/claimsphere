import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { DeepPartial, In, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Constat, ConstatStatus } from '../entities/constat.entity';
import { ConstatParty } from '../entities/constat-party.entity';
import { CreateConstatDto } from '../dto/create-constat.dto';
import { CompleteConstatDto } from '../dto/complete-constat.dto';
import { ConstatResponseDto } from '../dto/constat-response.dto';
import { SupabaseService } from '../../supabase/supabase.service';
import { PdfService } from './pdf.service';
import { EmailService } from './email.service';
import { Logger } from '@nestjs/common';

@Injectable()
export class ConstatsService {
  private readonly logger = new Logger(ConstatsService.name);
  private readonly QR_CODE_EXPIRY_MINUTES = 30;
  private readonly UUID_REGEX =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  constructor(
    @InjectRepository(Constat)
    private constatRepository: Repository<Constat>,
    @InjectRepository(ConstatParty)
    private constatPartyRepository: Repository<ConstatParty>,
    private supabaseService: SupabaseService,
    private pdfService: PdfService,
    private emailService: EmailService,
  ) {}

  /**
   * Phase 1: Créer un constat par Client A
   */
  async createConstat(
    userId: string,
    createConstatDto: CreateConstatDto,
    metadata?: { userAgent?: string; ipAddress?: string }
  ): Promise<ConstatResponseDto> {
    try {
      // 1. Vérifier que l'utilisateur a un contrat actif
      const hasActiveContract = await this.verifyActiveContract(userId);
      if (!hasActiveContract) {
        throw new BadRequestException(
          'Vous n\'avez pas de contrat actif pour créer un constat'
        );
      }

      // 2. Générer QR token unique
      const qrToken = uuidv4();
      const qrExpiresAt = new Date();
      qrExpiresAt.setMinutes(qrExpiresAt.getMinutes() + this.QR_CODE_EXPIRY_MINUTES);

      const reference = `CST-${Date.now()}`;
      const accidentDateTime = this.toAccidentTimestamp(
        createConstatDto.accident_details?.date,
        createConstatDto.accident_details?.time
      );

      // 3. Créer le constat
      const constat = this.constatRepository.create() as Constat;
      constat.reference = reference;
      constat.claim_id = null;
      constat.statut = ConstatStatus.PENDING;
      constat.date_accident = accidentDateTime;
      constat.lieu_accident = createConstatDto.accident_details?.location;
      constat.description_accident = createConstatDto.accident_details?.description;
      constat.qr_token = qrToken;
      constat.qr_expires_at = qrExpiresAt;
      constat.metadata = {
        user_agent: metadata?.userAgent,
        ip_address: metadata?.ipAddress,
      };
      constat.action_logs = [
        {
          action: 'constat_created',
          user_id: userId,
          timestamp: new Date(),
          details: {
            location: createConstatDto.accident_details.location,
          },
        },
      ];

      await this.constatRepository.save(constat);

      const [nom, ...restPrenom] = (createConstatDto.user_a_data?.full_name || '').split(' ');
      const prenom = restPrenom.join(' ').trim() || null;

      const partyA = this.constatPartyRepository.create() as ConstatParty;
      partyA.constat_id = constat.id;
      partyA.role = 'A';
      partyA.user_id = await this.resolveExistingUserId(userId);
      partyA.nom = nom || null;
      partyA.prenom = prenom;
      partyA.telephone = createConstatDto.user_a_data?.phone || null;
      partyA.num_permis = createConstatDto.user_a_data?.driving_license || null;
      partyA.num_assurance = createConstatDto.insurance_a_data?.policy_number || null;
      partyA.compagnie_assurance = createConstatDto.insurance_a_data?.company || null;
      partyA.agence_assurance = createConstatDto.insurance_a_data?.agent_name || null;
      partyA.immatriculation = createConstatDto.vehicle_a_data?.plate || null;
      partyA.marque = createConstatDto.vehicle_a_data?.brand || null;
      partyA.modele = createConstatDto.vehicle_a_data?.model || null;
      partyA.annee = createConstatDto.vehicle_a_data?.year || null;
      partyA.circonstances = createConstatDto.accident_details || null;
      partyA.signature = createConstatDto.signature_a || null;
      partyA.photos = createConstatDto.photos_a || [];
      partyA.rempli_le = new Date();

      await this.constatPartyRepository.save(partyA);
      this.logger.log(`Constat créé: ${constat.id} par l'utilisateur ${userId}`);

      return this.mapToResponseDto(constat, [partyA]);
    } catch (error) {
      this.logger.error(`Erreur lors de la création du constat: ${error}`);
      throw error;
    }
  }

  /**
   * Phase 2: Scanner le QR Code
   */
  async getConstatByQrToken(qrToken: string): Promise<ConstatResponseDto> {
    // 1. Vérifier que le token existe
    const constat = await this.constatRepository.findOne({
      where: { qr_token: qrToken },
    });

    if (!constat) {
      throw new NotFoundException('QR Code invalide ou expiré');
    }

    // 2. Vérifier qu'il n'est pas expiré
    if (new Date() > constat.qr_expires_at) {
      throw new ForbiddenException('QR Code expiré');
    }

    // 3. Vérifier que le constat est dans le bon état
    if (constat.statut !== ConstatStatus.PENDING) {
      throw new ForbiddenException('Ce constat a déjà été complété');
    }

    // 4. Logger l'action
    await this.addActionLog(constat.id, 'qr_scanned', {
      scanned_by: 'user_b',
      timestamp: new Date(),
    });

    this.logger.log(`QR Code scanné: ${qrToken}`);

    const parties = await this.constatPartyRepository.find({
      where: { constat_id: constat.id },
      order: { created_at: 'ASC' },
    });

    return this.mapToResponseDto(constat, parties);
  }

  /**
   * Phase 3: Compléter le constat par Client B
   */
  async completeConstat(
    qrToken: string,
    userBId: string,
    completeConstatDto: CompleteConstatDto,
    metadata?: { userAgent?: string; ipAddress?: string }
  ): Promise<ConstatResponseDto> {
    try {
      // 1. Récupérer le constat
      const constat = await this.constatRepository.findOne({
        where: { qr_token: qrToken },
      });

      if (!constat) {
        throw new NotFoundException('Constat introuvable');
      }

      // 2. Vérifier l'expiration du token
      if (new Date() > constat.qr_expires_at) {
        throw new ForbiddenException('QR Code expiré');
      }

      // 3. Vérifier que le constat est en attente
      if (constat.statut !== ConstatStatus.PENDING) {
        throw new BadRequestException(
          'Ce constat n\'est pas en attente de complétion'
        );
      }

      const existingParties = await this.constatPartyRepository.find({
        where: { constat_id: constat.id },
      });
      const partyA = existingParties.find((p) => p.role === 'A');
      const partyB = existingParties.find((p) => p.role === 'B');

      // 4. Éviter la double soumission
      if (partyB) {
        throw new ForbiddenException(
          'Ce constat a déjà été complété par un autre utilisateur'
        );
      }

      // 5. Vérifier que l'utilisateur A et B sont différents
      if (partyA?.user_id && userBId === partyA.user_id) {
        throw new BadRequestException(
          'Vous ne pouvez pas compléter votre propre constat'
        );
      }

      // 6. Ajouter les données de l'utilisateur B
      const [nomB, ...restPrenomB] = (completeConstatDto.user_b_data?.full_name || '').split(' ');
      const prenomB = restPrenomB.join(' ').trim() || null;

      const newPartyB = this.constatPartyRepository.create() as ConstatParty;
      newPartyB.constat_id = constat.id;
      newPartyB.role = 'B';
      newPartyB.user_id = await this.resolveExistingUserId(userBId);
      newPartyB.nom = nomB || null;
      newPartyB.prenom = prenomB;
      newPartyB.telephone = completeConstatDto.user_b_data?.phone || null;
      newPartyB.num_permis = completeConstatDto.user_b_data?.driving_license || null;
      newPartyB.num_assurance = completeConstatDto.insurance_b_data?.policy_number || null;
      newPartyB.compagnie_assurance = completeConstatDto.insurance_b_data?.company || null;
      newPartyB.agence_assurance = completeConstatDto.insurance_b_data?.agent_name || null;
      newPartyB.immatriculation = completeConstatDto.vehicle_b_data?.plate || null;
      newPartyB.marque = completeConstatDto.vehicle_b_data?.brand || null;
      newPartyB.modele = completeConstatDto.vehicle_b_data?.model || null;
      newPartyB.annee = completeConstatDto.vehicle_b_data?.year || null;
      newPartyB.circonstances = metadata || null;
      newPartyB.signature = completeConstatDto.signature_b || null;
      newPartyB.photos = completeConstatDto.photos_b || [];
      newPartyB.rempli_le = new Date();
      await this.constatPartyRepository.save(newPartyB);
      constat.statut = ConstatStatus.COMPLETE;
      constat.completed_at = new Date();

      // 7. Logger l'action
      constat.action_logs.push({
        action: 'constat_completed',
        user_id: userBId,
        timestamp: new Date(),
        details: {
          vehicle_plate: completeConstatDto.vehicle_b_data.plate,
        },
      });

      await this.constatRepository.save(constat);

      this.logger.log(`Constat complété: ${constat.id} par l'utilisateur ${userBId}`);

      // 8. Générer le PDF et envoyer les emails
      await this.finalizeConstat(constat);

      const parties = [...existingParties, newPartyB];
      return this.mapToResponseDto(constat, parties);
    } catch (error) {
      this.logger.error(`Erreur lors de la complétion du constat: ${error}`);
      throw error;
    }
  }

  /**
   * Phase 4: Finalisation (PDF + Email)
   */
  async finalizeConstat(constat: Constat): Promise<void> {
    try {
      const parties = await this.constatPartyRepository.find({
        where: { constat_id: constat.id },
      });

      // 1. Générer le PDF
      const pdfBuffer = await this.pdfService.generateConstatPdf(constat, parties);
      const pdfUrl = await this.uploadPdfToSupabase(
        constat.id,
        pdfBuffer
      );

      constat.pdf_url = pdfUrl;
      constat.statut = ConstatStatus.VALID;
      constat.validated_at = new Date();

      // 2. Logger la finalisation
      constat.action_logs.push({
        action: 'constat_finalized',
        user_id: 'system',
        timestamp: new Date(),
        details: {
          pdf_generated: true,
        },
      });

      await this.constatRepository.save(constat);

      // 3. Envoyer les emails
      await this.sendConstatEmails(constat, pdfUrl, parties);

      this.logger.log(`Constat finalisé: ${constat.id}`);
    } catch (error) {
      this.logger.error(`Erreur lors de la finalisation du constat: ${error}`);
      // Ne pas échouer complètement, mais logger l'erreur
    }
  }

  /**
   * Utilitaires
   */
  private async verifyActiveContract(userId: string): Promise<boolean> {
    // En dev, on autorise la génération pour faciliter les tests UI/QR sans seed complet des contrats.
    if (process.env.NODE_ENV !== 'production') {
      return true;
    }

    const client = this.supabaseService.getClient();
    const { data, error } = await client
      .from('contracts')
      .select('id')
      .eq('client_id', userId)
      .eq('status', 'active')
      .single();

    if (error) {
      this.logger.warn(
        `Erreur lors de la vérification du contrat pour ${userId}: ${error}`
      );
      return false;
    }

    return !!data;
  }

  private toNullableUuid(value: string | null | undefined): string | null {
    if (!value || !this.UUID_REGEX.test(value)) {
      return null;
    }

    return value;
  }

  private async resolveExistingUserId(value: string | null | undefined): Promise<string | null> {
    const uuid = this.toNullableUuid(value);
    if (!uuid) {
      return null;
    }

    const client = this.supabaseService.getClient();
    const { data, error } = await client
      .from('users')
      .select('id')
      .eq('id', uuid)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return uuid;
  }

  private async uploadPdfToSupabase(
    constatId: string,
    pdfBuffer: Buffer
  ): Promise<string> {
    const client = this.supabaseService.getClient();
    const fileName = `constats/${constatId}/${Date.now()}.pdf`;

    const { data, error } = await client.storage
      .from('documents')
      .upload(fileName, pdfBuffer, {
        contentType: 'application/pdf',
      });

    if (error) {
      throw new Error(`Erreur lors de l'upload du PDF: ${error}`);
    }

    // Obtenir l'URL publique
    const { data: { publicUrl } } = client.storage
      .from('documents')
      .getPublicUrl(fileName);

    return publicUrl;
  }

  private async sendConstatEmails(
    constat: Constat,
    pdfUrl: string,
    parties: ConstatParty[]
  ): Promise<void> {
    try {
      const users = parties.filter((p) => !!p.user_id).map((p) => p.user_id);
      if (users.length > 0) {
        const client = this.supabaseService.getClient();
        const { data } = await client
          .from('users')
          .select('id, full_name, phone')
          .in('id', users);

        for (const party of parties) {
          const matched = (data || []).find((u: any) => u.id === party.user_id);
          const recipientEmail = this.buildFallbackEmail(party, matched);
          if (recipientEmail) {
            await this.emailService.sendConstatEmail(
              recipientEmail,
              constat,
              pdfUrl,
              `${party.nom || ''} ${party.prenom || ''}`.trim() || null
            );
          }
        }
      }

      this.logger.log(`Emails de constat envoyés pour ${constat.id}`);
    } catch (error) {
      this.logger.error(`Erreur lors de l'envoi des emails: ${error}`);
    }
  }

  private async addActionLog(
    constatId: string,
    action: string,
    details?: any
  ): Promise<void> {
    const constat = await this.constatRepository.findOne({
      where: { id: constatId },
    });

    if (constat) {
      constat.action_logs.push({
        action,
        user_id: 'system',
        timestamp: new Date(),
        details,
      });
      await this.constatRepository.save(constat);
    }
  }

  private mapToResponseDto(constat: Constat, parties: ConstatParty[] = []): ConstatResponseDto {
    return {
      id: constat.id,
      reference: constat.reference,
      claim_id: constat.claim_id,
      qr_token: constat.qr_token,
      statut: constat.statut,
      date_accident: constat.date_accident,
      lieu_accident: constat.lieu_accident,
      description_accident: constat.description_accident,
      metadata: constat.metadata,
      parties,
      created_at: constat.created_at,
      updated_at: constat.updated_at,
      qr_expires_at: constat.qr_expires_at,
      completed_at: constat.completed_at,
      validated_at: constat.validated_at,
      pdf_url: constat.pdf_url,
    };
  }

  // Méthodes supplémentaires
  async getConstatById(constatId: string, userId: string): Promise<ConstatResponseDto> {
    const constat = await this.constatRepository.findOne({
      where: { id: constatId },
    });

    if (!constat) {
      throw new NotFoundException('Constat introuvable');
    }

    const hasAccess = await this.userHasConstatAccess(constatId, userId);
    if (!hasAccess) {
      throw new ForbiddenException('Vous n\'avez pas accès à ce constat');
    }

    const parties = await this.constatPartyRepository.find({
      where: { constat_id: constat.id },
      order: { created_at: 'ASC' },
    });

    return this.mapToResponseDto(constat, parties);
  }

  async listUserConstats(userId: string): Promise<ConstatResponseDto[]> {
    const client = this.supabaseService.getClient();
    const { data, error } = await client
      .from('constat_parties')
      .select('constat_id')
      .eq('user_id', userId);

    if (error) {
      this.logger.error(`Erreur listUserConstats parties: ${error.message}`);
      return [];
    }

    const constatIds = Array.from(new Set((data || []).map((d: any) => d.constat_id).filter(Boolean)));
    if (constatIds.length === 0) {
      return [];
    }

    const constats = await this.constatRepository.find({
      where: { id: In(constatIds) },
      order: { created_at: 'DESC' },
    });

    const parties = await this.constatPartyRepository.find({
      where: { constat_id: In(constatIds) },
      order: { created_at: 'ASC' },
    });

    return constats.map((c) => this.mapToResponseDto(c, parties.filter((p) => p.constat_id === c.id)));
  }

  async resendQrCode(constatId: string, userId: string): Promise<string> {
    const constat = await this.constatRepository.findOne({
      where: { id: constatId },
    });

    if (!constat) {
      throw new NotFoundException('Constat introuvable');
    }

    const partyA = await this.constatPartyRepository.findOne({
      where: { constat_id: constatId, role: 'A' },
    });

    if (!partyA || partyA.user_id !== userId) {
      throw new ForbiddenException('Seul le créateur peut renvoyer le QR Code');
    }

    if (constat.statut !== ConstatStatus.PENDING) {
      throw new BadRequestException('Seuls les constats en attente peuvent être renvoyés');
    }

    // Générer un nouveau token
    const newQrToken = uuidv4();
    const qrExpiresAt = new Date();
    qrExpiresAt.setMinutes(qrExpiresAt.getMinutes() + this.QR_CODE_EXPIRY_MINUTES);

    constat.qr_token = newQrToken;
    constat.qr_expires_at = qrExpiresAt;

    constat.action_logs.push({
      action: 'qr_token_regenerated',
      user_id: userId,
      timestamp: new Date(),
    });

    await this.constatRepository.save(constat);

    this.logger.log(`Nouveau QR token généré pour ${constatId}`);

    return newQrToken;
  }

  private toAccidentTimestamp(date?: string, time?: string): Date | null {
    if (!date) return null;
    const normalizedTime = time || '00:00';
    const ts = new Date(`${date}T${normalizedTime}:00`);
    return Number.isNaN(ts.getTime()) ? null : ts;
  }

  private async userHasConstatAccess(constatId: string, userId: string): Promise<boolean> {
    const client = this.supabaseService.getClient();
    const { data, error } = await client
      .from('constat_parties')
      .select('id')
      .eq('constat_id', constatId)
      .eq('user_id', userId)
      .limit(1)
      .maybeSingle();

    if (error) {
      return false;
    }
    return !!data;
  }

  private buildFallbackEmail(party: ConstatParty, user: any): string | null {
    const baseName = (user?.full_name || `${party.nom || ''}.${party.prenom || ''}`.trim())
      .toLowerCase()
      .replace(/\s+/g, '.');
    if (!baseName) return null;
    return `${baseName}@example.com`;
  }
}
