import { apiRequest } from "@/lib/api-client";

export type VehicleEstimatePayload = {
  marque: string;
  modele: string;
  serie: string;
  age: number;
  kilometrage: number;
  montantDeclare?: number;
  offer: string;  // FIX: was optional (?), but backend always needs it to pick the right premium factor
};

export type VehicleEstimateResponse = {
  estimatedValue: number;
  confidence: number;
  prime: number;
  warning?: string;
};

export function estimateVehicle(payload: VehicleEstimatePayload) {
  return apiRequest<VehicleEstimateResponse>("/api/estimate-vehicle", {
    method: "POST",
    body: payload,
  });
}