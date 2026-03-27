import { apiRequest } from "@/lib/api-client";

export type VehicleEstimatePayload = {
  marque: string;
  modele: string;
  serie: string;
  age: number;
  kilometrage: number;
  montantDeclare?: number;
  offer: string;
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
