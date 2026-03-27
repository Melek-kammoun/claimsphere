const OFFER_FACTORS = {
  Serenite: 0.02,
  "Securite+": 0.025,
  "Super Securite": 0.03,
  Securite: 0.015,
};

export function calculatePremium(estimatedValue, declaredAmount, offerType) {
  const factor = OFFER_FACTORS[offerType] || 0.02;

  let adjustedValue = estimatedValue;

  if (typeof declaredAmount === "number" && declaredAmount > estimatedValue * 1.2) {
    adjustedValue = estimatedValue * 1.2;
  }

  if (typeof declaredAmount === "number" && declaredAmount < estimatedValue * 0.5) {
    adjustedValue = estimatedValue * 0.5;
  }

  return Math.round(adjustedValue * factor);
}
