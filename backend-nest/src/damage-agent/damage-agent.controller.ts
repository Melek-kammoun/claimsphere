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
import { DamageAgentService } from './damage-agent.service';
import { DamageAgentRequestDto } from './damage-agent.dto';

@Controller('damage-agent')
export class DamageAgentController {
  constructor(private readonly damageAgentService: DamageAgentService) {}

  @Post('assess')
  @HttpCode(200)
  @UseInterceptors(
    FileInterceptor('image', {
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  async assess(
    @UploadedFile() file: any,
    @Body() body: DamageAgentRequestDto,
  ) {
    if (!file) {
      throw new BadRequestException("Le fichier image est requis dans le champ 'image'.");
    }

    if (!file.mimetype?.startsWith('image/')) {
      throw new BadRequestException('Le fichier fourni doit être une image.');
    }

    if (!body?.contract_id) {
      throw new BadRequestException('Le champ contract_id est requis.');
    }

    return this.damageAgentService.assessContractDamage({
      fileName: file.originalname || 'upload.jpg',
      mimeType: file.mimetype,
      buffer: file.buffer,
      threshold: body.threshold,
      contractId: body.contract_id,
    });
  }
}
