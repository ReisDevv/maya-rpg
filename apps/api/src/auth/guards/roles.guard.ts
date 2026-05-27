import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';

const FIRST_ACCESS_ALLOWED_PATHS = [
  '/api/auth/change-password',
  '/api/auth/accept-lgpd',
  '/api/auth/me',
  '/api/auth/logout',
  '/api/patients/me',
];

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles?.length) {
      throw new ForbiddenException('Acesso negado: endpoint sem @Roles definido');
    }

    const request = context.switchToHttp().getRequest();
    const { user } = request;

    if (!user) throw new ForbiddenException('Acesso negado');

    if (
      user.mustChangePassword &&
      !FIRST_ACCESS_ALLOWED_PATHS.some((path) => request.url.startsWith(path))
    ) {
      throw new ForbiddenException('Troca de senha obrigatória');
    }

    if (!requiredRoles.includes(user.role)) {
      throw new ForbiddenException('Você não tem permissão para acessar este recurso');
    }

    return true;
  }
}
