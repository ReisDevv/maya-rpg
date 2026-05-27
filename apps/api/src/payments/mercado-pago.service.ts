import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { PaymentStatus } from './entities/payment.entity';

export interface PreferenceResult {
  id: string;
  initPoint: string;
}

export interface MpPaymentInfo {
  status: string;
  preference_id: string;
  id: string;
}

@Injectable()
export class MercadoPagoService {
  private readonly logger = new Logger(MercadoPagoService.name);
  private readonly accessToken: string;
  private readonly webhookSecret: string;
  private readonly notificationUrl: string;
  private readonly baseUrl = 'https://api.mercadopago.com';

  constructor(private readonly configService: ConfigService) {
    this.accessToken = this.configService.get<string>('MP_ACCESS_TOKEN') || '';
    this.webhookSecret =
      this.configService.get<string>('MP_WEBHOOK_SECRET') || '';
    this.notificationUrl =
      this.configService.get<string>('MP_NOTIFICATION_URL') || '';
  }

  async createPreference(
    amount: number,
    description: string,
    externalReference: string,
  ): Promise<PreferenceResult> {
    if (!this.accessToken) {
      throw new Error(
        'MP_ACCESS_TOKEN não configurado. Defina a variável de ambiente.',
      );
    }

    const body = {
      items: [
        {
          id: externalReference,
          title: description,
          quantity: 1,
          unit_price: Number(amount),
          currency_id: 'BRL',
        },
      ],
      external_reference: externalReference,
      ...(this.notificationUrl && {
        notification_url: this.notificationUrl,
      }),
    };

    const response = await fetch(`${this.baseUrl}/checkout/preferences`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      this.logger.error(
        `Erro ao criar preferência MP: ${response.status} ${errorText}`,
      );
      throw new Error(
        `Falha ao criar preferência no Mercado Pago: ${response.status}`,
      );
    }

    const data = (await response.json()) as Record<string, unknown>;

    return {
      id: data.id as string,
      initPoint: data.init_point as string,
    };
  }

  async getPaymentInfo(mpPaymentId: string): Promise<MpPaymentInfo> {
    if (!this.accessToken) {
      throw new Error('MP_ACCESS_TOKEN não configurado.');
    }

    const response = await fetch(`${this.baseUrl}/v1/payments/${mpPaymentId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      this.logger.error(
        `Erro ao consultar pagamento MP ${mpPaymentId}: ${response.status} ${errorText}`,
      );
      throw new Error(
        `Falha ao consultar pagamento no Mercado Pago: ${response.status}`,
      );
    }

    return (await response.json()) as MpPaymentInfo;
  }

  verifySignature(
    xSignatureHeader: string,
    xRequestId: string | undefined,
    dataId: string,
  ): boolean {
    if (!this.webhookSecret) {
      const nodeEnv = process.env.NODE_ENV;
      if (nodeEnv === 'production') {
        this.logger.error(
          'MP_WEBHOOK_SECRET não configurado em produção — rejeitando webhook.',
        );
        return false;
      }
      this.logger.warn(
        'MP_WEBHOOK_SECRET não configurado — pulando validação (apenas em dev/test).',
      );
      return false;
    }

    const parsed = this.parseSignatureHeader(xSignatureHeader);
    if (!parsed) {
      this.logger.warn('Header x-signature com formato inválido.');
      return false;
    }

    const { ts, v1 } = parsed;

    const manifestParts: string[] = [];
    if (xRequestId) {
      manifestParts.push(`id:${xRequestId}`);
    }
    if (dataId) {
      manifestParts.push(`data_id:${dataId}`);
    }
    manifestParts.push(`ts:${ts}`);
    const manifest = manifestParts.join(';');

    const expectedSignature = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(manifest)
      .digest('hex');

    try {
      const a = Buffer.from(expectedSignature, 'hex');
      const b = Buffer.from(v1, 'hex');
      if (a.length !== b.length) return false;
      return crypto.timingSafeEqual(a, b);
    } catch {
      this.logger.warn('Falha na comparação timing-safe da assinatura.');
      return false;
    }
  }

  mapStatus(mpStatus: string): PaymentStatus {
    switch (mpStatus) {
      case 'approved':
        return PaymentStatus.APPROVED;
      case 'pending':
      case 'in_process':
      case 'authorized':
        return PaymentStatus.PENDING;
      case 'rejected':
      case 'cancelled':
      case 'refunded':
      case 'charged_back':
        return PaymentStatus.REJECTED;
      default:
        this.logger.warn(
          `Status MP desconhecido "${mpStatus}" — mapeando para PENDING.`,
        );
        return PaymentStatus.PENDING;
    }
  }

  private parseSignatureHeader(
    header: string,
  ): { ts: string; v1: string } | null {
    const parts = header.split(',');
    let ts: string | null = null;
    let v1: string | null = null;

    for (const part of parts) {
      const [key, ...rest] = part.split('=');
      const trimmedKey = key.trim();
      const value = rest.join('=').trim();
      if (trimmedKey === 'ts') ts = value;
      if (trimmedKey === 'v1') v1 = value;
    }

    if (!ts || !v1) return null;
    return { ts, v1 };
  }
}
