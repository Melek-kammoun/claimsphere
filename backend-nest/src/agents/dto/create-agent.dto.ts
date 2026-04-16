import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateAgentDto {
  @IsNotEmpty()
  @IsString()
  full_name!: string;

  @IsNotEmpty()
  @IsEmail()
  email!: string;

  @IsNotEmpty()
  @IsString()
  password!: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  specialty?: string;
}
