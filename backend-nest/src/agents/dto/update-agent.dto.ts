import { IsOptional, IsString, IsEmail } from 'class-validator';

export class UpdateAgentDto {
  @IsOptional()
  @IsString()
  full_name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  specialty?: string;

  @IsOptional()
  @IsString()
  status?: 'Actif' | 'En attente' | 'Suspendu';
}
