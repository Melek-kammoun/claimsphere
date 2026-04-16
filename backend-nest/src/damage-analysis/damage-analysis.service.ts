import {
  BadGatewayException,
  Injectable,
  InternalServerErrorException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

type PredictInput = {
  fileName: string;
  mimeType: string;
  buffer: Buffer;
  threshold?: number;
};

@Injectable()
export class DamageAnalysisService {
  constructor(private readonly config: ConfigService) {}

  async predict({ fileName, mimeType, buffer, threshold }: PredictInput) {
    const baseUrl = this.config.get<string>('COLAB_DAMAGE_API_URL');
    if (!baseUrl) {
      throw new ServiceUnavailableException(
        'COLAB_DAMAGE_API_URL is not configured in environment variables.',
      );
    }

    const form = new FormData();
    form.append('image', new Blob([new Uint8Array(buffer)], { type: mimeType }), fileName);
    if (threshold !== undefined) {
      form.append('threshold', String(threshold));
    }

    const response = await fetch(this.buildPredictUrl(baseUrl), {
      method: 'POST',
      body: form,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new BadGatewayException(
        `Colab damage API failed with status ${response.status}: ${errorText}`,
      );
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      const raw = await response.text();
      throw new InternalServerErrorException(
        `Unexpected response from Colab damage API: ${raw}`,
      );
    }

    return response.json();
  }

  private buildPredictUrl(baseUrl: string): string {
    return `${baseUrl.replace(/\/+$/, '')}/predict`;
  }
}
