import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface MailMessage {
  to: string;
  subject: string;
  text: string;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly config: ConfigService) {}

  async sendPatientCredentials(to: string, name: string, password: string) {
    return this.send({
      to,
      subject: 'Acesso ao aplicativo Maya RPG',
      text:
        `Olá, ${name}.\n\n` +
        'Seu acesso ao aplicativo Maya RPG foi criado.\n' +
        `E-mail: ${to}\n` +
        `Senha: ${password}\n\n` +
        'No primeiro acesso, o aplicativo solicitará a troca da senha.',
    });
  }

  async sendPasswordReset(to: string, token: string) {
    const resetBaseUrl = this.config.get<string>('PASSWORD_RESET_URL');
    const resetText = resetBaseUrl
      ? `Acesse o link para criar uma nova senha: ${resetBaseUrl}?token=${token}`
      : `Use este código para redefinir sua senha: ${token}`;

    return this.send({
      to,
      subject: 'Recuperação de senha Maya RPG',
      text:
        'Recebemos uma solicitação de recuperação de senha.\n\n' +
        `${resetText}\n\n` +
        'Se você não solicitou essa alteração, ignore esta mensagem.',
    });
  }

  async sendVerificationCode(to: string, code: string, subject: string) {
    return this.send({
      to,
      subject,
      text:
        `Seu código de verificação é: ${code}\n\n` +
        'Ele expira em 15 minutos. Se você não solicitou essa alteração, ignore esta mensagem.',
    });
  }

  async send(message: MailMessage): Promise<boolean> {
    const resendKey = this.config.get<string>('RESEND_API_KEY');
    const brevoKey = this.config.get<string>('BREVO_API_KEY');
    const from =
      this.config.get<string>('MAIL_FROM') ||
      'Maya RPG <noreply@maya-rpg.local>';

    if (resendKey) return this.sendViaResend(message, from, resendKey);
    if (brevoKey) return this.sendViaBrevo(message, from, brevoKey);

    this.logger.warn(
      `E-mail não enviado para ${message.to}: configure RESEND_API_KEY ou BREVO_API_KEY.`,
    );
    return false;
  }

  private async sendViaResend(
    message: MailMessage,
    from: string,
    apiKey: string,
  ) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from,
          to: [message.to],
          subject: message.subject,
          text: message.text,
        }),
      });

      return this.handleProviderResponse(response, 'Resend', message.to);
    } catch (error) {
      this.logger.error(
        `Falha de rede ao enviar e-mail via Resend para ${message.to}`,
        error,
      );
      return false;
    }
  }

  private async sendViaBrevo(
    message: MailMessage,
    from: string,
    apiKey: string,
  ) {
    const [senderName, senderEmail] = this.parseSender(from);
    try {
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sender: { name: senderName, email: senderEmail },
          to: [{ email: message.to }],
          subject: message.subject,
          textContent: message.text,
        }),
      });

      return this.handleProviderResponse(response, 'Brevo', message.to);
    } catch (error) {
      this.logger.error(
        `Falha de rede ao enviar e-mail via Brevo para ${message.to}`,
        error,
      );
      return false;
    }
  }

  private async handleProviderResponse(
    response: Response,
    provider: string,
    to: string,
  ) {
    if (response.ok) return true;

    const details = await response.text().catch(() => '');
    this.logger.error(
      `${provider} recusou e-mail para ${to}: ${response.status} ${details}`,
    );
    return false;
  }

  private parseSender(from: string): [string, string] {
    const match = from.match(/^(.*)<(.+)>$/);
    if (!match) return ['Maya RPG', from.trim()];
    return [match[1].trim(), match[2].trim()];
  }
}
