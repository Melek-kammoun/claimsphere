import { PartialType } from '@nestjs/mapped-types';
import { CreateAiScoreDto } from './create-ai_score.dto';

export class UpdateAiScoreDto extends PartialType(CreateAiScoreDto) {}
