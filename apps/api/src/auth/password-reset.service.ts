import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import { generateNumericCode, sha256, randomToken, validatePasswordStrength } from '../common/crypto.util';
import { MoreThan, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { PasswordResetToken } from './entities/password-reset-token.entity';
import { RefreshTokenService } from './refresh-token.service';
import { MailService } from '../common/mail/mail.service';
import { UserRole } from '../common/enums/user-role.enum';

@Injectable()
export class PasswordResetService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(PasswordResetToken)
    private readonly resetTokenRepo: Repository<PasswordResetToken>,
    private readonly refreshTokenService: RefreshTokenService,
    private readonly mailService: MailService,
  ) {}

  async recoverPassword(email: string) {
    const genericResponse = {
      message: 'Se o e-mail existir, você receberá um link de recuperação.',
    };

    if (!email) {
      return genericResponse;
    }

    const user = await this.findUserByEmailInsensitive(email.trim().toLowerCase());
    if (!user) {
      return genericResponse;
    }

    await this.resetTokenRepo.update(
      { userId: user.id, used: false },
      { used: true },
    );

    const rawToken = randomToken(32);
    const tokenHash = sha256(rawToken);

    const entity = this.resetTokenRepo.create({
      userId: user.id,
      tokenHash,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      used: false,
    });
    await this.resetTokenRepo.save(entity);

    await this.mailService.sendPasswordReset(user.email, rawToken);

    return genericResponse;
  }

  async requestPasswordResetCode(email: string) {
    const requestId = randomUUID();
    const genericResponse = {
      requestId,
      message: 'Se o e-mail existir, você receberá um código de recuperação.',
    };

    const normalizedEmail = email?.trim().toLowerCase();
    if (!normalizedEmail) {
      return genericResponse;
    }

    const user = await this.findUserByEmailInsensitive(normalizedEmail);
    if (!user || user.role !== UserRole.PATIENT) {
      return genericResponse;
    }

    await this.resetTokenRepo.update(
      { userId: user.id, used: false },
      { used: true },
    );

    const code = generateNumericCode();
    const entity = this.resetTokenRepo.create({
      id: requestId,
      userId: user.id,
      tokenHash: sha256(`${requestId}:${code}`),
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      used: false,
    });
    await this.resetTokenRepo.save(entity);

    await this.mailService.sendVerificationCode(
      user.email,
      code,
      'Código para redefinir sua senha Maya RPG',
    );

    return genericResponse;
  }

  async resetPassword(token: string, newPassword: string) {
    if (!token) {
      throw new BadRequestException('Token obrigatório');
    }
    const passwordError = validatePasswordStrength(newPassword);
    if (passwordError) {
      throw new BadRequestException(passwordError);
    }

    const tokenHash = sha256(token);
    const stored = await this.resetTokenRepo.findOne({
      where: {
        tokenHash,
        used: false,
        expiresAt: MoreThan(new Date()),
      },
    });

    if (!stored) {
      throw new BadRequestException('Token inválido ou expirado');
    }

    const user = await this.userRepo.findOneBy({ id: stored.userId });
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    user.password = await bcrypt.hash(newPassword, 12);
    user.mustChangePassword = false;
    await this.userRepo.save(user);

    stored.used = true;
    await this.resetTokenRepo.save(stored);

    await this.refreshTokenService.revokeAll(user.id);

    return { message: 'Senha redefinida com sucesso' };
  }

  async confirmPasswordResetCode(
    requestId: string,
    code: string,
    newPassword: string,
  ) {
    if (!requestId || !code) {
      throw new BadRequestException('Código obrigatório');
    }
    const passwordError = validatePasswordStrength(newPassword);
    if (passwordError) {
      throw new BadRequestException(passwordError);
    }

    const stored = await this.resetTokenRepo.findOne({
      where: {
        id: requestId,
        tokenHash: sha256(`${requestId}:${code.trim()}`),
        used: false,
        expiresAt: MoreThan(new Date()),
      },
    });

    if (!stored) {
      throw new BadRequestException('Código inválido ou expirado');
    }

    const user = await this.userRepo.findOneBy({ id: stored.userId });
    if (!user || user.role !== UserRole.PATIENT) {
      throw new NotFoundException('Paciente não encontrado');
    }

    user.password = await bcrypt.hash(newPassword, 12);
    user.mustChangePassword = false;
    await this.userRepo.save(user);

    stored.used = true;
    await this.resetTokenRepo.save(stored);

    await this.refreshTokenService.revokeAll(user.id);

    return { message: 'Senha redefinida com sucesso' };
  }

  private findUserByEmailInsensitive(email: string) {
    return this.userRepo
      .createQueryBuilder('user')
      .where('LOWER(user.email) = :email', { email: email.toLowerCase() })
      .getOne();
  }
}
