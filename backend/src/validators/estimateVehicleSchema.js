import Joi from "joi";

export const estimateVehicleSchema = Joi.object({
  marque: Joi.string().trim().min(1).max(128).required(),
  modele: Joi.string().trim().min(1).max(128).required(),
  serie: Joi.string().trim().min(1).max(128).required(),
  age: Joi.number().integer().min(0).max(40).required(),
  kilometrage: Joi.number().integer().min(0).max(1_000_000).required(),
  montantDeclare: Joi.number().positive().optional(),
  offer: Joi.string().trim().min(1).max(128).required(),
});
