import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Req,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ClaimsService } from './claims.service';
import { ClaimsWorkflowService } from './claims-workflow.service';
import { StartClaimWorkflowDto } from './dto/start-claim-workflow.dto';

@Controller('api/claims')
@UseGuards(JwtAuthGuard)
export class ClaimsController {
  constructor(
    private readonly claimsService: ClaimsService,
    private readonly claimsWorkflowService: ClaimsWorkflowService,
  ) {}

  @Post('workflow/start')
  async startWorkflow(@Body() body: StartClaimWorkflowDto, @Req() req: any) {
    const metadata = {
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip || req.connection?.remoteAddress || req.headers['x-forwarded-for'],
    };

    const workflow = await this.claimsWorkflowService.startWorkflow(req.user.id, body, metadata);
    return { success: true, data: workflow };
  }

  @Post('workflow/complete')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'pv_police', maxCount: 1 },
        { name: 'accident_images', maxCount: 10 },
      ],
      {
        storage: memoryStorage(),
        limits: { fileSize: 20 * 1024 * 1024 },
      },
    ),
  )
  async completeWorkflow(
    @UploadedFiles()
    files: {
      pv_police?: Express.Multer.File[];
      accident_images?: Express.Multer.File[];
    },
    @Body() body: Record<string, any>,
    @Req() req: any,
  ) {
    const pvPoliceFile = files?.pv_police?.[0];
    if (!pvPoliceFile) {
      throw new BadRequestException('Le fichier pv_police est requis.');
    }

    const result = await this.claimsWorkflowService.completeWorkflow({
      userId: req.user.id,
      body,
      pvPoliceFile,
      accidentImages: files?.accident_images ?? [],
    });

    return { success: true, data: result };
  }

  /** POST /api/claims - client creates a claim */
  @Post()
  async createClaim(@Body() body: any, @Req() req: any) {
    const claim = await this.claimsService.create({
      user_id: req.user.id,
      contract_id: body.contract_id,
      type: body.type,
      date: body.date,
      location: body.location,
      description: body.description,
      vehicle: body.vehicle,
      documents: body.documents,
    });
    return { success: true, data: claim };
  }

  /** GET /api/claims - client gets own claims */
  @Get()
  async getUserClaims(@Req() req: any) {
    const claims = await this.claimsService.findByUserId(req.user.id);
    return { success: true, data: claims, total: claims.length };
  }

  /** GET /api/claims/all - agent: list all claims */
  @Get('all')
  async getAllClaims() {
    const claims = await this.claimsService.findAll();
    return { success: true, data: claims, total: claims.length };
  }

  /** GET /api/claims/:id */
  @Get(':id')
  async getClaimById(@Param('id') id: string, @Req() req: any) {
    const claim = await this.claimsService.findOne(id);
    if (!claim) throw new NotFoundException('Claim not found');
    if (claim.user_id !== req.user.id) {
      // Placeholder for future role-based access.
    }
    return { success: true, data: claim };
  }

  /** PATCH /api/claims/:id/approve - agent */
  @Patch(':id/approve')
  async approveClaim(@Param('id') id: string, @Body() body: any) {
    const claim = await this.claimsService.approveClaim(id, body.amount);
    return { success: true, data: claim };
  }

  /** PATCH /api/claims/:id/reject - agent */
  @Patch(':id/reject')
  async rejectClaim(@Param('id') id: string, @Body() body: any) {
    const claim = await this.claimsService.rejectClaim(
      id,
      body.reason ?? 'Dossier incomplet',
    );
    return { success: true, data: claim };
  }

  /** PATCH /api/claims/:id/request-documents - agent */
  @Patch(':id/request-documents')
  async requestDocuments(@Param('id') id: string, @Body() body: any) {
    const claim = await this.claimsService.requestDocuments(
      id,
      body.documents_needed ?? 'Devis et rapport expert',
    );
    return { success: true, data: claim };
  }

  /** PATCH /api/claims/:id/link-constat - legacy no-op */
  @Patch(':id/link-constat')
  async linkConstat(@Param('id') id: string, @Body() body: any) {
    const claim = await this.claimsService.linkConstat(id, body.constat_id);
    return { success: true, data: claim };
  }
}
