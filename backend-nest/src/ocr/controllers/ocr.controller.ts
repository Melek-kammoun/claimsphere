import {
  Controller,
  Post,
  Get,
  Param,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { OcrService } from '../services/ocr.service';

@Controller('api/ocr')
export class OcrController {
  constructor(private ocrService: OcrService) {}

  /**
   * Upload and process PV Police
   * POST /api/ocr/upload-pv-police
   */
  @Post('upload-pv-police')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
      fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
          cb(null, true);
        } else {
          cb(new BadRequestException('Only PDF files are allowed'), false);
        }
      },
    }),
  )
  async uploadPvPolice(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    return this.ocrService.uploadPvPolice(file);
  }

  /**
   * Get PV Police by ID
   * GET /api/ocr/pv-police/:id
   */
  @Get('pv-police/:id')
  async getPvPoliceById(@Param('id') id: string) {
    const pvPolice = await this.ocrService.getPvPoliceById(id);
    if (!pvPolice) {
      throw new BadRequestException('PV Police not found');
    }
    return {
      success: true,
      data: pvPolice,
    };
  }

  /**
   * Get all PV Police
   * GET /api/ocr/pv-police
   */
  @Get('pv-police')
  async getAllPvPolice() {
    const pvPolice = await this.ocrService.getAllPvPolice();
    return {
      success: true,
      data: pvPolice,
      total: pvPolice.length,
    };
  }

  /**
   * Upload and process Rapport Expert
   * POST /api/ocr/upload-rapport-expert
   */
  @Post('upload-rapport-expert')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
      fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
          cb(null, true);
        } else {
          cb(new BadRequestException('Only PDF files are allowed'), false);
        }
      },
    }),
  )
  async uploadRapportExpert(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    return this.ocrService.uploadRapportExpert(file);
  }

  /**
   * Get Rapport Expert by ID
   * GET /api/ocr/rapport-expert/:id
   */
  @Get('rapport-expert/:id')
  async getRapportExpertById(@Param('id') id: string) {
    const rapportExpert = await this.ocrService.getRapportExpertById(id);
    if (!rapportExpert) {
      throw new BadRequestException('Rapport Expert not found');
    }
    return {
      success: true,
      data: rapportExpert,
    };
  }

  /**
   * Get all Rapport Expert
   * GET /api/ocr/rapport-expert
   */
  @Get('rapport-expert')
  async getAllRapportExpert() {
    const rapportExpert = await this.ocrService.getAllRapportExpert();
    return {
      success: true,
      data: rapportExpert,
      total: rapportExpert.length,
    };
  }

  /**
   * Upload and process Devis
   * POST /api/ocr/upload-devis
   */
  @Post('upload-devis')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
      fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
          cb(null, true);
        } else {
          cb(new BadRequestException('Only PDF files are allowed'), false);
        }
      },
    }),
  )
  async uploadDevis(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    return this.ocrService.uploadDevis(file);
  }

  /**
   * Get Devis by ID
   * GET /api/ocr/devis/:id
   */
  @Get('devis/:id')
  async getDevisById(@Param('id') id: string) {
    const devis = await this.ocrService.getDevisById(id);
    if (!devis) {
      throw new BadRequestException('Devis not found');
    }
    return {
      success: true,
      data: devis,
    };
  }

  /**
   * Get all Devis
   * GET /api/ocr/devis
   */
  @Get('devis')
  async getAllDevis() {
    const devis = await this.ocrService.getAllDevis();
    return {
      success: true,
      data: devis,
      total: devis.length,
    };
  }
}