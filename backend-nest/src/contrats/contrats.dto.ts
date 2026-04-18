import { Type } from 'class-transformer';
import { IsIn, IsNumber, IsOptional, IsString, Min } from 'class-validator';

// Every property needs a decorator so NestJS's ValidationPipe +
// class-transformer actually maps the incoming JSON onto the DTO instance.
// Without decorators, whitelist:true strips all fields → empty contract saved.

export class CreateContratDto {
  @IsString()
  client_id: string;

  @IsString()
  type: string;

  @IsString()
  @IsOptional()
  start_date?: string;

  @IsString()
  @IsOptional()
  end_date?: string;

  @IsString()
  @IsOptional()
  status?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  montant_declare?: number;

  @IsString()
  @IsOptional()
  contract_number?: string;

  @IsString()
  @IsOptional()
  contract_reference?: string;

  @IsString()
  @IsOptional()
  marque?: string;

  @IsString()
  @IsOptional()
  modele?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  age?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  kilometrage?: number;

  // serie is alphanumeric (e.g. "1234TUN") — string, not number
  @IsString()
  @IsOptional()
  serie?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  prime?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  valeur_estimee?: number;
}

export class UpdateContratStatusDto {
  @IsString()
  @IsIn(['non_traite', 'approuve', 'refuse'])
  status: string;
}