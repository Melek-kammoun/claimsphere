import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class EstimateVehicleDto {
  @IsString()
  marque: string;

  @IsString()
  modele: string;

  @IsNumber()
  @Type(() => Number)
  age: number;

  @IsNumber()
  @Type(() => Number)
  kilometrage: number;

  @IsString()
  serie: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  montantDeclare?: number;

  @IsString()
  @IsOptional()
  offer?: string;
}
