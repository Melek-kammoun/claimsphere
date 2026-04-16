export class UpdateUserDto {
  name?: string;
  email?: string;
  password?: string;
  role?: 'admin' | 'agent' | 'client';
  specialty?: string;
  status?: string;
}