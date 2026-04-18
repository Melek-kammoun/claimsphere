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

type OfferKey =
  | 'super_securite'
  | 'securite_plus'
  | 'securite'
  | 'serenite'
  | 'unknown';

type CoherenceSeverity = 'low' | 'medium' | 'high';

type CoherenceFinding = {
  code: string;
  severity: CoherenceSeverity;
  score_impact: number;
  message: string;
  sources: string[];
};

type OfferCoverageAnalysis = {
  offer_key: OfferKey;
  offer_title: string;
  claim_type: string;
  guarantees_considered: string[];
  covered: boolean;
  eligible_for_reimbursement: boolean;
  matched_guarantees: string[];
  missing_requirements: string[];
  coverage_reason: string;
  payout_cap_ratio: number;
};

type AgentAction = {
  action:
    | 'approve'
    | 'reject'
    | 'request_documents'
    | 'manual_review'
    | 'request_more_evidence';
  reason: string;
  documents_to_request: string[];
};

export interface OrchestratorDecision {
  decision: 'approve' | 'reject' | 'review';
  risk_level: 'low' | 'medium' | 'high';
  fraud_score: number;
  coherence_score: number;
  recommended_payout: number;
  reasoning: string;
  agent_recommendation: AgentAction;
}

export interface ConsolidatedClaimResult {
  claim_id: string;
  consolidated_claim_data: {
    claim: Claim;
    contract: Record<string, unknown> | null;
    constat: {
      id: string | null;
      status: string | null;
      accident: Record<string, unknown> | null;
      client_party: ConstatParty | null;
      second_party: ConstatParty | null;
    };
    ocr: {
      pv_police: Record<string, unknown> | null;
      rapport_expert: Record<string, unknown> | null;
      devis: Record<string, unknown> | null;
    };
    damage: {
      per_image: Array<Record<string, unknown>>;
      aggregated: Record<string, unknown> | null;
      agent_decision: Record<string, unknown> | null;
    };
  };
  ai_insights: {
    ocr: {
      pv_police: Record<string, unknown> | null;
      rapport_expert: Record<string, unknown> | null;
      devis: Record<string, unknown> | null;
    };
    damage: {
      per_image: Array<Record<string, unknown>>;
      aggregated: Record<string, unknown> | null;
      decision: Record<string, unknown> | null;
    };
    coherence_checks: CoherenceFinding[];
    offer_coverage: OfferCoverageAnalysis;
  };
  decision_support: OrchestratorDecision;
}

const OFFER_RULES: Record<
  Exclude<OfferKey, 'unknown'>,
  {
    title: string;
    guarantees: string[];
    payoutCapRatio: number;
  }
> = {
  super_securite: {
    title: 'Super Sécurité',
    payoutCapRatio: 0.9,
    guarantees: [
      'Défense et Recours (CAS)',
      'Responsabilité civile',
      'Incendie',
      'Vol',
      'Accident corporel du conducteur',
      'Événements climatiques',
      'Grèves, émeutes et mouvements populaires',
      'Personnes Transportées (PTA)',
      'Bris de glace',
      'Dommages Collision',
      'Assistance Gold',
    ],
  },
  securite_plus: {
    title: 'Sécurité+',
    payoutCapRatio: 0.85,
    guarantees: [
      'Défense et Recours (CAS)',
      'Responsabilité civile',
      'Incendie',
      'Vol',
      'Accident corporel du conducteur',
      'Événements climatiques',
      'Dommages Collision',
      'Personnes Transportées (PTA)',
      'Bris de glace',
      'Assistance Gold',
    ],
  },
  securite: {
    title: 'Sécurité',
    payoutCapRatio: 0.75,
    guarantees: [
      'Responsabilité civile',
      'Défense et Recours (CAS)',
      'Incendie',
      'Vol',
      'Accident corporel du conducteur',
      'Personnes Transportées (PTA)',
      'Assistance Gold',
      'Bris de glace',
    ],
  },
  serenite: {
    title: 'Sérénité',
    payoutCapRatio: 0.8,
    guarantees: [
      'Incendie',
      'Vol',
      'Accident corporel du conducteur',
      'Événements climatiques',
      'Responsabilité civile',
      'Défense et Recours (CAS)',
      'Dommages Tierce',
      'Personnes Transportées (PTA)',
      'Bris de glace',
      'Grèves, émeutes et mouvements populaires',
    ],
  },
};

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

    const [constatData, pvPoliceData, rapportExpertData, devisData, imageDocuments] =
      await Promise.all([
        this.fetchConstatData(claim.id),
        this.fetchPvPolice(claim.id),
        this.fetchRapportExpert(claim.id),
        this.fetchDevis(claim.id),
        this.documentsService.findByClaimId(claim.id),
      ]);

    const previousDamage =
      (claim.documents as Record<string, any> | null)?.consolidated_result?.consolidated_claim_data
        ?.damage ?? null;

    const damageData =
      previousDamage && typeof previousDamage === 'object'
        ? {
            perImage: Array.isArray((previousDamage as any).per_image)
              ? (previousDamage as any).per_image
              : [],
            aggregated: (previousDamage as any).aggregated ?? null,
            agentDecision: (previousDamage as any).agent_decision ?? null,
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
      rapportExpertData,
      devisData,
      damageData,
    });
  }

  private async buildAndPersistResult(input: {
    claim: Claim;
    constatData: any;
    pvPoliceData: Record<string, unknown> | null;
    rapportExpertData?: Record<string, unknown> | null;
    devisData?: Record<string, unknown> | null;
    damageData: {
      perImage: Array<Record<string, unknown>>;
      aggregated: Record<string, unknown> | null;
      agentDecision: Record<string, unknown> | null;
      documentIds: string[];
    };
  }): Promise<ConsolidatedClaimResult> {
    const contract = await this.fetchContract(input.claim.contract_id);
    const rapportExpertData =
      input.rapportExpertData ?? (await this.fetchRapportExpert(input.claim.id));
    const devisData = input.devisData ?? (await this.fetchDevis(input.claim.id));

    const clientParty =
      input.constatData?.constat_parties?.find((party: ConstatParty) => party.role === 'A') ?? null;
    const secondParty =
      input.constatData?.constat_parties?.find((party: ConstatParty) => party.role === 'B') ?? null;

    const coherenceChecks = this.buildCoherenceChecks({
      claim: input.claim,
      constatData: input.constatData,
      clientParty,
      secondParty,
      pvPoliceData: input.pvPoliceData,
      damageData: input.damageData,
    });

    const offerCoverage = this.buildOfferCoverageAnalysis(
      input.claim,
      contract,
      input.pvPoliceData,
      rapportExpertData,
      devisData,
      input.damageData,
      secondParty,
    );

    const decision = await this.computeDecisionSupport({
      claim: input.claim,
      contract,
      coherenceChecks,
      offerCoverage,
      secondParty,
      rapportExpertData,
      devisData,
      pvPoliceData: input.pvPoliceData,
      damageData: input.damageData,
    });

    const result: ConsolidatedClaimResult = {
      claim_id: input.claim.id,
      consolidated_claim_data: {
        claim: input.claim,
        contract,
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
          rapport_expert: rapportExpertData,
          devis: devisData,
        },
        damage: {
          per_image: input.damageData.perImage,
          aggregated: input.damageData.aggregated,
          agent_decision: input.damageData.agentDecision,
        },
      },
      ai_insights: {
        ocr: {
          pv_police: input.pvPoliceData,
          rapport_expert: rapportExpertData,
          devis: devisData,
        },
        damage: {
          per_image: input.damageData.perImage,
          aggregated: input.damageData.aggregated,
          decision: input.damageData.agentDecision,
        },
        coherence_checks: coherenceChecks,
        offer_coverage: offerCoverage,
      },
      decision_support: decision,
    };

    const previousDocuments = (input.claim.documents as Record<string, unknown> | null) ?? {};
    const nextWorkflowData = {
      ...previousDocuments,
      workflow_status: 'completed',
      processed_at: new Date().toISOString(),
      document_ids: input.damageData.documentIds,
      consolidated_result: result,
    };

    await this.claimsService.updateAiSuggestion(
      input.claim.id,
      this.buildAgentSuggestion(decision, coherenceChecks, offerCoverage),
    );

    await this.claimsService.updateWorkflowData(input.claim.id, nextWorkflowData);
    await this.aiScoresService.upsertForClaim(
      input.claim.id,
      decision.fraud_score,
      decision.risk_level,
    );

    if (input.claim.status === 'documents_requested') {
      await this.claimsService.updateStatus(input.claim.id, 'in_review');
    }

    if (decision.agent_recommendation.action === 'request_documents') {
      void this.notificationsService.create({
        user_id: input.claim.user_id,
        message: `Documents complémentaires recommandés pour ${input.claim.reference}: ${decision.agent_recommendation.documents_to_request.join(', ')}.`,
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
      const documents = await this.ocrService.getAllPvPolice();
      const matched = documents.find((item) => item.claim_id === claimId);
      return matched ? (matched.parsed_data ?? null) : null;
    } catch {
      return null;
    }
  }

  private async fetchRapportExpert(claimId: string): Promise<Record<string, unknown> | null> {
    try {
      const documents = await this.ocrService.getAllRapportExpert();
      const matched = documents.find((item) => item.claim_id === claimId);
      return matched ? (matched.parsed_data ?? null) : null;
    } catch {
      return null;
    }
  }

  private async fetchDevis(claimId: string): Promise<Record<string, unknown> | null> {
    try {
      const documents = await this.ocrService.getAllDevis();
      const matched = documents.find((item) => item.claim_id === claimId);
      return matched ? (matched.parsed_data ?? null) : null;
    } catch {
      return null;
    }
  }

  private async fetchContract(contractId: string | null): Promise<Record<string, unknown> | null> {
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
      return data ?? null;
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

  private buildCoherenceChecks(input: {
    claim: Claim;
    constatData: any;
    clientParty: ConstatParty | null;
    secondParty: ConstatParty | null;
    pvPoliceData: Record<string, unknown> | null;
    damageData: {
      aggregated: Record<string, unknown> | null;
      agentDecision: Record<string, unknown> | null;
    };
  }): CoherenceFinding[] {
    const findings: CoherenceFinding[] = [];
    const claimDate = this.toDateOnly(input.claim.date);
    const constatDate = this.toDateOnly(input.constatData?.date_accident);
    const pvDate = this.toDateOnly(input.pvPoliceData?.accident_date);

    if (claimDate && constatDate && claimDate !== constatDate) {
      findings.push({
        code: 'claim_constat_date_mismatch',
        severity: 'medium',
        score_impact: 0.1,
        message: `La date du sinistre (${claimDate}) ne correspond pas à celle du constat (${constatDate}).`,
        sources: ['claim.date', 'constat.date_accident'],
      });
    }

    if (claimDate && pvDate && claimDate !== pvDate) {
      findings.push({
        code: 'claim_pv_date_mismatch',
        severity: 'high',
        score_impact: 0.15,
        message: `La date du sinistre (${claimDate}) est incohérente avec celle du PV police (${pvDate}).`,
        sources: ['claim.date', 'pv_police.accident_date'],
      });
    }

    const claimLocation = this.normalizeText(input.claim.location);
    const constatLocation = this.normalizeText(input.constatData?.lieu_accident);
    const pvLocation = this.normalizeText(input.pvPoliceData?.accident_location);
    if (claimLocation && constatLocation && !this.areTextValuesCompatible(claimLocation, constatLocation)) {
      findings.push({
        code: 'claim_constat_location_mismatch',
        severity: 'medium',
        score_impact: 0.08,
        message: 'Le lieu déclaré dans le dossier ne correspond pas au lieu du constat.',
        sources: ['claim.location', 'constat.lieu_accident'],
      });
    }

    if (claimLocation && pvLocation && !this.areTextValuesCompatible(claimLocation, pvLocation)) {
      findings.push({
        code: 'claim_pv_location_mismatch',
        severity: 'high',
        score_impact: 0.12,
        message: 'Le lieu déclaré dans le dossier diffère de celui figurant sur le PV police.',
        sources: ['claim.location', 'pv_police.accident_location'],
      });
    }

    const declaredVehicle = this.normalizeText(input.claim.vehicle);
    const constatVehicle = this.normalizeText(input.clientParty?.immatriculation);
    const pvVehicle = this.normalizeText(input.pvPoliceData?.vehicle_a_registration);
    if (declaredVehicle && constatVehicle && !this.areTextValuesCompatible(declaredVehicle, constatVehicle)) {
      findings.push({
        code: 'claim_constat_vehicle_mismatch',
        severity: 'high',
        score_impact: 0.15,
        message: 'Le véhicule déclaré ne correspond pas à celui renseigné dans le constat.',
        sources: ['claim.vehicle', 'constat_parties[A].immatriculation'],
      });
    }

    if (declaredVehicle && pvVehicle && !this.areTextValuesCompatible(declaredVehicle, pvVehicle)) {
      findings.push({
        code: 'claim_pv_vehicle_mismatch',
        severity: 'high',
        score_impact: 0.18,
        message: 'Le véhicule déclaré est incohérent avec celui du PV police.',
        sources: ['claim.vehicle', 'pv_police.vehicle_a_registration'],
      });
    }

    if (!input.secondParty && input.claim.type === 'accident') {
      findings.push({
        code: 'missing_second_party_constat',
        severity: 'low',
        score_impact: 0.05,
        message: 'La partie B du constat n’est pas encore renseignée.',
        sources: ['constat_parties[B]'],
      });
    }

    const damageDecision = input.damageData.agentDecision as Record<string, any> | null;
    if (!input.damageData.aggregated) {
      findings.push({
        code: 'missing_damage_analysis',
        severity: 'medium',
        score_impact: 0.1,
        message: 'Aucune analyse exploitable n’a été produite à partir des images du sinistre.',
        sources: ['damage_analysis'],
      });
    } else if (
      input.claim.type === 'bris' &&
      !this.normalizeText(input.damageData.aggregated?.global_label).includes('glass')
    ) {
      findings.push({
        code: 'claim_type_damage_mismatch',
        severity: 'medium',
        score_impact: 0.1,
        message:
          'Le type de sinistre déclaré est un bris de glace mais les images ne montrent pas clairement un dommage de vitrage.',
        sources: ['claim.type', 'damage_analysis.summary.global_label'],
      });
    }

    if (
      damageDecision?.decision === 'manual_review' &&
      Number(damageDecision?.confidence ?? 0) < 0.55
    ) {
      findings.push({
        code: 'low_damage_confidence',
        severity: 'medium',
        score_impact: 0.08,
        message: 'L’analyse des dommages a une faible confiance et nécessite un contrôle humain.',
        sources: ['damage_agent.confidence'],
      });
    }

    return findings;
  }

  private buildOfferCoverageAnalysis(
    claim: Claim,
    contract: Record<string, unknown> | null,
    pvPoliceData: Record<string, unknown> | null,
    rapportExpertData: Record<string, unknown> | null,
    devisData: Record<string, unknown> | null,
    damageData: {
      aggregated: Record<string, unknown> | null;
      agentDecision: Record<string, unknown> | null;
    },
    secondParty: ConstatParty | null,
  ): OfferCoverageAnalysis {
    const offerKey = this.normalizeOfferKey(contract?.type);
    const offer = offerKey === 'unknown' ? null : OFFER_RULES[offerKey];
    const claimType = this.normalizeText(claim.type);
    const guarantees = offer?.guarantees ?? [];

    const matchedGuarantees =
      claimType === 'vol'
        ? guarantees.filter((item) => this.normalizeText(item).includes('vol'))
        : claimType === 'incendie'
          ? guarantees.filter((item) => this.normalizeText(item).includes('incendie'))
          : claimType === 'bris'
            ? guarantees.filter((item) => this.normalizeText(item).includes('bris'))
            : claimType === 'accident'
              ? guarantees.filter((item) => {
                  const normalized = this.normalizeText(item);
                  return normalized.includes('collision') || normalized.includes('tierce');
                })
              : guarantees.filter((item) => this.normalizeText(item).includes(claimType));

    const missingRequirements: string[] = [];
    if (claimType === 'accident' && !secondParty) {
      missingRequirements.push('Constat partie B');
    }

    const estimatedCost = Number(
      (damageData.agentDecision as any)?.estimatedTotalCostTnd ??
        rapportExpertData?.repair_value_estimate ??
        devisData?.total_ttc ??
        0,
    );

    if (estimatedCost > 4000 && !rapportExpertData) {
      missingRequirements.push('Rapport expert');
    }

    if (estimatedCost > 1500 && !devisData) {
      missingRequirements.push('Devis garage');
    }

    const covered = matchedGuarantees.length > 0;
    const eligibleForReimbursement = covered && missingRequirements.length === 0;

    let coverageReason = covered
      ? `L’offre ${offer?.title ?? 'du contrat'} couvre ce type de sinistre via ${matchedGuarantees.join(', ')}.`
      : 'Aucune garantie claire du contrat ne couvre ce type de sinistre.';

    const responsibility = this.normalizeText(pvPoliceData?.responsibility);
    if (claimType === 'accident' && responsibility === 'a' && matchedGuarantees.length === 0) {
      coverageReason =
        'Le client semble responsable selon le PV police et le contrat ne contient pas de garantie collision/tierce exploitable.';
    }

    return {
      offer_key: offerKey,
      offer_title: offer?.title ?? String(contract?.type ?? 'Offre inconnue'),
      claim_type: claim.type,
      guarantees_considered: guarantees,
      covered,
      eligible_for_reimbursement: eligibleForReimbursement,
      matched_guarantees: matchedGuarantees,
      missing_requirements: missingRequirements,
      coverage_reason: coverageReason,
      payout_cap_ratio: offer?.payoutCapRatio ?? 0.7,
    };
  }

  private async computeDecisionSupport(input: {
    claim: Claim;
    contract: Record<string, unknown> | null;
    coherenceChecks: CoherenceFinding[];
    offerCoverage: OfferCoverageAnalysis;
    secondParty: ConstatParty | null;
    rapportExpertData: Record<string, unknown> | null;
    devisData: Record<string, unknown> | null;
    pvPoliceData: Record<string, unknown> | null;
    damageData: {
      aggregated: Record<string, unknown> | null;
      agentDecision: Record<string, unknown> | null;
    };
  }): Promise<OrchestratorDecision> {
    let fraudScore = 0;

    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const pastClaims = await this.claimsRepo
      .createQueryBuilder('c')
      .where('c.user_id = :uid', { uid: input.claim.user_id })
      .andWhere('c.created_at > :since', { since: oneYearAgo })
      .andWhere('c.id != :id', { id: input.claim.id })
      .getCount();

    if (pastClaims >= 3) fraudScore += 0.25;
    else if (pastClaims >= 1) fraudScore += 0.08;

    fraudScore += input.coherenceChecks.reduce((sum, item) => sum + item.score_impact, 0);

    if (!input.pvPoliceData) {
      fraudScore += 0.12;
    }

    if (!input.damageData.aggregated) {
      fraudScore += 0.1;
    }

    if (!input.offerCoverage.covered) {
      fraudScore += 0.1;
    }

    const coherenceScore = Math.max(
      0,
      Math.min(
        1,
        1 - input.coherenceChecks.reduce((sum, item) => sum + item.score_impact, 0),
      ),
    );

    const riskLevel: 'low' | 'medium' | 'high' =
      fraudScore >= 0.6 ? 'high' : fraudScore >= 0.3 ? 'medium' : 'low';

    const estimatedTotalCost = Number(
      (input.damageData.agentDecision as any)?.estimatedTotalCostTnd ??
        input.rapportExpertData?.repair_value_estimate ??
        input.devisData?.total_ttc ??
        0,
    );
    const offerCapRatio = input.offerCoverage.payout_cap_ratio || 0.7;
    const declaredAmount = Number(
      input.contract?.valeur_estimee ??
        input.contract?.montant_declare ??
        input.claim.amount ??
        estimatedTotalCost,
    );
    const recommendedPayout = Math.max(
      0,
      Math.min(estimatedTotalCost || declaredAmount, declaredAmount * offerCapRatio),
    );

    if (!input.contract) {
      return {
        decision: 'review',
        risk_level: riskLevel,
        fraud_score: Number(fraudScore.toFixed(2)),
        coherence_score: Number(coherenceScore.toFixed(2)),
        recommended_payout: 0,
        reasoning: 'Contrat introuvable. Vérification manuelle requise.',
        agent_recommendation: {
          action: 'manual_review',
          reason: 'Contrat absent dans la base.',
          documents_to_request: [],
        },
      };
    }

    if (!input.offerCoverage.covered) {
      return {
        decision: 'reject',
        risk_level: riskLevel,
        fraud_score: Number(Math.min(1, fraudScore + 0.05).toFixed(2)),
        coherence_score: Number(coherenceScore.toFixed(2)),
        recommended_payout: 0,
        reasoning: `${input.offerCoverage.coverage_reason} Aucun remboursement n’est recommandé dans l’état actuel.`,
        agent_recommendation: {
          action: 'reject',
          reason: input.offerCoverage.coverage_reason,
          documents_to_request: [],
        },
      };
    }

    if (input.offerCoverage.missing_requirements.length > 0) {
      return {
        decision: 'review',
        risk_level: riskLevel,
        fraud_score: Number(fraudScore.toFixed(2)),
        coherence_score: Number(coherenceScore.toFixed(2)),
        recommended_payout: Number(recommendedPayout.toFixed(2)),
        reasoning:
          `Le dossier peut être indemnisable mais il manque des pièces pour sécuriser la décision: ${input.offerCoverage.missing_requirements.join(', ')}.`,
        agent_recommendation: {
          action: 'request_documents',
          reason: 'Le puzzle du sinistre n’est pas encore complet pour statuer.',
          documents_to_request: input.offerCoverage.missing_requirements,
        },
      };
    }

    if (riskLevel === 'high') {
      return {
        decision: 'reject',
        risk_level: riskLevel,
        fraud_score: Number(fraudScore.toFixed(2)),
        coherence_score: Number(coherenceScore.toFixed(2)),
        recommended_payout: 0,
        reasoning:
          'Le dossier présente plusieurs incohérences majeures entre le constat, le PV police et les images. Une décision positive n’est pas recommandée.',
        agent_recommendation: {
          action: 'manual_review',
          reason: 'Vérifier les incohérences avant toute indemnisation.',
          documents_to_request: ['Rapport expert', 'Devis garage'],
        },
      };
    }

    if (riskLevel === 'medium') {
      return {
        decision: 'review',
        risk_level: riskLevel,
        fraud_score: Number(fraudScore.toFixed(2)),
        coherence_score: Number(coherenceScore.toFixed(2)),
        recommended_payout: Number(recommendedPayout.toFixed(2)),
        reasoning:
          'Le dossier est globalement exploitable mais certaines incohérences appellent une validation agent avant remboursement.',
        agent_recommendation: {
          action: 'manual_review',
          reason: 'Analyser les écarts signalés dans les contrôles de cohérence.',
          documents_to_request: [],
        },
      };
    }

    return {
      decision: 'approve',
      risk_level: riskLevel,
      fraud_score: Number(fraudScore.toFixed(2)),
      coherence_score: Number(coherenceScore.toFixed(2)),
      recommended_payout: Number(recommendedPayout.toFixed(2)),
      reasoning:
        'Le dossier est cohérent, l’offre couvre le sinistre et les éléments reçus permettent de proposer un remboursement.',
      agent_recommendation: {
        action: 'approve',
        reason: `Proposer un remboursement de ${recommendedPayout.toFixed(2)} TND selon les garanties du contrat.`,
        documents_to_request: [],
      },
    };
  }

  private buildAgentSuggestion(
    decision: OrchestratorDecision,
    coherenceChecks: CoherenceFinding[],
    offerCoverage: OfferCoverageAnalysis,
  ): string {
    const findingsText =
      coherenceChecks.length > 0
        ? `Incohérences détectées: ${coherenceChecks.map((item) => item.message).join(' | ')}.`
        : 'Aucune incohérence majeure détectée.';

    const nextStep =
      decision.agent_recommendation.action === 'request_documents'
        ? `Demander au client: ${decision.agent_recommendation.documents_to_request.join(', ')}.`
        : decision.agent_recommendation.action === 'reject'
          ? 'Refuser le dossier.'
          : decision.agent_recommendation.action === 'approve'
            ? `Proposer un remboursement de ${decision.recommended_payout} TND.`
            : 'Faire une revue manuelle détaillée.';

    return `${offerCoverage.coverage_reason} ${findingsText} Action recommandée pour l’agent: ${nextStep}`;
  }

  private normalizeOfferKey(value: unknown): OfferKey {
    const normalized = this.normalizeText(value);
    if (normalized.includes('super') && normalized.includes('secur')) return 'super_securite';
    if (normalized.includes('securite+') || normalized.includes('securite plus')) return 'securite_plus';
    if (normalized === 'securite') return 'securite';
    if (normalized.includes('seren')) return 'serenite';
    return 'unknown';
  }

  private normalizeText(value: unknown): string {
    return String(value ?? '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  }

  private areTextValuesCompatible(left: string, right: string): boolean {
    return left.includes(right) || right.includes(left);
  }

  private toDateOnly(value: unknown): string | null {
    if (!value) return null;
    const date = new Date(String(value));
    if (Number.isNaN(date.getTime())) {
      const raw = String(value).trim();
      return raw || null;
    }
    return date.toISOString().slice(0, 10);
  }
}
