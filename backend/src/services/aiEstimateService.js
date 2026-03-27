import OpenAI from "openai";
import { config } from "../config/index.js";

const client = new OpenAI({
  apiKey: config.openaiApiKey,
});

/**
 * Estime la valeur d'un véhicule via OpenAI GPT.
 * Retourne { estimatedValue, confidence, reason } en TND.
 */
export async function estimateVehicleWithAI({ marque, modele, age, kilometrage, serie }) {
  const prompt = `
Tu es un expert automobile.

Estime la valeur actuelle d'une voiture avec les informations suivantes :
- Marque : ${marque}
- Modèle : ${modele}
- Age : ${age} ans
- Kilométrage : ${kilometrage} km
- Série : ${serie}

Retourne la valeur **en dinars tunisiens (TND)**, arrondie au Dinar le plus proche.

Répond strictement en JSON, **sans backticks ni texte supplémentaire**, comme ceci :
{
  "estimatedValue": number,  
  "confidence": number (entre 0 et 1),
  "reason": "explication courte"
}
`;

  const response = await client.chat.completions.create({
    model: "gpt-4.1-mini",
    messages: [{ role: "user", content: prompt }],
  });

  let text = response.choices[0].message.content.trim();

  // Retirer les ```json ou ``` si l'IA envoie du Markdown
  text = text.replace(/^```json\s*/, "").replace(/^```/, "").replace(/```$/, "");

  try {
    return JSON.parse(text);
  } catch (err) {
    console.error("Impossible de parser la réponse AI:", text, err);
    throw new Error("Erreur dans l'estimation AI : réponse non JSON");
  }
}