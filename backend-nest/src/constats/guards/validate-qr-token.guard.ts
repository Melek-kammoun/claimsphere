import {
  Injectable,
  CanActivate,
  ExecutionContext,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { Request } from 'express';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Constat, ConstatStatus } from '../entities/constat.entity';

/**
 * Guard pour valider le token QR
 * Vérifier que:
 * - Le token existe
 * - Le token n'est pas expiré
 * - Le constat est en attente de complétion
 */
@Injectable()
export class ValidateQrTokenGuard implements CanActivate {
  constructor(
    @InjectRepository(Constat)
    private constatRepository: Repository<Constat>
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const qrToken = request.params.token;

    if (!qrToken || typeof qrToken !== 'string') {
      throw new BadRequestException('QR token manquant ou invalide');
    }

    // Vérifier le format UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(qrToken)) {
      throw new BadRequestException('Format de QR token invalide');
    }

    // Chercher le constat
    const constat = await this.constatRepository.findOne({
      where: { qr_token: qrToken },
    });

    if (!constat) {
      throw new BadRequestException('QR Code invalide');
    }

    // Vérifier l'expiration
    if (new Date() > constat.qr_expires_at) {
      throw new ForbiddenException('QR Code expiré');
    }

    // Vérifier le statut
    if (constat.statut !== ConstatStatus.PENDING) {
      throw new ForbiddenException('Ce constat a déjà été complété');
    }

    // Ajouter les données du constat à la request pour un accès ultérieur
    (request as any).constat = constat;

    return true;
  }
}
