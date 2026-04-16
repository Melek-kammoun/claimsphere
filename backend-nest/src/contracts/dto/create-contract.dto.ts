export class CreateContractDto {
  client_id?: string;
  type!: string;
  start_date!: string;
  end_date!: string;
  status!: string;
  montant_declare!: number;
  marque!: string;
}
