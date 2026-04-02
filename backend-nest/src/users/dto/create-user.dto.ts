import { IsEmail, IsOptional, IsString } from 'class-validator';

export class CreateUserDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  password: string;

  @IsString()
  role: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  specialty?: string;

  @IsString()
  @IsOptional()
  full_name?: string;

  contract_number?: number;
  phone?: string;
}