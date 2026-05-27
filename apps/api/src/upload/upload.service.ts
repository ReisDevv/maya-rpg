import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UploadService {
  constructor(private readonly configService: ConfigService) {}

  generateFileUrl(filename: string): string {
    const port = this.configService.get<number>('PORT') || 3000;
    // Tenta pegar API_URL nas variáveis de ambiente, caso contrário usa o localhost base
    const baseUrl =
      this.configService.get<string>('API_URL') || `http://localhost:${port}`;
    return `${baseUrl}/uploads/${filename}`;
  }
}
