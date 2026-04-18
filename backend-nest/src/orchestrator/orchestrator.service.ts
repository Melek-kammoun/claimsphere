import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Claim } from '../claims/entities/claim.entity';
import { ClaimsService } from '../claims/claims.service';
import { AiScoresService } from '../ai-scores/ai-scores.service';
import { NotificationsService } from '../notifications/notifications.service';
import { SupabaseService } from '../supabase/supabase.service';
import { DamageAnalysisService } from '../damage-analysis/damage-analysis.service';
import { DamageAgentService } from '../damage-agent/damage-agent.service';
import { OcrService } from '../ocr/services/ocr.service';
import { DocumentsService } from '../documents/documents.service';
import { ConstatParty } from '../constats/entities/constat-party.entity';

export interface OrchestratorDecision {
  decision: 'approve' | 'reject' | 'review';
  risk_level: 'low' | 'medium' | 'high';
  fraud_score: number;
  recommended_payout: number;
  reasoning: string;
}

export interface ConsolidatedClaimResult {
  claim_id: string;
  consolidated_claim_data: {
    claim: Claim;
    constat: {
      id: string | null;
      status: string | null;
      accident: Record<string, unknown> | null;
      client_party: ConstatParty | null;
      second_party: ConstatParty | null;
    };
    ocr: {
      pv_police: Record<string, unknown> | null;
    };
    damage: {
      per_image: Array<Record<string, unknown>>;
      aggregated: Record<string, unknown> | null;
      agent_decision: Record<string, unknown> | null;
    };
  };
  ai_insights: {
    ocr: Record<string, unknown> | null;
    damage: {
      aggregated: Record<string, unknown> | null;
      decision: Record<string, unknown> | null;
    };
  };
  decision_support: OrchestratorDecision;
}

@Injectable()
export class OrchestratorService {
  private readonly logger = new Logger(OrchestratorService.name);

  constructor(
    @InjectRepository(Claim)
    private readonly claimsRepo: Repository<Claim>,
    private readonly claimsService: ClaimsService,
    private readonly aiScoresService: AiScoresService,
    private readonly notificationsService: NotificationsService,
    private readonly supabase: SupabaseService,
    private readonly damageAnalysisService: DamageAnalysisService,
    private readonly damageAgentService: DamageAgentService,
    private readonly ocrService: OcrService,
    private readonly documentsService: DocumentsService,
  ) {}

  async processClaimSubmission(input: {
    claimId: string;
    pvPoliceFile: Express.Multer.File;
    pvPoliceDocumentId?: string | null;
    accidentImages: Express.Multer.File[];
    documentIds?: string[];
  }): Promise<ConsolidatedClaimResult> {
    const claim = await this.claimsService.findOne(input.claimId);
    if (!claim) {
      throw new NotFoundException(`Claim ${input.claimId} not found`);
    }

    const [constatData, pvResult, damageData] = await Promise.all([
      this.fetchConstatData(claim.id),
      this.ocrService.uploadPvPolice(input.pvPoliceFile, claim.id),
      this.runDamagePipeline(claim, input.accidentImages, input.documentIds ?? []),
    ]);

    if (input.pvPoliceDocumentId) {
      await this.documentsService.update(input.pvPoliceDocumentId, {
        extracted_data: (pvResult.extractedData ?? null) as Record<string, unknown> | null,
        source_table: 'pv_police',
        source_id: (pvResult.document?.id ?? null) as string | null,
        metadata: {
          processing: 'ocr_completed',
        },
      });
    }

    return this.buildAndPersistResult({
      claim,
      constatData,
      pvPoliceData: pvResult.extractedData ?? null,
      damageData,
    });
  }

  async orchestrateClaim(claimId: string): Promise<ConsolidatedClaimResult> {
    const claim = await this.claimsService.findOne(claimId);
    if (!claim) {
      throw new NotFoundException(`Claim ${claimId} not found`);
    }

    const [constatData, pvPoliceData, imageDocuments] = await Promise.all([
      this.fetchConstatData(claim.id),
      this.fetchPvPolice(claim.id),
      this.documentsService.findByClaimId(claim.id),
    ]);

    const damageFromClaim =
      (claim.documents as Record<string, any> | null)?.consolidated_result?.ai_insights?.damage ?? null;

    const damageData =
      damageFromClaim && typeof damageFromClaim === 'object'
        ? {
            perImage: Array.isArray((damageFromClaim as any).per_image)
              ? (damageFromClaim as any).per_image
              : [],
            aggregated: (damageFromClaim as any).aggregated ?? null,
            agentDecision: (damageFromClaim as any).decision ?? null,
            documentIds: imageDocuments
              .filter((doc) => doc.document_type === 'accident_image')
              .map((doc) => doc.id),
          }
        : {
            perImage: [],
            aggregated: null,
            agentDecision: null,
            documentIds: imageDocuments
              .filter((doc) => doc.document_type === 'accident_image')
              .map((doc) => doc.id),
          };

    return this.buildAndPersistResult({
      claim,
      constatData,
      pvPoliceData,
      damageData,
    });
  }

  private async buildAndPersistResult(input: {
    claim: Claim;
    constatData: any;
    pvPoliceData: Record<string, unknown> | null;
    damageData: {
      perImage: Array<Record<string, unknown>>;
      aggregated: Record<string, unknown> | null;
      agentDecision: Record<string, unknown> | null;
      documentIds: string[];
    };
  }): Promise<ConsolidatedClaimResult> {
    const contract = await this.fetchContract(input.claim.contract_id);
    const decision = await this.computeDecisionSupport(
      input.claim,
      contract,
      input.constatData,
      input.pvPoliceData,
      input.damageData,
    );

    const clientParty =
      input.constatData?.constat_parties?.find((party: ConstatParty) => party.role === 'A') ?? null;
    const secondParty =
      input.constatData?.constat_parties?.find((party: ConstatParty) => party.role === 'B') ?? null;

    const result: ConsolidatedClaimResult = {
      claim_id: input.claim.id,
      consolidated_claim_data: {
        claim: input.claim,
        constat: {
          id: input.constatData?.id ?? null,
          status: input.constatData?.statut ?? null,
          accident: input.constatData
            ? {
                date_accident: input.constatData.date_accident,
                lieu_accident: input.constatData.lieu_accident,
                description_accident: input.constatData.description_accident,
              }
            : null,
          client_party: clientParty,
          second_party: secondParty,
        },
        ocr: {
          pv_police: input.pvPoliceData,
        },
        damage: {
          per_image: input.damageData.perImage,
          aggregated: input.damageData.aggregated,
          agent_decision: input.damageData.agentDecision,
        },
      },
      ai_insights: {
        ocr: input.pvPoliceData,
        damage: {
          aggregated: input.damageData.aggregated,
          decision: input.damageData.agentDecision,
        },
      },
      decision_support: decision,
    };

    await this.claimsService.updateAiSuggestion(
      input.claim.id,
      decision.reasoning,
      decision.recommended_payout,
    );

    await this.claimsService.updateWorkflowData(input.claim.id, {
      workflow_status: 'completed',
      processed_at: new Date().toISOString(),
      document_ids: input.damageData.documentIds,
      consolidated_result: result,
    });

    await this.aiScoresService.upsertForClaim(
      input.claim.id,
      decision.fraud_score,
      decision.risk_level,
    );

    if (decision.decision !== 'review') {
      void this.notificationsService.create({
        user_id: input.claim.user_id,
        message:
          decision.decision === 'approve'
            ? `Votre sinistre ${input.claim.reference} est prêt pour décision. Montant recommandé: ${decision.recommended_payout} DH.`
            : `Votre sinistre ${input.claim.reference} nécessite une revue approfondie: ${decision.reasoning}`,
      });
    }

    return result;
  }

  private async fetchConstatData(claimId: string): Promise<any> {
    try {
      const { data } = await this.supabase
        .getClient()
        .from('constats')
        .select('*, constat_parties(*)')
        .eq('claim_id', claimId)
        .maybeSingle();
      return data;
    } catch {
      return null;
    }
  }

  private async fetchPvPolice(claimId: string): Promise<Record<string, unknown> | null> {
    try {
      const document = await this.ocrService.getAllPvPolice();
      const matched = document.find((item) => item.claim_id === claimId);
      return matched ? (matched.parsed_data ?? null) : null;
    } catch {
      return null;
    }
  }

  private async fetchContract(contractId: string | null): Promise<any> {
    if (!contractId) {
      return null;
    }

    try {
      const { data } = await this.supabase
        .getClient()
        .from('contracts')
        .select('*')
        .eq('id', contractId)
        .maybeSingle();
      return data;
    } catch {
      return null;
    }
  }

  private async runDamagePipeline(
    claim: Claim,
    files: Express.Multer.File[],
    documentIds: string[],
  ): Promise<{
    perImage: Array<Record<string, unknown>>;
    aggregated: Record<string, unknown> | null;
    agentDecision: Record<string, unknown> | null;
    documentIds: string[];
  }> {
    if (!files.length) {
      return {
        perImage: [],
        aggregated: null,
        agentDecision: null,
        documentIds,
      };
    }

    const perImage = await Promise.all(
      files.map(async (file, index) => {
        const analysis = await this.damageAnalysisService.predict({
          fileName: file.originalname,
          mimeType: file.mimetype,
          buffer: file.buffer,
        });

        return {
          document_id: documentIds[index] ?? null,
          file_name: file.originalname,
          analysis,
        };
      }),
    );

    const allResults = perImage.flatMap((entry: any) =>
      Array.isArray(entry.analysis?.results) ? entry.analysis.results : [],
    );

    const summaries = perImage
      .map((entry: any) => entry.analysis?.summary)
      .filter((summary) => !!summary);

    const aggregated = summaries.length
      ? {
          total_damages: summaries.reduce(
            (sum: number, summary: any) => sum + Number(summary.total_damages ?? 0),
            0,
          ),
          max_severity: Math.max(
            ...summaries.map((summary: any) => Number(summary.max_severity ?? 0)),
          ),
          avg_severity:
            summaries.reduce(
              (sum: number, summary: any) => sum + Number(summary.avg_severity ?? 0),
              0,
            ) / summaries.length,
          global_label:
            summaries
              .map((summary: any) => summary.global_label)
              .filter(Boolean)
              .join(' / ') || 'undetermined',
          results_count: allResults.length,
        }
      : null;

    let agentDecision: Record<string, unknown> | null = null;
    if (aggregated) {
      try {
        agentDecision = (await this.damageAgentService.decideDamage(
          {
            results: allResults,
            summary: aggregated as any,
          },
          undefined,
        )) as unknown as Record<string, unknown>;
      } catch (error) {
        this.logger.warn(`Damage agent decision failed for claim ${claim.id}: ${error}`);
      }
    }

    return {
      perImage,
      aggregated,
      agentDecision,
      documentIds,
    };
  }

  private async computeDecisionSupport(
    claim: Claim,
    contract: any,
    constatData: any,
    pvPoliceData: Record<string, unknown> | null,
    damageData: {
      aggregated: Record<string, unknown> | null;
      agentDecision: Record<string, unknown> | null;
    },
  ): Promise<OrchestratorDecision> {
    let fraudScore = 0;

    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const pastClaims = await this.claimsRepo
      .createQueryBuilder('c')
      .where('c.user_id = :uid', { uid: claim.user_id })
      .andWhere('c.created_at > :since', { since: oneYearAgo })
      .andWhere('c.id != :id', { id: claim.id })
      .getCount();

    if (pastClaims >= 3) {
      fraudScore += 0.3;
    } else if (pastClaims >= 1) {
      fraudScore += 0.1;
    }

    if (!constatData) {
      fraudScore += 0.2;
    } else if (!Array.isArray(constatData.constat_parties) || constatData.constat_parties.length < 2) {
      fraudScore += 0.1;
    }

    if (!pvPoliceData) {
      fraudScore += 0.15;
    }

    if (!damageData.aggregated) {
      fraudScore += 0.1;
    }

    const riskLevel: 'low' | 'medium' | 'high' =
      fraudScore >= 0.6 ? 'high' : fraudScore >= 0.3 ? 'medium' : 'low';

    if (!contract) {
      return {
        decision: 'review',
        risk_level: riskLevel,
        fraud_score: Number(fraudScore.toFixed(2)),
        recommended_payout: 0,
        reasoning: 'Contrat introuvable. Vérification manuelle requise.',
      };
    }

    const estimatedTotalCost = Number(
      (damageData.agentDecision as any)?.estimatedTotalCostTnd ??
        (damageData.aggregated as any)?.avg_severity ??
        0,
    );
    const coverage = Number(contract.valeur_estimee ?? contract.montant_declare ?? 0);
    const recommendedPayout = Math.max(0, Math.min(estimatedTotalCost, coverage * 0.8 || estimatedTotalCost));

    if (fraudScore >= 0.6) {
      return {
        decision: 'reject',
        risk_level: riskLevel,
        fraud_score: Number(fraudScore.toFixed(2)),
        recommended_payout: 0,
        reasoning: 'Le dossier présente un niveau de risque élevé et doit être revu par un agent.',
      };
    }

    if (riskLevel === 'medium') {
      return {
        decision: 'review',
        risk_level: riskLevel,
        fraud_score: Number(fraudScore.toFixed(2)),
        recommended_payout: Number(recommendedPayout.toFixed(2)),
        reasoning:
          'Le dossier est consolidé mais certains signaux nécessitent une validation humaine avant décision finale.',
      };
    }

    return {
      decision: 'approve',
      risk_level: riskLevel,
      fraud_score: Number(fraudScore.toFixed(2)),
      recommended_payout: Number(recommendedPayout.toFixed(2)),
      reasoning:
        'Le dossier est consolidé, les justificatifs sont cohérents et les résultats IA sont prêts pour la prise de décision.',
    };
  }
}
