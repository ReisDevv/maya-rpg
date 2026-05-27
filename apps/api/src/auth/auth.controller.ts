import { Controller, Post, Get, Body, Request, Response, UnauthorizedException, Patch } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request as ExpressRequest, Response as ExpressResponse, CookieOptions } from 'express';

import { AuthService } from './auth.service';
import { EmailChangeService } from './email-change.service';
import { PasswordResetService } from './password-reset.service';
import { RefreshTokenService } from './refresh-token.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { CreateStaffDto } from './dto/create-staff.dto';
import {
  ConfirmPasswordResetCodeDto,
  RequestPasswordResetCodeDto,
  ResetPasswordDto,
} from './dto/reset-password.dto';
import {
  ConfirmNewEmailCodeDto,
  RequestNewEmailCodeDto,
  VerifyCurrentEmailCodeDto,
} from './dto/email-change.dto';
import { Public } from './decorators/public.decorator';
import { Roles } from './decorators/roles.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { User } from './entities/user.entity';

const REFRESH_COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: 'none', // necessário para cross-site (Vercel → Render em domínios diferentes)
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/api/auth/refresh',
};

function isWebClient(req: ExpressRequest): boolean {
  return req.headers['x-client-type'] === 'web';
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly refreshTokenService: RefreshTokenService,
    private readonly emailChangeService: EmailChangeService,
    private readonly passwordResetService: PasswordResetService,
  ) {}

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('login')
  async login(
    @Request() req: ExpressRequest,
    @Response() res: ExpressResponse,
    @Body() dto: LoginDto,
  ) {
    const result = await this.authService.login(dto, { ip: req.ip, ua: req.headers['user-agent'] });

    if (isWebClient(req)) {
      res.cookie('refreshToken', result.refreshToken, REFRESH_COOKIE_OPTIONS);
      const { refreshToken: _rt, ...payload } = result;
      return res.json(payload);
    }

    return res.json(result);
  }

  @Public()
  @Post('refresh')
  async refresh(@Request() req: ExpressRequest, @Response() res: ExpressResponse) {
    const web = isWebClient(req);
    const refreshToken: string | undefined = web
      ? (req.cookies as Record<string, string>)?.refreshToken
      : (req.body as Record<string, string>)?.refreshToken;

    if (!refreshToken) throw new UnauthorizedException('Refresh token não fornecido');

    const { user, newRefreshToken } = await this.refreshTokenService.rotate(refreshToken, {
      ip: req.ip,
      ua: req.headers['user-agent'],
    });
    const accessToken = await this.authService.generateAccessToken(user);

    if (web) {
      res.cookie('refreshToken', newRefreshToken, REFRESH_COOKIE_OPTIONS);
      return res.json({ accessToken });
    }

    return res.json({ accessToken, refreshToken: newRefreshToken });
  }

  @Public()
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Roles(UserRole.ADMIN)
  @Post('staff')
  createStaff(@Body() dto: CreateStaffDto) {
    return this.authService.createStaff(dto);
  }

  @Roles(UserRole.PATIENT, UserRole.PROFESSIONAL, UserRole.ADMIN)
  @Get('me')
  getProfile(@CurrentUser() user: User) {
    return this.authService.getProfile(user.id);
  }

  @Roles(UserRole.PATIENT, UserRole.PROFESSIONAL, UserRole.ADMIN)
  @Throttle({ default: { limit: 3, ttl: 300000 } })
  @Post('change-password')
  changePassword(@CurrentUser() user: User, @Body('newPassword') newPassword: string) {
    return this.authService.changePassword(user.id, newPassword);
  }

  @Roles(UserRole.PATIENT, UserRole.PROFESSIONAL, UserRole.ADMIN)
  @Post('accept-lgpd')
  acceptLgpd(@CurrentUser() user: User) {
    return this.authService.acceptLgpd(user.id);
  }

  @Roles(UserRole.PATIENT, UserRole.PROFESSIONAL, UserRole.ADMIN)
  @Patch('fcm-token')
  updateFcmToken(@CurrentUser() user: User, @Body('fcmToken') fcmToken: string) {
    return this.authService.updateFcmToken(user.id, fcmToken);
  }

  @Roles(UserRole.PATIENT, UserRole.PROFESSIONAL, UserRole.ADMIN)
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Post('email-change/request-current')
  requestCurrentEmailChangeCode(@CurrentUser() user: User) {
    return this.emailChangeService.requestCurrentEmailChangeCode(user.id);
  }

  @Roles(UserRole.PATIENT, UserRole.PROFESSIONAL, UserRole.ADMIN)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('email-change/verify-current')
  verifyCurrentEmailChangeCode(@CurrentUser() user: User, @Body() dto: VerifyCurrentEmailCodeDto) {
    return this.emailChangeService.verifyCurrentEmailChangeCode(user.id, dto.requestId, dto.code);
  }

  @Roles(UserRole.PATIENT, UserRole.PROFESSIONAL, UserRole.ADMIN)
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Post('email-change/request-new')
  requestNewEmailChangeCode(@CurrentUser() user: User, @Body() dto: RequestNewEmailCodeDto) {
    return this.emailChangeService.requestNewEmailChangeCode(
      user.id,
      dto.requestId,
      dto.newEmail,
      dto.confirmEmail,
    );
  }

  @Roles(UserRole.PATIENT, UserRole.PROFESSIONAL, UserRole.ADMIN)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('email-change/confirm-new')
  confirmNewEmailChangeCode(@CurrentUser() user: User, @Body() dto: ConfirmNewEmailCodeDto) {
    return this.emailChangeService.confirmNewEmailChangeCode(user.id, dto.requestId, dto.code);
  }

  @Public()
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Post('recover-password')
  recoverPassword(@Body('email') email: string) {
    return this.passwordResetService.recoverPassword(email);
  }

  @Public()
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Post('password-reset/request-code')
  requestPasswordResetCode(@Body() dto: RequestPasswordResetCodeDto) {
    return this.passwordResetService.requestPasswordResetCode(dto.email);
  }

  @Public()
  @Get('lgpd-policy')
  getLgpdPolicy() {
    return this.authService.getLgpdPolicy();
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('reset-password')
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.passwordResetService.resetPassword(dto.token, dto.newPassword);
  }

  // POST /api/auth/password-reset/confirm-code — valida código e grava a nova senha
  @Public()
  @Throttle({ default: { limit: 3, ttl: 300000 } })
  @Post('password-reset/confirm-code')
  confirmPasswordResetCode(@Body() dto: ConfirmPasswordResetCodeDto) {
    return this.passwordResetService.confirmPasswordResetCode(
      dto.requestId,
      dto.code,
      dto.newPassword,
    );
  }

  @Public()
  @Post('logout')
  async logout(@Request() req: ExpressRequest, @Response() res: ExpressResponse) {
    const web = isWebClient(req);
    const refreshToken: string | undefined = web
      ? (req.cookies as Record<string, string>)?.refreshToken
      : (req.body as Record<string, string>)?.refreshToken;

    if (refreshToken) await this.refreshTokenService.revoke(refreshToken);

    if (web) {
      res.clearCookie('refreshToken', { path: '/api/auth/refresh' });
    }

    return res.json({ message: 'Logout realizado' });
  }

  @Roles(UserRole.PATIENT, UserRole.PROFESSIONAL, UserRole.ADMIN)
  @Post('logout-all')
  async logoutAll(@CurrentUser() user: User) {
    await this.refreshTokenService.revokeAll(user.id);
    return { message: 'Todas as sessões encerradas' };
  }
}
