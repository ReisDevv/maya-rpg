import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    // Health-check probes on / produce expected 404s — skip logging them
    const isHealthProbe = request.url === '/' || request.url === '';
    if (!isHealthProbe) {
      const sanitizedBody = this.sanitize(request.body);
      this.logger.error(
        `HTTP ${status} [${request.method} ${request.url}]`,
        JSON.stringify({ body: sanitizedBody, error: message }),
      );
    }

    const sanitizedResponse =
      typeof message === 'object' ? this.sanitize(message as Record<string, unknown>) : message;

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: sanitizedResponse,
    });
  }

  private sanitize(obj: Record<string, unknown> | unknown[]): Record<string, unknown> | unknown[] {
    if (!obj || typeof obj !== 'object') return obj as unknown[];

    const sensitiveFields = new Set([
      'password',
      'newPassword',
      'cpf',
      'token',
      'accessToken',
      'refreshToken',
    ]);

    if (Array.isArray(obj)) {
      return obj.map((item) =>
        item && typeof item === 'object'
          ? this.sanitize(item as Record<string, unknown>)
          : item,
      );
    }

    const sanitized: Record<string, unknown> = {};
    for (const key of Object.keys(obj)) {
      const value = (obj as Record<string, unknown>)[key];
      if (sensitiveFields.has(key)) {
        sanitized[key] = '[FILTERED]';
      } else if (value && typeof value === 'object') {
        sanitized[key] = this.sanitize(value as Record<string, unknown>);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }
}
