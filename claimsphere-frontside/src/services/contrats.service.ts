import { apiRequest } from "@/lib/api-client";

export type Contrat = {
  id: number;
  client_id: string;
  type: string;
  start_date?: string | null;
  end_date?: string | null;
  status: string;
  created_at: string;
  montant_declare?: number | null;
  contract_number?: string | null;
  contract_reference?: string | null;
  marque?: string | null;
  modele?: string | null;
  age?: number | null;
  kilometrage?: number | null;
  serie?: number | null;
  num_voiture?: number | null;
  prime?: number | null;
  valeur_estimee?: number | null;
};

export type CreateContratPayload = {
  client_id: string;
  type: string;
  start_date?: string;
  end_date?: string;
  status?: string;
  montant_declare?: number;
  contract_number?: string;
  contract_reference?: string;
  marque?: string;
  modele?: string;
  age?: number;
  kilometrage?: number;
  serie?: number;
  num_voiture?: number;
  prime?: number;
  valeur_estimee?: number;
};

export type UpdateContratStatusPayload = {
  status: string;
};

export function createContrat(payload: CreateContratPayload) {
  return apiRequest<Contrat>("/api/contrats", {
    method: "POST",
    body: payload,
  });
}

export function getContratById(id: number) {
  return apiRequest<Contrat>(`/api/contrats/${id}`);
}

export function getContratsByClientId(clientId: string) {
  return apiRequest<Contrat[]>(`/api/contrats/client/${clientId}`);
}

export function getAllContrats(status?: string) {
  const suffix = status ? `?status=${encodeURIComponent(status)}` : "";
  return apiRequest<Contrat[]>(`/api/contrats${suffix}`);
}

export function getPendingContrats() {
  return apiRequest<Contrat[]>("/api/contrats/pending");
}

export function updateContratStatus(
  id: number,
  payload: UpdateContratStatusPayload,
) {
  return apiRequest<Contrat>(`/api/contrats/${id}/status`, {
    method: "PATCH",
    body: payload,
  });
}
