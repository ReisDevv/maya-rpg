import { Controller, Post, Get, Body, Request, UnauthorizedException, Patch } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';

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
  login(@Request() req: any, @Body() dto: LoginDto) {
    return this.authService.login(dto, { ip: req.ip, ua: req.headers['user-agent'] });
  }

  @Public()
  @Post('refresh')
  async refresh(@Request() req: any, @Body('refreshToken') refreshToken: string) {
    if (!refreshToken) throw new UnauthorizedException('Refresh token não fornecido');
    const { user, newRefreshToken } = await this.refreshTokenService.rotate(refreshToken, {
      ip: req.ip,
      ua: req.headers['user-agent'],
    });
    return {
      accessToken: await this.authService.generateAccessToken(user),
      refreshToken: newRefreshToken,
    };
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
  async logout(@Body('refreshToken') refreshToken: string) {
    if (refreshToken) await this.refreshTokenService.revoke(refreshToken);
    return { message: 'Logout realizado' };
  }

  @Roles(UserRole.PATIENT, UserRole.PROFESSIONAL, UserRole.ADMIN)
  @Post('logout-all')
  async logoutAll(@CurrentUser() user: User) {
    await this.refreshTokenService.revokeAll(user.id);
    return { message: 'Todas as sessões encerradas' };
  }
}
