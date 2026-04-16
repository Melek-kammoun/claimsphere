export class CreateContratDto {
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
}

export class UpdateContratStatusDto {
  status: string;
}
