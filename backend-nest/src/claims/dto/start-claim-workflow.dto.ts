import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { CreateConstatDto } from '../../constats/dto/create-constat.dto';

export class StartClaimWorkflowDto {
  @IsOptional()
  @IsString()
  contract_id?: string | null;

  @IsString()
  @IsNotEmpty()
  type: string;

  @IsString()
  @IsNotEmpty()
  date: string;

  @IsString()
  @IsNotEmpty()
  location: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  description: string;

  @IsString()
  @IsNotEmpty()
  vehicle: string;

  @ValidateNested()
  @Type(() => CreateConstatDto)
  constat: CreateConstatDto;
}
