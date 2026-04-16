import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { AiScoresService } from './ai_scores.service';
import { CreateAiScoreDto } from './dto/create-ai_score.dto';
import { UpdateAiScoreDto } from './dto/update-ai_score.dto';

@Controller('ai-scores')
export class AiScoresController {
  constructor(private readonly aiScoresService: AiScoresService) {}

  @Post()
  create(@Body() createAiScoreDto: CreateAiScoreDto) {
    return this.aiScoresService.create(createAiScoreDto);
  }

  @Get()
  findAll() {
    return this.aiScoresService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.aiScoresService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAiScoreDto: UpdateAiScoreDto) {
    return this.aiScoresService.update(+id, updateAiScoreDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.aiScoresService.remove(+id);
  }
}
