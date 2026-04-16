import { Injectable } from '@nestjs/common';
import {
  DamageAgentEnvelope,
  DamageAgentState,
  DamageAnalysisOutput,
  DamageAnalysisResult,
  DamageSeverityBand,
} from './damage-agent.types';

@Injectable()
export class DamageAgentStateBuilder {
  buildFromAnalysis(analysis: DamageAnalysisOutput): DamageAgentEnvelope {
    const damages = analysis.results ?? [];
    const summary = analysis.summary;

    const state: DamageAgentState = {
      damages,
      summary,
      hasDamage: damages.length > 0,
      damageCount: damages.length,
      dominantDamageClass: this.findDominantDamageClass(damages),
      severityBand: this.toSeverityBand(summary.max_severity),
      highestConfidenceDamage: this.findHighestConfidenceDamage(damages),
      requiresHumanReview: this.requiresHumanReview(summary.max_severity, damages),
      nextAction: this.resolveNextAction(damages.length, summary.max_severity),
    };

    return {
      agent_state: state,
      summary,
      results: damages,
      assets: {
        annotated_image_base64: analysis.annotated_image_base64,
        annotated_image_mime_type: analysis.annotated_image_mime_type,
      },
    };
  }

  private findDominantDamageClass(damages: DamageAnalysisResult[]): string | null {
    if (damages.length === 0) {
      return null;
    }

    const counts = new Map<string, number>();
    for (const damage of damages) {
      counts.set(damage.class, (counts.get(damage.class) ?? 0) + 1);
    }

    let dominantClass: string | null = null;
    let dominantCount = -1;

    for (const [damageClass, count] of counts.entries()) {
      if (count > dominantCount) {
        dominantClass = damageClass;
        dominantCount = count;
      }
    }

    return dominantClass;
  }

  private findHighestConfidenceDamage(
    damages: DamageAnalysisResult[],
  ): DamageAnalysisResult | null {
    if (damages.length === 0) {
      return null;
    }

    return damages.reduce((best, current) =>
      current.confidence > best.confidence ? current : best,
    );
  }

  private toSeverityBand(maxSeverity: number): DamageSeverityBand {
    if (maxSeverity <= 0) {
      return 'none';
    }
    if (maxSeverity < 25) {
      return 'low';
    }
    if (maxSeverity < 50) {
      return 'medium';
    }
    if (maxSeverity < 75) {
      return 'high';
    }
    return 'critical';
  }

  private requiresHumanReview(
    maxSeverity: number,
    damages: DamageAnalysisResult[],
  ): boolean {
    if (damages.length === 0) {
      return false;
    }

    if (maxSeverity >= 50) {
      return true;
    }

    return damages.some((damage) => damage.confidence < 0.7);
  }

  private resolveNextAction(
    damageCount: number,
    maxSeverity: number,
  ): DamageAgentState['nextAction'] {
    if (damageCount === 0) {
      return 'no_damage_detected';
    }

    if (maxSeverity >= 50) {
      return 'request_manual_review';
    }

    return 'await_rules_engine';
  }
}
