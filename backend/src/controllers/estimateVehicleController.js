import { estimateVehicleWithAI } from "../services/aiEstimateService.js";
import { calculatePremium } from "../services/vehicleEstimateService.js";

export async function estimateVehicleController(req, res, next) {
  try {
    const { marque, modele, age, kilometrage, serie, montantDeclare, offer } = req.body;

    const estimate = await estimateVehicleWithAI({
      marque,
      modele,
      age,
      kilometrage,
      serie,
    });

    let warning;
    if (montantDeclare && montantDeclare > estimate.estimatedValue * 1.2) {
      warning = "Montant trop eleve";
    } else if (montantDeclare && montantDeclare < estimate.estimatedValue * 0.5) {
      warning = "Montant trop faible";
    }

    const prime = calculatePremium(estimate.estimatedValue, montantDeclare, offer);

    return res.status(200).json({
      estimatedValue: estimate.estimatedValue,
      confidence: estimate.confidence,
      prime,
      warning,
    });
  } catch (err) {
    next(err);
  }
}
