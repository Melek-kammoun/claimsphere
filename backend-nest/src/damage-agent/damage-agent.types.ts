export type DamageAnalysisResult = {
  class: string;
  confidence: number;
  severity: number;
  label: string;
  bbox?: number[];
};

export type DamageAnalysisSummary = {
  total_damages: number;
  max_severity: number;
  avg_severity: number;
  global_label: string;
};

export type DamageAnalysisOutput = {
  results: DamageAnalysisResult[];
  summary: DamageAnalysisSummary;
  annotated_image_base64?: string;
  annotated_image_mime_type?: string;
};

export type DamageSeverityBand = 'none' | 'low' | 'medium' | 'high' | 'critical';

export type DamageAgentState = {
  damages: DamageAnalysisResult[];
  summary: DamageAnalysisSummary;
  hasDamage: boolean;
  damageCount: number;
  dominantDamageClass: string | null;
  severityBand: DamageSeverityBand;
  highestConfidenceDamage: DamageAnalysisResult | null;
  requiresHumanReview: boolean;
  nextAction: 'await_rules_engine' | 'request_manual_review' | 'no_damage_detected';
};

export type DamageAgentDecision = {
  decision: 'repair' | 'no_repair' | 'manual_review';
  estimatedTotalCostTnd: number;
  confidence: number;
  reason: string;
  damages: Array<{
    class: string;
    severity: string;
    estimatedPriceTnd: number | null;
    recommendation: string;
  }>;
};

export type VehicleDetails = {
  brand?: string;
  model?: string;
  year?: number;
  age?: number;
  kilometrage?: number;
  serie?: string | number;
  num_voiture?: string | number;
};

export type DamageAgentEnvelope = {
  agent_state: DamageAgentState;
  summary: DamageAnalysisSummary;
  results: DamageAnalysisResult[];
  assets: {
    annotated_image_base64?: string;
    annotated_image_mime_type?: string;
  };
};
