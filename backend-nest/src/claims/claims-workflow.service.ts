import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Claim } from './entities/claim.entity';
import { ClaimsService } from './claims.service';
import { StartClaimWorkflowDto } from './dto/start-claim-workflow.dto';
import { ConstatsService } from '../constats/services/constats.service';
import { Constat } from '../constats/entities/constat.entity';
import { DocumentsService } from '../documents/documents.service';
import { OrchestratorService } from '../orchestrator/orchestrator.service';
import { QrCodeService } from '../constats/services/qrcode.service';

type ClaimWorkflowMetadata = {
  userAgent?: string;
  ipAddress?: string;
};

@Injectable()
export class ClaimsWorkflowService {
  private readonly logger = new Logger(ClaimsWorkflowService.name);

  constructor(
    @InjectRepository(Claim)
    private readonly claimsRepository: Repository<Claim>,
    @InjectRepository(Constat)
    private readonly constatsRepository: Repository<Constat>,
    private readonly claimsService: ClaimsService,
    private readonly constatsService: ConstatsService,
    private readonly documentsService: DocumentsService,
    private readonly orchestratorService: OrchestratorService,
    private readonly qrCodeService: QrCodeService,
  ) {}

  async startWorkflow(
    userId: string,
    dto: StartClaimWorkflowDto,
    metadata?: ClaimWorkflowMetadata,
  ) {
    this.validateClaimBasics(dto);
    this.validateConstatDraft(dto.constat);

    const constatPayload = {
      ...dto.constat,
      accident_details: {
        ...dto.constat.accident_details,
        date: dto.constat.accident_details?.date || dto.date,
        location: dto.constat.accident_details?.location || dto.location,
        description: dto.constat.accident_details?.description || dto.description,
      },
      vehicle_a_data: {
        ...dto.constat.vehicle_a_data,
        plate: dto.constat.vehicle_a_data?.plate || dto.vehicle,
      },
    };

    const constat = await this.constatsService.createConstat(userId, constatPayload, metadata);
    const scanBaseUrl = (process.env.PUBLIC_SCAN_BASE_URL || process.env.FRONTEND_URL || '')
      .toString()
      .replace(/\/$/, '');
    const qrCode = await this.qrCodeService.generateQrCode(
      constat.qr_token,
      scanBaseUrl || 'http://localhost:8080',
    );

    return {
      constat,
      qr_token: constat.qr_token,
      qr_code: qrCode,
      scan_url: `${scanBaseUrl}/constats/scan/${constat.qr_token}`,
    };
  }

  async completeWorkflow(input: {
    userId: string;
    body: Record<string, any>;
    pvPoliceFile?: Express.Multer.File;
    accidentImages?: Express.Multer.File[];
  }) {
    const payload = this.parseWorkflowPayload(input.body);
    this.validateClaimBasics(payload);

    if (!payload.qr_token) {
      throw new BadRequestException('qr_token est requis pour finaliser le dossier.');
    }

    if (!input.pvPoliceFile) {
      throw new BadRequestException('Le PV de police est requis.');
    }

    if (!input.accidentImages || input.accidentImages.length === 0) {
      throw new BadRequestException('Au moins une image de l’accident est requise.');
    }

    const constat = await this.constatsRepository.findOne({
      where: { qr_token: payload.qr_token },
    });

    if (!constat) {
      throw new NotFoundException('Constat introuvable pour ce QR token.');
    }

    const claim = await this.claimsService.create({
      user_id: input.userId,
      contract_id: payload.contract_id ?? null,
      type: payload.type,
      date: payload.date,
      location: payload.location,
      description: payload.description,
      vehicle: payload.vehicle,
      documents: {
        workflow_status: 'processing',
        qr_token: payload.qr_token,
        constat_id: constat.id,
      },
    });

    constat.claim_id = claim.id;
    await this.constatsRepository.save(constat);

    const pvDocument = await this.documentsService.createUploadedDocument({
      file: input.pvPoliceFile,
      documentType: 'pv_police',
      claimId: claim.id,
      constatId: constat.id,
      metadata: {
        processing: 'pending_ocr',
      },
    });

    const imageDocuments = await Promise.all(
      (input.accidentImages ?? []).map((file) =>
        this.documentsService.createUploadedDocument({
          file,
          documentType: 'accident_image',
          claimId: claim.id,
          constatId: constat.id,
          metadata: {
            processing: 'damage_analysis',
          },
        }),
      ),
    );

    const orchestration = await this.orchestratorService.processClaimSubmission({
      claimId: claim.id,
      pvPoliceFile: input.pvPoliceFile,
      pvPoliceDocumentId: pvDocument.id,
      accidentImages: input.accidentImages ?? [],
      documentIds: imageDocuments.map((doc) => doc.id),
    });

    await this.claimsService.updateWorkflowData(claim.id, {
      workflow_status: 'completed',
      processed_at: new Date().toISOString(),
      qr_token: payload.qr_token,
      constat_id: constat.id,
      document_ids: imageDocuments.map((doc) => doc.id),
      uploaded_documents: {
        pv_police: pvDocument,
        accident_images: imageDocuments,
      },
      consolidated_result: orchestration,
    });

    const freshClaim = await this.claimsRepository.findOne({ where: { id: claim.id } });

    this.logger.log(`Claim workflow completed for claim ${claim.id}`);

    return {
      claim: freshClaim ?? claim,
      constat_id: constat.id,
      uploaded_documents: {
        pv_police: pvDocument,
        accident_images: imageDocuments,
      },
      orchestration,
    };
  }

  private parseWorkflowPayload(body: Record<string, any>) {
    if (typeof body.payload === 'string') {
      try {
        return JSON.parse(body.payload) as Record<string, any>;
      } catch {
        throw new BadRequestException('payload multipart invalide.');
      }
    }

    return body;
  }

  private validateClaimBasics(dto: {
    type?: string;
    date?: string;
    location?: string;
    description?: string;
    vehicle?: string;
  }) {
    const missing = [
      !dto.type ? 'type' : null,
      !dto.date ? 'date' : null,
      !dto.location ? 'location' : null,
      !dto.description ? 'description' : null,
      !dto.vehicle ? 'vehicle' : null,
    ].filter(Boolean);

    if (missing.length > 0) {
      throw new BadRequestException(
        `Champs obligatoires manquants: ${missing.join(', ')}.`,
      );
    }
  }

  private validateConstatDraft(constat: StartClaimWorkflowDto['constat']) {
    if (!constat) {
      throw new BadRequestException('Les données du constat sont obligatoires.');
    }

    if (!constat.user_a_data?.full_name || !constat.vehicle_a_data?.plate) {
      throw new BadRequestException(
        'Le constat doit contenir les informations du conducteur et du véhicule.',
      );
    }

    if (!constat.insurance_a_data?.company || !constat.insurance_a_data?.policy_number) {
      throw new BadRequestException(
        'Le constat doit contenir les informations d’assurance du client.',
      );
    }
  }
}
