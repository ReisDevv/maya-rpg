import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { EmailChangeRequest } from './entities/email-change-request.entity';
import { RefreshTokenService } from './refresh-token.service';
import { MailService } from '../common/mail/mail.service';
import { generateNumericCode, sha256 } from '../common/crypto.util';

@Injectable()
export class EmailChangeService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(EmailChangeRequest)
    private readonly emailChangeRepo: Repository<EmailChangeRequest>,
    private readonly refreshTokenService: RefreshTokenService,
    private readonly mailService: MailService,
  ) {}

  async requestCurrentEmailChangeCode(userId: string) {
    const user = await this.userRepo.findOneBy({ id: userId });
    if (!user) throw new UnauthorizedException('Usuário não encontrado');

    await this.emailChangeRepo.update({ userId, used: false }, { used: true });

    const code = generateNumericCode();
    const request = this.emailChangeRepo.create({
      userId,
      currentCodeHash: sha256(code),
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      used: false,
      currentVerified: false,
    });
    await this.emailChangeRepo.save(request);
    await this.mailService.sendVerificationCode(
      user.email,
      code,
      'Código para autorizar troca de e-mail',
    );
    return {
      requestId: request.id,
      message: 'Código de verificação enviado para o e-mail atual.',
    };
  }

  async verifyCurrentEmailChangeCode(
    userId: string,
    requestId: string,
    code: string,
  ) {
    const request = await this.getActiveEmailChangeRequest(userId, requestId);
    if (request.currentCodeHash !== sha256(code)) {
      throw new BadRequestException('Código inválido');
    }

    request.currentVerified = true;
    await this.emailChangeRepo.save(request);
    return { message: 'Código validado. Informe o novo e-mail.' };
  }

  async requestNewEmailChangeCode(
    userId: string,
    requestId: string,
    newEmail: string,
    confirmEmail: string,
  ) {
    if (newEmail !== confirmEmail) {
      throw new BadRequestException('Os e-mails informados não conferem');
    }
    const request = await this.getActiveEmailChangeRequest(userId, requestId);
    if (!request.currentVerified) {
      throw new BadRequestException('Valide o e-mail atual antes de continuar');
    }

    const existing = await this.userRepo.findOneBy({ email: newEmail });
    if (existing && existing.id !== userId) {
      throw new ConflictException('E-mail já cadastrado');
    }

    const code = generateNumericCode();
    request.newEmail = newEmail;
    request.newCodeHash = sha256(code);
    request.expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    await this.emailChangeRepo.save(request);
    await this.mailService.sendVerificationCode(
      newEmail,
      code,
      'Código para confirmar novo e-mail',
    );
    return { message: 'Código de confirmação enviado para o novo e-mail.' };
  }

  async confirmNewEmailChangeCode(
    userId: string,
    requestId: string,
    code: string,
  ) {
    const request = await this.getActiveEmailChangeRequest(userId, requestId);
    if (!request.currentVerified || !request.newEmail || !request.newCodeHash) {
      throw new BadRequestException('Fluxo de troca de e-mail incompleto');
    }
    if (request.newCodeHash !== sha256(code)) {
      throw new BadRequestException('Código inválido');
    }

    const user = await this.userRepo.findOneBy({ id: userId });
    if (!user) throw new UnauthorizedException('Usuário não encontrado');

    const existing = await this.userRepo.findOneBy({ email: request.newEmail });
    if (existing && existing.id !== userId) {
      throw new ConflictException('E-mail já cadastrado');
    }

    user.email = request.newEmail;
    await this.userRepo.save(user);
    request.used = true;
    await this.emailChangeRepo.save(request);
    await this.refreshTokenService.revokeAll(user.id);

    return { message: 'E-mail alterado com sucesso. Faça login novamente.' };
  }

  private async getActiveEmailChangeRequest(userId: string, requestId: string) {
    const request = await this.emailChangeRepo.findOne({
      where: {
        id: requestId,
        userId,
        used: false,
        expiresAt: MoreThan(new Date()),
      },
    });
    if (!request) {
      throw new BadRequestException('Solicitação inválida ou expirada');
    }
    return request;
  }
}
