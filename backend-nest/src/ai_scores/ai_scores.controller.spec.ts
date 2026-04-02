import { Test, TestingModule } from '@nestjs/testing';
import { AiScoresController } from './ai_scores.controller';
import { AiScoresService } from './ai_scores.service';

describe('AiScoresController', () => {
  let controller: AiScoresController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AiScoresController],
      providers: [AiScoresService],
    }).compile();

    controller = module.get<AiScoresController>(AiScoresController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
