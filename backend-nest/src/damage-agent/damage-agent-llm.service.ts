import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { readFileSync } from 'fs';
import { join } from 'path';
import OpenAI from 'openai';
import {
  DamageAnalysisOutput,
  DamageAgentDecision,
  VehicleDetails,
} from './damage-agent.types';
 
type DatasetRow = {
  brand: string;
  model: string;
  year: number;
  damage_class: string;
  severity: string;
  price_tnd: number;
};
 
@Injectable()
export class DamageAgentLLMService {
  private openai: OpenAI;
  private dataset: DatasetRow[] = [];
 
  constructor(private config: ConfigService) {
    const apiKey = this.config.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not defined in environment variables');
    }
    this.openai = new OpenAI({ apiKey });
    this.loadDataset();
  }
 
  private loadDataset() {
    const datasetPath = join(process.cwd(), 'src', 'damage-agent', 'data', 'car_damage_dataset.csv');
    const raw = readFileSync(datasetPath, 'utf8');
    const lines = raw.split(/\r?\n/).filter((line) => line.trim().length > 0);
    const rows = lines.slice(1).map((line) => {
      const [brand, model, year, damage_class, severity, price_tnd] = line.split(',');
      return {
        brand: brand?.trim() ?? '',
        model: model?.trim() ?? '',
        year: Number(year?.trim() ?? '0'),
        damage_class: damage_class?.trim() ?? '',
        severity: severity?.trim().toLowerCase() ?? '',
        price_tnd: Number(price_tnd?.trim() ?? '0'),
      } as DatasetRow;
    });
    this.dataset = rows.filter((row) => row.damage_class && row.severity && !Number.isNaN(row.price_tnd));
  }
 
  private normalizeSeverity(label: string, severityValue: number): 'light' | 'moderate' | 'severe' {
    const normalized = label?.trim().toLowerCase();
    if (normalized.includes('severe') || normalized.includes('sévère') || severityValue >= 50) {
      return 'severe';
    }
    if (normalized.includes('mod') || normalized.includes('moy') || (severityValue >= 25 && severityValue < 50)) {
      return 'moderate';
    }
    return 'light';
  }
 
  private findDatasetMatches(
    vehicle: VehicleDetails | undefined,
    damageClass: string,
    severity: string,
  ): DatasetRow[] {
    const normalizedClass = damageClass.trim().toLowerCase();
    const candidates = this.dataset.filter((row) => {
      const rowClass = row.damage_class.trim().toLowerCase();
      const severityMatch = row.severity === severity;
      const classMatch = rowClass === normalizedClass;
      if (!classMatch) {
        return false;
      }
      if (vehicle?.brand && vehicle?.model && vehicle?.year) {
        return (
          row.brand.trim().toLowerCase() === vehicle.brand.trim().toLowerCase() &&
          row.model.trim().toLowerCase() === vehicle.model.trim().toLowerCase() &&
          row.year === vehicle.year
        );
      }
      return severityMatch;
    });
 
    if (candidates.length > 0) {
      return candidates;
    }
 
    const fallback = this.dataset.filter(
      (row) =>
        row.damage_class.trim().toLowerCase() === normalizedClass && row.severity === severity,
    );
 
    if (fallback.length > 0) {
      return fallback;
    }
 
    return this.dataset
      .filter((row) => row.damage_class.trim().toLowerCase() === normalizedClass)
      .slice(0, 5);
  }
 
  private buildDatasetSummary(
    analysis: DamageAnalysisOutput,
    vehicle?: VehicleDetails,
  ): string {
    return analysis.results
      .map((damage, index) => {
        const normalizedSeverity = this.normalizeSeverity(damage.label, damage.severity);
        const matches = this.findDatasetMatches(vehicle, damage.class, normalizedSeverity);
        if (matches.length === 0) {
          return `- ${index + 1}. ${damage.class} (${damage.label}) : aucune ligne trouvée dans le dataset pour ${vehicle?.brand ?? 'vehicle'} ${vehicle?.model ?? ''} ${vehicle?.year ?? ''} / severity=${normalizedSeverity}.`;
        }
 
        const rowsText = matches
          .slice(0, 3)
          .map(
            (match) =>
              `    • ${match.brand} ${match.model} ${match.year} - ${match.damage_class} - ${match.severity} -> ${match.price_tnd} TND`,
          )
          .join('\n');
 
        return `- ${index + 1}. ${damage.class} (${damage.label}, gravité=${normalizedSeverity}) :
${rowsText}`;
      })
      .join('\n');
  }
 
  private buildVehicleText(vehicle?: VehicleDetails): string {
    if (!vehicle) {
      return '';
    }
 
    const details = [
      vehicle.brand ? `Marque: ${vehicle.brand}` : null,
      vehicle.model ? `Modèle: ${vehicle.model}` : null,
      vehicle.year ? `Année estimée: ${vehicle.year}` : null,
      vehicle.age ? `Age: ${vehicle.age} ans` : null,
      vehicle.kilometrage ? `Kilométrage: ${vehicle.kilometrage} km` : null,
      vehicle.serie ? `Série: ${vehicle.serie}` : null,
      vehicle.num_voiture ? `Numéro de voiture: ${vehicle.num_voiture}` : null,
    ]
      .filter(Boolean)
      .join('\n');
 
    return details ? `Détails du véhicule couvert par le contrat :\n${details}\n\n` : '';
  }
 
  private buildPrompt(
    analysis: DamageAnalysisOutput,
    vehicle?: VehicleDetails,
  ): string {
    const vehicleText = this.buildVehicleText(vehicle);
    const datasetSummary = this.buildDatasetSummary(analysis, vehicle);
 
    return `Tu es un expert en carrosserie automobile en Tunisie.
Tu dois aider à décider si les dommages détectés nécessitent une réparation et estimer le coût total.
 
${vehicleText}Données des dommages détectés :
${analysis.results
      .map((damage, index) =>
        `${index + 1}. classe=${damage.class}, confiance=${damage.confidence.toFixed(2)}, gravité=${damage.severity.toFixed(2)}, label=${damage.label}, bbox=${JSON.stringify(
          damage.bbox ?? [],
        )}`,
      )
      .join('\n')}
 
Références du dataset CSV pour la voiture et la gravité :
${datasetSummary}
 
Instructions :
- Utilise prioritairement les correspondances exactes dans le dataset pour le même véhicule, modèle, année et type de dommage.
- Si aucune correspondance exacte n'est trouvée, utilise les dommages similaires du dataset et fais une estimation prudente.
- Estime la gravité finale et le coût total du sinistre en TND.
- Retourne strictement du JSON sans markdown.
- Le JSON doit contenir : decision, estimatedTotalCostTnd, confidence, reason, damages.
- decision doit être une des valeurs : repair, no_repair, manual_review.
- damages doit être un tableau avec pour chaque dommage : class, severity, estimatedPriceTnd, recommendation.
 
Réponds uniquement avec le JSON demandé.`;
  }
 
  async decideDamage(
    analysis: DamageAnalysisOutput,
    vehicle?: VehicleDetails,
  ): Promise<DamageAgentDecision> {
    const prompt = this.buildPrompt(analysis, vehicle);
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [{ role: 'user', content: prompt }],
    });
 
    const content = response?.choices?.[0]?.message?.content;
    if (!content || typeof content !== 'string') {
      throw new Error('Réponse AI invalide : contenu manquant');
    }
 
    let text = content.trim();
    text = text.replace(/^```json\s*/, '').replace(/^```/, '').replace(/```$/, '');
 
    try {
      const parsed = JSON.parse(text);
      return parsed as DamageAgentDecision;
    } catch (err) {
      throw new Error(`Erreur parse AI response: ${text}`);
    }
  }
}
 