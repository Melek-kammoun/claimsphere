import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { DamageAnalysisService } from './damage-analysis.service';
import { DamageAnalysisRequestDto } from './damage-analysis.dto';

@Controller('damage-analysis')
export class DamageAnalysisController {
  constructor(private readonly damageAnalysisService: DamageAnalysisService) {}

  @Post('predict')
  @HttpCode(200)
  @UseInterceptors(
    FileInterceptor('image', {
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  async predict(
    @UploadedFile() file: any,
    @Body() body: DamageAnalysisRequestDto,
  ) {
    if (!file) {
      throw new BadRequestException('Le fichier image est requis dans le champ "image".');
    }

    if (!file.mimetype?.startsWith('image/')) {
      throw new BadRequestException('Le fichier fourni doit etre une image.');
    }

    return this.damageAnalysisService.predict({
      fileName: file.originalname || 'upload.jpg',
      mimeType: file.mimetype,
      buffer: file.buffer,
      threshold: body.threshold,
    });
  }
}
