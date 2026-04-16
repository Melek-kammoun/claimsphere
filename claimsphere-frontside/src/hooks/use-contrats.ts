import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createContrat,
  getAllContrats,
  getContratById,
  getContratsByClientId,
  getPendingContrats,
  updateContratStatus,
  type CreateContratPayload,
  type UpdateContratStatusPayload,
} from "@/services/contrats.service";

export function useCreateContrat() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateContratPayload) => createContrat(payload),
    onSuccess: (contrat) => {
      queryClient.invalidateQueries({ queryKey: ["contrats"] });
      queryClient.invalidateQueries({
        queryKey: ["contrats", "client", contrat.client_id],
      });
      queryClient.invalidateQueries({ queryKey: ["contrats", "pending"] });
    },
  });
}

export function useContrats(status?: string) {
  return useQuery({
    queryKey: ["contrats", { status: status ?? null }],
    queryFn: () => getAllContrats(status),
  });
}

export function usePendingContrats() {
  return useQuery({
    queryKey: ["contrats", "pending"],
    queryFn: getPendingContrats,
  });
}

export function useContrat(id?: number) {
  return useQuery({
    queryKey: ["contrats", id],
    queryFn: () => getContratById(id as number),
    enabled: typeof id === "number" && Number.isFinite(id),
  });
}

export function useContratsByClientId(clientId?: string) {
  return useQuery({
    queryKey: ["contrats", "client", clientId],
    queryFn: () => getContratsByClientId(clientId as string),
    enabled: Boolean(clientId),
  });
}

export function useUpdateContratStatus(id?: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateContratStatusPayload) =>
      updateContratStatus(id as number, payload),
    onSuccess: (contrat) => {
      queryClient.invalidateQueries({ queryKey: ["contrats"] });
      queryClient.invalidateQueries({ queryKey: ["contrats", contrat.id] });
      queryClient.invalidateQueries({
        queryKey: ["contrats", "client", contrat.client_id],
      });
      queryClient.invalidateQueries({ queryKey: ["contrats", "pending"] });
    },
  });
}
