import { useMutation } from "@tanstack/react-query";
import { estimateVehicle, type VehicleEstimatePayload } from "@/services/vehicle-estimate.service";

export function useVehicleEstimate() {
  return useMutation({
    mutationFn: (payload: VehicleEstimatePayload) => estimateVehicle(payload),
  });
}
