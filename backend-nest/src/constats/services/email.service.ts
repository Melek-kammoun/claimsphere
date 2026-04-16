import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Constat } from '../entities/constat.entity';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.initializeTransporter();
  }

  private initializeTransporter(): void {
    const emailConfig = {
      host: this.configService.get<string>('SMTP_HOST'),
      port: this.configService.get<number>('SMTP_PORT'),
      secure: this.configService.get<boolean>('SMTP_SECURE') || false,
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASSWORD'),
      },
    };

    this.transporter = nodemailer.createTransport(emailConfig);
  }

  /**
   * Envoyer le PDF par email
   */
  async sendConstatEmail(
    recipient: string,
    constat: Constat,
    pdfUrl: string,
    recipientName: string | null = null
  ): Promise<void> {
    try {
      const subject = `Constat d'accident ${constat.id} - À consulter`;

      const htmlContent = this.generateEmailHtml(
        constat,
        pdfUrl,
        recipientName
      );

      await this.transporter.sendMail({
        from: this.configService.get<string>('SMTP_FROM'),
        to: recipient,
        subject,
        html: htmlContent,
        attachments: [
          {
            filename: `constat_${constat.id}.pdf`,
            path: pdfUrl,
          },
        ],
      });

      this.logger.log(`Email de constat envoyé à ${recipient}`);
    } catch (error) {
      this.logger.error(`Erreur lors de l'envoi de l'email: ${error}`);
    }
  }

  /**
   * Envoyer une notification de création de constat à l'utilisateur B
   */
  async sendQrCodeNotification(
    recipientEmail: string,
    qrToken: string,
    userAName: string
  ): Promise<void> {
    try {
      const scanUrl = `${process.env.API_BASE_URL}/constats/scan/${qrToken}`;

      const htmlContent = `
        <h2>Nouveau constat d'accident</h2>
        <p>Bonjour,</p>
        <p>${userAName} a créé un constat d'accident et vous demande de le compléter.</p>
        <p>
          <strong>Lien pour compléter le constat:</strong><br>
          <a href="${scanUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Scannez le constat
          </a>
        </p>
        <p>Ce lien est valide pendant 30 minutes.</p>
        <p>Cordialement,<br>L'équipe ClaimSphere</p>
      `;

      await this.transporter.sendMail({
        from: this.configService.get<string>('SMTP_FROM'),
        to: recipientEmail,
        subject: 'Nouveau constat d\'accident à compléter',
        html: htmlContent,
      });

      this.logger.log(`Email de notification envoyé à ${recipientEmail}`);
    } catch (error) {
      this.logger.error(`Erreur lors de l'envoi de la notification: ${error}`);
    }
  }

  private generateEmailHtml(
    constat: Constat,
    pdfUrl: string,
    recipientName: string | null
  ): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #007bff; color: white; padding: 20px; border-radius: 5px; }
          .section { margin: 20px 0; padding: 15px; border-left: 4px solid #007bff; }
          .footer { color: #666; font-size: 12px; margin-top: 30px; }
          a { color: #007bff; text-decoration: none; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Constat d'Accident Automobile</h1>
          </div>

          <p>Bonjour ${recipientName || 'Client'},</p>

          <p>Vous avez un nouveau constat d'accident à consulter. Les informations complètes sont disponibles dans le document ci-joint.</p>

          <div class="section">
            <h3>Détails du constat</h3>
            <p>
              <strong>Numéro du constat:</strong> ${constat.id}<br>
              <strong>Date:</strong> ${new Date(constat.created_at).toLocaleDateString('fr-FR')}<br>
              <strong>Lieu:</strong> ${constat.lieu_accident || 'N/A'}
            </p>
          </div>

          <div class="section">
            <p>
              <strong><a href="${pdfUrl}">Télécharger le constat en PDF</a></strong>
            </p>
          </div>

          <div class="footer">
            <p>Ce message a été envoyé automatiquement. Veuillez ne pas répondre à cet email.</p>
            <p>&copy; 2026 ClaimSphere. Tous droits réservés.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}
