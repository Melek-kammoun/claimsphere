import { Injectable } from '@nestjs/common';
import * as QRCode from 'qrcode';

@Injectable()
export class QrCodeService {
  /**
   * Générer un QR Code basé sur le token
   */
  async generateQrCode(qrToken: string, baseUrl: string): Promise<string> {
    const qrData = `${baseUrl}/constats/scan/${qrToken}`;

    // Générer le QR Code en tant que data URL
    const dataUrl = await QRCode.toDataURL(qrData, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      width: 300,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });

    return dataUrl;
  }

  /**
   * Générer un QR Code en tant que buffer (pour PDF)
   */
  async generateQrCodeBuffer(
    qrToken: string,
    baseUrl: string
  ): Promise<Buffer> {
    const qrData = `${baseUrl}/constats/scan/${qrToken}`;

    const buffer = await QRCode.toBuffer(qrData, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      width: 200,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });

    return buffer;
  }

  /**
   * Valider un token QR (format UUID)
   */
  validateQrToken(token: string): boolean {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(token);
  }
}
