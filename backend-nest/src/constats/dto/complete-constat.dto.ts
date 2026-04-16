export class CompleteConstatDto {
  // User B
  user_b_data: {
    full_name: string;
    phone: string;
    email: string;
    driving_license?: string;
  };

  vehicle_b_data: {
    plate: string;
    brand: string;
    model: string;
    year?: number;
    vin?: string;
    registration_date?: string;
  };

  insurance_b_data: {
    company: string;
    policy_number: string;
    agent_name?: string;
    agent_phone?: string;
  };

  photos_b?: string[]; // URLs de photos
  signature_b: string; // Base64 ou URL
}
