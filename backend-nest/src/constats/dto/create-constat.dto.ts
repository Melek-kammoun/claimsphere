import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class ConstatUserADataDto {
  @IsString()
  @IsNotEmpty()
  full_name: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  driving_license?: string;
}

export class ConstatVehicleADataDto {
  @IsString()
  @IsNotEmpty()
  plate: string;

  @IsOptional()
  @IsString()
  brand?: string;

  @IsOptional()
  @IsString()
  model?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1900)
  year?: number;

  @IsOptional()
  @IsString()
  vin?: string;

  @IsOptional()
  @IsString()
  registration_date?: string;
}

export class ConstatInsuranceADataDto {
  @IsString()
  @IsNotEmpty()
  company: string;

  @IsString()
  @IsNotEmpty()
  policy_number: string;

  @IsOptional()
  @IsString()
  agent_name?: string;

  @IsOptional()
  @IsString()
  agent_phone?: string;
}

export class ConstatAccidentDetailsDto {
  @IsString()
  @IsNotEmpty()
  date: string;

  @IsOptional()
  @IsString()
  time?: string;

  @IsString()
  @IsNotEmpty()
  location: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  description: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  witnesses?: string[];

  @IsOptional()
  @IsString()
  police_report?: string;
}

export class CreateConstatDto {
  @ValidateNested()
  @Type(() => ConstatUserADataDto)
  user_a_data: ConstatUserADataDto;

  @ValidateNested()
  @Type(() => ConstatVehicleADataDto)
  vehicle_a_data: ConstatVehicleADataDto;

  @ValidateNested()
  @Type(() => ConstatInsuranceADataDto)
  insurance_a_data: ConstatInsuranceADataDto;

  @ValidateNested()
  @Type(() => ConstatAccidentDetailsDto)
  accident_details: ConstatAccidentDetailsDto;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  photos_a?: string[];

  @IsString()
  @IsNotEmpty()
  signature_a: string;
}
