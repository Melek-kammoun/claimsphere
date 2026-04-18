import {
  Controller,
  Post,
  Get,
  Param,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  Body,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { OcrService } from '../services/ocr.service';

const pdfFileFilter = (
  _req: any,
  file: Express.Multer.File,
  cb: (err: Error | null, accept: boolean) => void,
) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new BadRequestException('Only PDF files are allowed'), false);
  }
};

const uploadOptions = {
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: pdfFileFilter,
};

@Controller('api/ocr')
@UseGuards(JwtAuthGuard)
export class OcrController {
  constructor(private ocrService: OcrService) {}

  @Post('upload-pv-police')
  @UseInterceptors(FileInterceptor('file', uploadOptions))
  async uploadPvPolice(
    @UploadedFile() file: Express.Multer.File,
    @Body('claim_id') claimId?: string,
  ) {
    if (!file) throw new BadRequestException('No file uploaded');
    return this.ocrService.uploadPvPolice(file, claimId);
  }

  @Get('pv-police/:id')
  async getPvPoliceById(@Param('id') id: string) {
    const doc = await this.ocrService.getPvPoliceById(id);
    if (!doc) throw new BadRequestException('PV Police not found');
    return { success: true, data: doc };
  }

  @Get('pv-police')
  async getAllPvPolice() {
    const docs = await this.ocrService.getAllPvPolice();
    return { success: true, data: docs, total: docs.length };
  }

  @Post('upload-rapport-expert')
  @UseInterceptors(FileInterceptor('file', uploadOptions))
  async uploadRapportExpert(
    @UploadedFile() file: Express.Multer.File,
    @Body('claim_id') claimId?: string,
  ) {
    if (!file) throw new BadRequestException('No file uploaded');
    return this.ocrService.uploadRapportExpert(file, claimId);
  }

  @Get('rapport-expert/:id')
  async getRapportExpertById(@Param('id') id: string) {
    const doc = await this.ocrService.getRapportExpertById(id);
    if (!doc) throw new BadRequestException('Rapport Expert not found');
    return { success: true, data: doc };
  }

  @Get('rapport-expert')
  async getAllRapportExpert() {
    const docs = await this.ocrService.getAllRapportExpert();
    return { success: true, data: docs, total: docs.length };
  }

  @Post('upload-devis')
  @UseInterceptors(FileInterceptor('file', uploadOptions))
  async uploadDevis(
    @UploadedFile() file: Express.Multer.File,
    @Body('claim_id') claimId?: string,
  ) {
    if (!file) throw new BadRequestException('No file uploaded');
    return this.ocrService.uploadDevis(file, claimId);
  }

  @Get('devis/:id')
  async getDevisById(@Param('id') id: string) {
    const doc = await this.ocrService.getDevisById(id);
    if (!doc) throw new BadRequestException('Devis not found');
    return { success: true, data: doc };
  }

  @Get('devis')
  async getAllDevis() {
    const docs = await this.ocrService.getAllDevis();
    return { success: true, data: docs, total: docs.length };
  }
}
