import { Injectable } from '@nestjs/common';
import { CreateAiScoreDto } from './dto/create-ai-score.dto';
import { UpdateAiScoreDto } from './dto/update-ai-score.dto';

@Injectable()
export class AiScoresService {
  create(createAiScoreDto: CreateAiScoreDto) {
    return 'This action adds a new aiScore';
  }

  findAll() {
    return `This action returns all aiScores`;
  }

  findOne(id: number) {
    return `This action returns a #${id} aiScore`;
  }

  update(id: number, updateAiScoreDto: UpdateAiScoreDto) {
    return `This action updates a #${id} aiScore`;
  }

  remove(id: number) {
    return `This action removes a #${id} aiScore`;
  }
}
