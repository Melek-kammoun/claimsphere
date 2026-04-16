import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Request,
  BadRequestException,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ConstatsService } from './services/constats.service';
import { QrCodeService } from './services/qrcode.service';
import { CreateConstatDto } from './dto/create-constat.dto';
import { CompleteConstatDto } from './dto/complete-constat.dto';
import { ConstatResponseDto } from './dto/constat-response.dto';

@Controller('constats')
export class ConstatsController {
  private readonly logger = new Logger(ConstatsController.name);

  constructor(
    private constatsService: ConstatsService,
    private qrCodeService: QrCodeService
  ) {}

  private resolveQrBaseUrl(req: any): string {
    const envBaseUrl = process.env.PUBLIC_SCAN_BASE_URL || process.env.FRONTEND_URL;
    const baseUrl = (envBaseUrl || '').toString().trim();
    return baseUrl.replace(/\/$/, '');
  }

  private resolveConfiguredQrBaseUrl(): string {
    const baseUrl = (process.env.PUBLIC_SCAN_BASE_URL || process.env.FRONTEND_URL || '')
      .toString()
      .trim();

    if (!baseUrl) {
      throw new BadRequestException(
        'URL publique manquante. Définir PUBLIC_SCAN_BASE_URL dans le backend.'
      );
    }

    return baseUrl.replace(/\/$/, '');
  }

  private resolveUserId(req: any): string {
    const directUserId = req.user?.id || req.headers['x-user-id'];
    if (typeof directUserId === 'string' && directUserId.trim().length > 0) {
      return directUserId;
    }

    const authorization = req.headers['authorization'];
    if (typeof authorization !== 'string' || !authorization.startsWith('Bearer ')) {
      return '';
    }

    const token = authorization.slice('Bearer '.length).trim();
    const parts = token.split('.');
    if (parts.length < 2) {
      return '';
    }

    try {
      const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8')) as {
        sub?: string;
        user_id?: string;
        id?: string;
      };

      return payload.sub || payload.user_id || payload.id || '';
    } catch {
      return '';
    }
  }

  /**
   * Phase 1: Créer un constat (User A)
   * POST /constats
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createConstat(
    @Request() req: any,
    @Body() createConstatDto: CreateConstatDto
  ): Promise<{ constat: ConstatResponseDto; qr_code: string; scan_url: string }> {
    try {
      // Récupérer l'ID de l'utilisateur depuis le token JWT
      const userId = this.resolveUserId(req);

      if (!userId) {
        throw new BadRequestException('Utilisateur manquant. Fournir req.user.id ou x-user-id.');
      }

      // Récupérer les metadata
      const metadata = {
        userAgent: req.headers['user-agent'],
        ipAddress:
          req.ip ||
          req.connection.remoteAddress ||
          req.headers['x-forwarded-for'],
      };

      // Créer le constat
      const constat = await this.constatsService.createConstat(
        userId,
        createConstatDto,
        metadata
      );

      // Générer le QR Code
      const qrBaseUrl = this.resolveQrBaseUrl(req);
      const qrCode = await this.qrCodeService.generateQrCode(
        constat.qr_token,
        this.resolveConfiguredQrBaseUrl()
      );
      const scanUrl = `${qrBaseUrl}/constats/scan/${constat.qr_token}`;

      return {
        constat,
        qr_code: qrCode,
        scan_url: scanUrl,
      };
    } catch (error) {
      this.logger.error(`Erreur lors de la création du constat: ${error}`);
      throw error;
    }
  }

  /**
   * Phase 2: Scanner le QR Code
   * GET /constats/scan/:token
   * Public endpoint (pas d'authentification)
   */
  @Get('scan/:token')
  async scanQrCode(@Param('token') qrToken: string): Promise<any> {
    try {
      // Valider le format du token
      if (!this.qrCodeService.validateQrToken(qrToken)) {
        throw new BadRequestException('Format de QR token invalide');
      }

      // Récupérer le constat
      const constat = await this.constatsService.getConstatByQrToken(qrToken);

      // Générer le QR Code à nouveau pour affichage
      const qrCode = await this.qrCodeService.generateQrCode(
        qrToken,
        this.resolveConfiguredQrBaseUrl()
      );

      return {
        constat,
        qr_code: qrCode,
        ready_to_complete: true,
      };
    } catch (error) {
      this.logger.warn(`Tentative de scan invalide: ${error}`);
      throw error;
    }
  }

  /**
   * Phase 3: Compléter le constat (User B)
   * POST /constats/complete/:token
   * Public endpoint mais avec validation
   */
  @Post('complete/:token')
  @HttpCode(HttpStatus.OK)
  async completeConstat(
    @Param('token') qrToken: string,
    @Request() req: any,
    @Body() completeConstatDto: CompleteConstatDto
  ): Promise<ConstatResponseDto> {
    try {
      // Valider le format du token
      if (!this.qrCodeService.validateQrToken(qrToken)) {
        throw new BadRequestException('Format de QR token invalide');
      }

      const userId = this.resolveUserId(req);

      if (!userId) {
        throw new BadRequestException('Utilisateur manquant. Fournir req.user.id ou x-user-id.');
      }

      const metadata = {
        userAgent: req.headers['user-agent'],
        ipAddress:
          req.ip ||
          req.connection.remoteAddress ||
          req.headers['x-forwarded-for'],
      };

      // Compléter le constat
      const constat = await this.constatsService.completeConstat(
        qrToken,
        userId,
        completeConstatDto,
        metadata
      );

      return constat;
    } catch (error) {
      this.logger.error(`Erreur lors de la complétion du constat: ${error}`);
      throw error;
    }
  }

  /**
   * Récupérer un constat par ID
   * GET /constats/:id
   */
  @Get(':id')
  async getConstat(
    @Param('id') constatId: string,
    @Request() req: any
  ): Promise<ConstatResponseDto> {
    const userId = this.resolveUserId(req);
    if (!userId) {
      throw new BadRequestException('Utilisateur manquant. Fournir req.user.id ou x-user-id.');
    }
    return this.constatsService.getConstatById(constatId, userId);
  }

  /**
   * Lister tous les constats de l'utilisateur
   * GET /constats
   */
  @Get()
  async listConstats(@Request() req: any): Promise<ConstatResponseDto[]> {
    const userId = this.resolveUserId(req);
    if (!userId) {
      throw new BadRequestException('Utilisateur manquant. Fournir req.user.id ou x-user-id.');
    }
    return this.constatsService.listUserConstats(userId);
  }

  /**
   * Renvoyer le QR Code
   * POST /constats/:id/resend-qr
   */
  @Post(':id/resend-qr')
  @HttpCode(HttpStatus.OK)
  async resendQrCode(
    @Param('id') constatId: string,
    @Request() req: any
  ): Promise<{ qr_token: string; qr_code: string; expires_at: Date }> {
    const userId = this.resolveUserId(req);

    if (!userId) {
      throw new BadRequestException('Utilisateur manquant. Fournir req.user.id ou x-user-id.');
    }

    const qrToken = await this.constatsService.resendQrCode(
      constatId,
      userId
    );

    const qrCode = await this.qrCodeService.generateQrCode(
      qrToken,
      this.resolveConfiguredQrBaseUrl()
    );

    return {
      qr_token: qrToken,
      qr_code: qrCode,
      expires_at: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
    };
  }
}
