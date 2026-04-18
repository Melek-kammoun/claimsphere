import { IsString, IsUUID, IsOptional, IsBoolean } from 'class-validator';

export class CreateNotificationDto {
  @IsUUID()
  user_id: string;

  @IsString()
  message: string;

  @IsBoolean()
  @IsOptional()
  read?: boolean;
}
