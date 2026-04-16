import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

const OFFER_FACTORS = {
  Serenite: 0.02,
  'Securite+': 0.025,
  'Super Securite': 0.03,
  Securite: 0.015,
};

@Injectable()
export class EstimateService {
  private openai: OpenAI;

  constructor(private config: ConfigService) {
    const apiKey = this.config.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not defined in environment variables');
    }
    this.openai = new OpenAI({ apiKey });
  }

  async estimateVehicleWithAI({ marque, modele, age, kilometrage, serie }: {
    marque: string;
    modele: string;
    age: number;
    kilometrage: number;
    serie: string;
  }): Promise<{ estimatedValue: number; confidence: number; reason: string }> {
    const prompt = `Tu es un expert automobile.\n\nEstime la valeur actuelle d'une voiture avec les informations suivantes :\n- Marque : ${marque}\n- Modèle : ${modele}\n- Age : ${age} ans\n- Kilométrage : ${kilometrage} km\n- Série : ${serie}\n\nRetourne la valeur en dinars tunisiens (TND), arrondie au Dinar le plus proche.\nRéponds strictement en JSON, sans balises markdown, format : {\n  "estimatedValue": number,\n  "confidence": number (0-1),\n  "reason": "..."\n}`;

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
      return {
        estimatedValue: parsed.estimatedValue,
        confidence: parsed.confidence,
        reason: parsed.reason,
      };
    } catch (err) {
      throw new Error(`Erreur parse AI response: ${text}`);
    }
  }

  calculatePremium(estimatedValue: number, declaredAmount?: number, offerType?: string): number {
    const normalizedOffer = offerType && (offerType in OFFER_FACTORS) ? (offerType as keyof typeof OFFER_FACTORS) : undefined;
    const factor = (normalizedOffer ? OFFER_FACTORS[normalizedOffer] : undefined) ?? 0.02;

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
    const aiRes = await this.estimateVehicleWithAI(data);

    let warning: string | null = null;
    if (data.montantDeclare && data.montantDeclare > aiRes.estimatedValue * 1.2) {
      warning = 'Montant trop élevé';
    } else if (data.montantDeclare && data.montantDeclare < aiRes.estimatedValue * 0.5) {
      warning = 'Montant trop faible';
    }

    const prime = this.calculatePremium(aiRes.estimatedValue, data.montantDeclare, data.offer);

    return {
      estimatedValue: aiRes.estimatedValue,
      confidence: aiRes.confidence,
      reason: aiRes.reason,
      prime,
      warning,
    };
  }
}
