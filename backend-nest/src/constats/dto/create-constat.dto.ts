export class CreateConstatDto {
  // User A (Creator)
  user_a_data: {
    full_name: string;
    phone: string;
    email: string;
    driving_license?: string;
  };

  vehicle_a_data: {
    plate: string;
    brand: string;
    model: string;
    year?: number;
    vin?: string;
    registration_date?: string;
  };

  insurance_a_data: {
    company: string;
    policy_number: string;
    agent_name?: string;
    agent_phone?: string;
  };

  accident_details: {
    date: string;
    time: string;
    location: string;
    description: string;
    witnesses?: string[];
    police_report?: string;
  };

  photos_a?: string[]; // URLs de photos
  signature_a: string; // Base64 ou URL
}
