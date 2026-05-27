import { Request } from 'express';

export interface MercadoPagoWebhookBody {
  action?: string;
  type?: string;
  data?: {
    id?: string;
  };
  live_mode?: boolean;
}

export interface MercadoPagoWebhookHeaders {
  'x-signature'?: string;
  'x-request-id'?: string;
}

export interface WebhookRequest extends Request {
  headers: MercadoPagoWebhookHeaders & Request['headers'];
  body: MercadoPagoWebhookBody;
}
