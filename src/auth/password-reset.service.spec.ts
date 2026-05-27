import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PasswordResetService } from './password-reset.service';
import { User } from './entities/user.entity';
import { PasswordResetToken } from './entities/password-reset-token.entity';
import { RefreshTokenService } from './refresh-token.service';
import { MailService } from '../common/mail/mail.service';
import { UserRole } from '../common/enums/user-role.enum';

describe('PasswordResetService', () => {
  let service: PasswordResetService;
  let userRepo: {
    findOneBy: jest.Mock;
    save: jest.Mock;
    createQueryBuilder: jest.Mock;
  };
  let resetTokenRepo: {
    update: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    findOne: jest.Mock;
  };
  let refreshTokenService: { revokeAll: jest.Mock };
  let mailService: {
    sendPasswordReset: jest.Mock;
    sendVerificationCode: jest.Mock;
  };
  let userByEmailGetOne: jest.Mock;

  beforeEach(async () => {
    userByEmailGetOne = jest.fn();
    userRepo = {
      findOneBy: jest.fn(),
      save: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnThis(),
        getOne: userByEmailGetOne,
      }),
    };
    resetTokenRepo = {
      update: jest.fn().mockResolvedValue(undefined),
      create: jest.fn((entity) => entity),
      save: jest.fn((entity) => Promise.resolve(entity)),
      findOne: jest.fn(),
    };
    refreshTokenService = {
      revokeAll: jest.fn().mockResolvedValue(undefined),
    };
    mailService = {
      sendPasswordReset: jest.fn().mockResolvedValue(true),
      sendVerificationCode: jest.fn().mockResolvedValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PasswordResetService,
        { provide: getRepositoryToken(User), useValue: userRepo },
        {
          provide: getRepositoryToken(PasswordResetToken),
          useValue: resetTokenRepo,
        },
        { provide: RefreshTokenService, useValue: refreshTokenService },
        { provide: MailService, useValue: mailService },
      ],
    }).compile();

    service = module.get<PasswordResetService>(PasswordResetService);
  });

  it('should send a six-digit code to a patient email', async () => {
    userByEmailGetOne.mockResolvedValue({
      id: 'user-1',
      email: 'paciente@teste.com',
      role: UserRole.PATIENT,
    });

    const result = await service.requestPasswordResetCode(
      'Paciente@Teste.com ',
    );

    expect(result.requestId).toBeDefined();
    expect(resetTokenRepo.update).toHaveBeenCalledWith(
      { userId: 'user-1', used: false },
      { used: true },
    );
    expect(resetTokenRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        id: result.requestId,
        userId: 'user-1',
        used: false,
      }),
    );
    expect(mailService.sendVerificationCode).toHaveBeenCalledWith(
      'paciente@teste.com',
      expect.stringMatching(/^\d{6}$/),
      'Código para redefinir sua senha Maya RPG',
    );
  });

  it('should not send code when email does not belong to a patient', async () => {
    userByEmailGetOne.mockResolvedValue({
      id: 'admin-1',
      email: 'admin@teste.com',
      role: UserRole.ADMIN,
    });

    const result = await service.requestPasswordResetCode('admin@teste.com');

    expect(result.requestId).toBeDefined();
    expect(resetTokenRepo.save).not.toHaveBeenCalled();
    expect(mailService.sendVerificationCode).not.toHaveBeenCalled();
  });

  it('should reset password with a valid request id and code', async () => {
    resetTokenRepo.findOne.mockResolvedValue({
      id: 'request-1',
      userId: 'user-1',
      used: false,
    });
    userRepo.findOneBy.mockResolvedValue({
      id: 'user-1',
      role: UserRole.PATIENT,
      password: 'old-hash',
      mustChangePassword: true,
    });

    const result = await service.confirmPasswordResetCode(
      'request-1',
      '123456',
      'novaSenha123',
    );

    expect(result.message).toBe('Senha redefinida com sucesso');
    expect(userRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'user-1',
        mustChangePassword: false,
      }),
    );
    expect(resetTokenRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ used: true }),
    );
    expect(refreshTokenService.revokeAll).toHaveBeenCalledWith('user-1');
  });

  it('should reject invalid or expired codes', async () => {
    resetTokenRepo.findOne.mockResolvedValue(null);

    await expect(
      service.confirmPasswordResetCode('request-1', '000000', 'novaSenha123'),
    ).rejects.toThrow(BadRequestException);
  });
});
