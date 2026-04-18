import { Injectable, Logger } from '@nestjs/common';
import { PDFDocument, PDFPage, rgb, StandardFonts } from 'pdf-lib';
import { Constat } from '../entities/constat.entity';
import { ConstatParty } from '../entities/constat-party.entity';
import { QrCodeService } from './qrcode.service';

@Injectable()
export class PdfService {
  private readonly logger = new Logger(PdfService.name);
  private readonly sectionBlue = rgb(0, 0, 0.39);
  private readonly sectionRed = rgb(0.39, 0, 0);

  constructor(private qrCodeService: QrCodeService) {}

  /**
   * Générer un PDF du constat avec toutes les informations
   */
  async generateConstatPdf(constat: Constat, parties: ConstatParty[] = []): Promise<Buffer> {
    try {
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([595, 842]); // A4 size
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      let yPosition = 750;
      const margin = 40;
      const lineHeight = 12;

      // En-tête
      page.drawText('CONSTAT D\'ACCIDENT AUTOMOBILE', {
        x: margin,
        y: yPosition,
        size: 18,
        font: boldFont,
        color: rgb(0, 0, 0),
      });
      yPosition -= 30;

      // Informations du constat
      page.drawText(`Numéro: ${constat.id}`, {
        x: margin,
        y: yPosition,
        size: 10,
        font: font,
      });
      yPosition -= lineHeight * 1.5;

      page.drawText(
        `Date de création: ${new Date(constat.created_at).toLocaleDateString('fr-FR')}`,
        {
          x: margin,
          y: yPosition,
          size: 10,
          font: font,
        }
      );
      yPosition -= lineHeight * 2;

      const partyA = parties.find((p) => p.role === 'A');
      const partyB = parties.find((p) => p.role === 'B');

      // Section Client A
      page.drawText('CLIENT A', {
        x: margin,
        y: yPosition,
        size: 12,
        font: boldFont,
        color: this.sectionBlue,
      });
      yPosition -= lineHeight * 1.5;

      yPosition = this.drawClientInfo(
        page,
        font,
        margin,
        yPosition,
        partyA
      );

      yPosition -= lineHeight * 2;

      // Section Client B
      if (partyB) {
        page.drawText('CLIENT B', {
          x: margin,
          y: yPosition,
          size: 12,
          font: boldFont,
          color: this.sectionRed,
        });
        yPosition -= lineHeight * 1.5;

        yPosition = this.drawClientInfo(
          page,
          font,
          margin,
          yPosition,
          partyB
        );
      }

      yPosition -= lineHeight * 2;

      // Section Circonstances
      page.drawText('CIRCONSTANCES DE L\'ACCIDENT', {
        x: margin,
        y: yPosition,
        size: 12,
        font: boldFont,
        color: rgb(0, 0, 0),
      });
      yPosition -= lineHeight * 1.5;

      page.drawText(
        `Lieu: ${constat.lieu_accident || 'N/A'}`,
        {
          x: margin,
          y: yPosition,
          size: 10,
          font: font,
        }
      );
      yPosition -= lineHeight * 1.5;

      page.drawText(
        `Date: ${constat.date_accident ? new Date(constat.date_accident).toLocaleString('fr-FR') : 'N/A'}`,
        {
          x: margin,
          y: yPosition,
          size: 10,
          font: font,
        }
      );
      yPosition -= lineHeight * 1.5;

      const descriptionLines = this.wrapText(
        constat.description_accident || 'Aucune description fournie',
        50
      );
      page.drawText('Description:', {
        x: margin,
        y: yPosition,
        size: 10,
        font: boldFont,
      });
      yPosition -= lineHeight;

      for (const line of descriptionLines) {
        if (yPosition < margin) {
          yPosition = this.addNewPage(pdfDoc, page, margin);
        }
        page.drawText(line, {
          x: margin + 10,
          y: yPosition,
          size: 9,
          font: font,
        });
        yPosition -= lineHeight;
      }

      // QR Code
      if (yPosition < margin + 100) {
        yPosition = this.addNewPage(pdfDoc, page, margin);
      }

      yPosition -= lineHeight;
      page.drawText('QR Code pour consultation:', {
        x: margin,
        y: yPosition,
        size: 10,
        font: boldFont,
      });
      yPosition -= 10;

      // Générer et insérer le QR Code
      const qrBuffer = await this.qrCodeService.generateQrCodeBuffer(
        constat.qr_token,
        process.env.API_BASE_URL || 'http://localhost:3000'
      );
      const qrImage = await pdfDoc.embedPng(qrBuffer);
      page.drawImage(qrImage, {
        x: margin,
        y: yPosition - 130,
        width: 100,
        height: 100,
      });

      // Signatures
      yPosition -= 150;
      page.drawText('Signatures:', {
        x: margin,
        y: yPosition,
        size: 10,
        font: boldFont,
      });
      yPosition -= lineHeight * 2;

      page.drawText('Client A: ___________________', {
        x: margin,
        y: yPosition,
        size: 10,
        font: font,
      });
      yPosition -= lineHeight * 2;

      if (partyB?.signature) {
        page.drawText('Client B: ___________________', {
          x: margin,
          y: yPosition,
          size: 10,
          font: font,
        });
      }

      // Générer le PDF
      const pdfBytes = await pdfDoc.save();
      return Buffer.from(pdfBytes);
    } catch (error) {
      this.logger.error(`Erreur lors de la génération du PDF: ${error}`);
      throw error;
    }
  }

  private drawClientInfo(
    page: PDFPage,
    font: any,
    margin: number,
    yPosition: number,
    party?: ConstatParty
  ): number {
    const lineHeight = 12;

    if (!party) {
      return yPosition;
    }

    // Données personnelles
    page.drawText(`Nom: ${(party.nom || '')} ${(party.prenom || '')}`.trim(), {
      x: margin + 10,
      y: yPosition,
      size: 9,
      font: font,
    });
    yPosition -= lineHeight;

    page.drawText(`Téléphone: ${party.telephone || 'N/A'}`, {
      x: margin + 10,
      y: yPosition,
      size: 9,
      font: font,
    });
    yPosition -= lineHeight;

    if (party.num_permis) {
      page.drawText(`Permis: ${party.num_permis}`, {
        x: margin + 10,
        y: yPosition,
        size: 9,
        font: font,
      });
      yPosition -= lineHeight;
    }

    // Véhicule
    if (party.marque || party.modele) {
      page.drawText(`Véhicule: ${party.marque || ''} ${party.modele || ''}`.trim(), {
        x: margin + 10,
        y: yPosition,
        size: 9,
        font: font,
      });
      yPosition -= lineHeight;

      page.drawText(`Immatriculation: ${party.immatriculation || 'N/A'}`, {
        x: margin + 10,
        y: yPosition,
        size: 9,
        font: font,
      });
      yPosition -= lineHeight;

      if (party.annee) {
        page.drawText(`Année: ${party.annee}`, {
          x: margin + 10,
          y: yPosition,
          size: 9,
          font: font,
        });
        yPosition -= lineHeight;
      }
    }

    // Assurance
    if (party.compagnie_assurance) {
      page.drawText(`Assurance: ${party.compagnie_assurance}`, {
        x: margin + 10,
        y: yPosition,
        size: 9,
        font: font,
      });
      yPosition -= lineHeight;

      page.drawText(`Contrat: ${party.num_assurance || 'N/A'}`, {
        x: margin + 10,
        y: yPosition,
        size: 9,
        font: font,
      });
      yPosition -= lineHeight;
    }

    return yPosition;
  }

  private wrapText(text: string, maxCharsPerLine: number): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      if ((currentLine + word).length > maxCharsPerLine) {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine += (currentLine ? ' ' : '') + word;
      }
    }

    if (currentLine) lines.push(currentLine);
    return lines;
  }

  private addNewPage(pdfDoc: PDFDocument, currentPage: PDFPage, margin: number): number {
    const newPage = pdfDoc.addPage([595, 842]);
    return 750;
  }
}
