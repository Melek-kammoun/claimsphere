import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

const OFFER_FACTORS: Record<string, number> = {
  Serenite: 0.02,
  'Securite+': 0.025,
  'Super Securite': 0.03,
  Securite: 0.015,
};

// Approximate base prices in TND for common Tunisian market brands
const BASE_PRICES: Record<string, number> = {
  volkswagen: 85000, vw: 85000,
  renault: 70000, peugeot: 72000, citroen: 65000,
  toyota: 90000, hyundai: 78000, kia: 76000,
  mercedes: 160000, bmw: 150000, audi: 140000,
  ford: 75000, fiat: 60000, opel: 68000,
  seat: 72000, dacia: 55000, skoda: 74000,
  suzuki: 68000, mitsubishi: 82000, nissan: 80000,
  honda: 85000, mazda: 80000, volvo: 130000,
};

@Injectable()
export class EstimateService {
  private readonly logger = new Logger(EstimateService.name);
  private openai: OpenAI | null = null;

  constructor(private config: ConfigService) {
    const apiKey = this.config.get<string>('OPENAI_API_KEY');
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
    } else {
      this.logger.warn('OPENAI_API_KEY not set — AI estimation disabled, using formula fallback');
    }
  }

  private formulaEstimate(marque: string, age: number, kilometrage: number): number {
    const normalizedMarque = marque.trim().toLowerCase();
    const basePrice = BASE_PRICES[normalizedMarque] ?? 70000;
    const depreciationFactor = Math.max(0.15, 1 - age * 0.15);
    const expectedKm = age * 15000;
    const mileageRatio = expectedKm > 0 ? kilometrage / expectedKm : 1;
    const mileageFactor = mileageRatio > 1.5 ? 0.85 : mileageRatio > 1.2 ? 0.92 : 1.0;
    return Math.round(basePrice * depreciationFactor * mileageFactor);
  }

  private async estimateWithAI(params: {
    marque: string;
    modele: string;
    age: number;
    kilometrage: number;
    serie: string;
  }): Promise<{ estimatedValue: number; confidence: number; reason: string } | null> {
    if (!this.openai) return null;

    const { marque, modele, age, kilometrage, serie } = params;

    const prompt = [
      'Tu es un expert automobile spécialisé dans le marché tunisien.',
      '',
      'Estime la valeur marchande actuelle (en TND) de ce véhicule :',
      `- Marque : ${marque}`,
      `- Modèle : ${modele}`,
      `- Âge : ${age} ans`,
      `- Kilométrage : ${kilometrage} km`,
      `- Série : ${serie}`,
      '',
      'Réponds UNIQUEMENT avec un objet JSON valide, sans balises markdown ni texte supplémentaire.',
      'Exemple de réponse attendue :',
      '{"estimatedValue": 45000, "confidence": 0.85, "reason": "Véhicule de 5 ans en bon état"}',
    ].join('\n');

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
        max_tokens: 200,
      });

      const content = response?.choices?.[0]?.message?.content?.trim();
      if (!content) {
        this.logger.warn('OpenAI returned empty content');
        return null;
      }

      // Strip any markdown code fences the model may include despite instructions
      const cleaned = content
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();

      const parsed = JSON.parse(cleaned) as { estimatedValue?: unknown; confidence?: unknown; reason?: unknown };

      const estimatedValue = Number(parsed.estimatedValue);
      if (!isFinite(estimatedValue) || estimatedValue <= 0) {
        this.logger.warn(`AI returned invalid estimatedValue: ${String(parsed.estimatedValue)}`);
        return null;
      }

      return {
        estimatedValue,
        confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.7,
        reason: typeof parsed.reason === 'string' ? parsed.reason : '',
      };
    } catch (err) {
      this.logger.warn(`AI estimation failed: ${(err as Error).message}`);
      return null;
    }
  }

  calculatePremium(estimatedValue: number, declaredAmount?: number, offerType?: string): number {
    const factor = OFFER_FACTORS[offerType ?? ''] ?? 0.02;
    let adjustedValue = estimatedValue;
    if (declaredAmount !== undefined && declaredAmount > estimatedValue * 1.2) {
      adjustedValue = estimatedValue * 1.2;
    }
    if (declaredAmount !== undefined && declaredAmount < estimatedValue * 0.5) {
      adjustedValue = estimatedValue * 0.5;
    }
    return Math.round(adjustedValue * factor);
  }

  async estimateVehicle(data: {
    marque: string;
    modele: string;
    age: number;
    kilometrage: number;
    serie: string;
    montantDeclare?: number;
    offer?: string;
  }) {
    const aiResult = await this.estimateWithAI(data);

    const estimatedValue = aiResult?.estimatedValue ?? this.formulaEstimate(data.marque, data.age, data.kilometrage);
    const confidence = aiResult?.confidence ?? 0.6;
    const reason = aiResult?.reason ?? `Estimation basée sur un modèle de dépréciation (${data.marque}, ${data.age} ans, ${data.kilometrage} km)`;
    const source = aiResult ? 'ai' : 'formula';

    let warning: string | null = null;
    if (data.montantDeclare && data.montantDeclare > estimatedValue * 1.2) {
      warning = 'Montant déclaré trop élevé par rapport à la valeur estimée';
    } else if (data.montantDeclare && data.montantDeclare < estimatedValue * 0.5) {
      warning = 'Montant déclaré trop faible par rapport à la valeur estimée';
    }

    const prime = this.calculatePremium(estimatedValue, data.montantDeclare, data.offer);

    this.logger.log(`Estimation [${source}]: ${estimatedValue} TND (confidence: ${confidence})`);

    return { estimatedValue, confidence, reason, prime, warning };
  }
}
