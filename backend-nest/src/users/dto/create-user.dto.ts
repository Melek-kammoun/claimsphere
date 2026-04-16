export class CreateUserDto {
  id?: string;
  email: string;
  password?: string;
  name?: string;
  full_name?: string;
  phone?: string;
  role?: string;
  contract_number?: string;
  status?: string;
  specialty?: string;
}