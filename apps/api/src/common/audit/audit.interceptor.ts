import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditService } from './audit.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest();
    const response = ctx.getResponse();

    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: () => this.log(request, response.statusCode, startTime),
        error: (error) => this.log(request, error.status ?? 500, startTime, error.message),
      }),
    );
  }

  private static readonly SENSITIVE_QS_PARAMS = new Set([
    'password', 'token', 'accessToken', 'refreshToken', 'cpf', 'code',
  ]);

  private log(request: any, statusCode: number, startTime: number, errorMessage?: string) {
    const { method, originalUrl, params, ip, user } = request;
    const safePath = this.stripSensitiveQueryParams(originalUrl);
    const action = this.buildAction(method, safePath, !!errorMessage);

    void this.auditService.createLog({
      userId: user?.id,
      userEmail: user?.email,
      action,
      method,
      path: safePath,
      statusCode,
      resourceId: params?.id ?? null,
      ipAddress: ip,
      durationMs: Date.now() - startTime,
      metadata: errorMessage ? { errorMessage } : undefined,
    });
  }

  private stripSensitiveQueryParams(url: string): string {
    const [path, qs] = url.split('?');
    if (!qs) return url;

    const filtered = qs
      .split('&')
      .filter((pair) => {
        const key = pair.split('=')[0];
        return !AuditInterceptor.SENSITIVE_QS_PARAMS.has(key);
      })
      .join('&');

    return filtered ? `${path}?${filtered}` : path;
  }

  private buildAction(method: string, path: string, failed: boolean): string {
    const resource = path.split('/').filter(Boolean)[0]?.toUpperCase() ?? 'APP';
    const verbs: Record<string, string> = {
      GET: 'VIEWED',
      POST: 'CREATED',
      PATCH: 'UPDATED',
      PUT: 'UPDATED',
      DELETE: 'DELETED',
    };
    const verb = verbs[method] ?? 'ACCESSED';
    return `${resource}_${verb}${failed ? '_FAILED' : ''}`;
  }
}
