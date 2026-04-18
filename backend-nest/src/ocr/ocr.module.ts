import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PvPolice } from './entities/pv-police.entity';
import { RapportExpert } from './entities/rapport-expert.entity';
import { Devis } from './entities/devis.entity';
import { OcrService } from './services/ocr.service';
import { OcrController } from './controllers/ocr.controller';

@Module({
  imports: [TypeOrmModule.forFeature([PvPolice, RapportExpert, Devis])],
  providers: [OcrService],
  controllers: [OcrController],
  exports: [OcrService],
})
export class OcrModule {}