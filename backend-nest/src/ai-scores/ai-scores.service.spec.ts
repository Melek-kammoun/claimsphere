import { Test, TestingModule } from '@nestjs/testing';
import { AiScoresService } from './ai-scores.service';

describe('AiScoresService', () => {
  let service: AiScoresService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AiScoresService],
    }).compile();

    service = module.get<AiScoresService>(AiScoresService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
