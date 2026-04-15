export class ScanQrCodeDto {
  qr_token: string;

  // Metadata for logging
  user_agent?: string;
  ip_address?: string;
}
