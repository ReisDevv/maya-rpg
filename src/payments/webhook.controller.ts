import { Controller, Post, Req, Res, Logger, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import { Throttle } from '@nestjs/throttler';
import { PaymentsService } from './payments.service';
import { MercadoPagoService } from './mercado-pago.service';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import {
  WebhookRequest,
  MercadoPagoWebhookBody,
  MercadoPagoWebhookHeaders,
} from './interfaces';

@ApiTags('webhooks')
@Controller('webhooks')
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);
  private readonly webhookSecret: string;

  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly mercadoPagoService: MercadoPagoService,
    private readonly configService: ConfigService,
  ) {
    this.webhookSecret =
      this.configService.get<string>('MP_WEBHOOK_SECRET') || '';
  }

  @Post('mercadopago')
  @Public()
  @Throttle({ default: { limit: 200, ttl: 60000 } })
  @ApiOperation({ summary: 'Webhook Mercado Pago (público)' })
  async handleWebhook(
    @Req()
    req: WebhookRequest & {
      headers: MercadoPagoWebhookHeaders;
      body: MercadoPagoWebhookBody;
    },
    @Res() res: Response,
  ) {
    if (!this.webhookSecret) {
      this.logger.error(
        'Webhook MP: MP_WEBHOOK_SECRET não configurado — rejeitando evento.',
      );
      return res.status(HttpStatus.FORBIDDEN).json({
        message: 'Webhook não configurado no servidor.',
      });
    }

    try {
      const xSignature = req.headers['x-signature'];
      const xRequestId = req.headers['x-request-id'];
      const body: MercadoPagoWebhookBody = req.body ?? {
        action: undefined,
        type: undefined,
        data: { id: undefined },
        live_mode: undefined,
      };
      const dataId = body.data?.id;

      if (!xSignature) {
        this.logger.warn(
          'Webhook MP: x-signature ausente — rejeitando evento.',
        );
        return res.status(HttpStatus.FORBIDDEN).json({ message: 'Assinatura ausente.' });
      }

      const isValid = this.mercadoPagoService.verifySignature(
        xSignature,
        xRequestId,
        dataId ?? '',
      );
      if (!isValid) {
        this.logger.warn(
          'Webhook MP: assinatura inválida — rejeitando evento.',
        );
        return res.status(HttpStatus.FORBIDDEN).json({ message: 'Assinatura inválida.' });
      }

      if (body.type !== 'payment' || !dataId) {
        this.logger.debug(
          `Webhook MP: evento ignorado (type=${body.type ?? 'undefined'}, dataId=${dataId ?? 'undefined'}).`,
        );
        return res.status(HttpStatus.OK).json({ received: true });
      }

      await this.paymentsService.handleWebhook(dataId);
      return res.status(HttpStatus.OK).json({ received: true });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Webhook MP: erro ao processar — ${msg}`, stack);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Erro interno.' });
    }
  }
}
