import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UnauthorizedException, ConflictException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RefreshTokenService } from './refresh-token.service';
import { User } from './entities/user.entity';
import { Patient } from '../patients/entities/patient.entity';
import { UserRole } from '../common/enums/user-role.enum';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;
  let userRepo: {
    findOneBy: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    createQueryBuilder: jest.Mock;
  };
  let patientRepo: { findOneBy: jest.Mock; save: jest.Mock };
  let jwtService: { sign: jest.Mock };
  let refreshTokenService: { create: jest.Mock };
  let userByEmailGetOne: jest.Mock;

  beforeEach(async () => {
    userByEmailGetOne = jest.fn();
    userRepo = {
      findOneBy: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnThis(),
        getOne: userByEmailGetOne,
      }),
    };
    patientRepo = {
      findOneBy: jest.fn(),
      save: jest.fn(),
    };
    jwtService = { sign: jest.fn().mockReturnValue('test-jwt-token') };
    refreshTokenService = {
      create: jest.fn().mockResolvedValue('test-refresh-token'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: userRepo },
        { provide: getRepositoryToken(Patient), useValue: patientRepo },
        { provide: JwtService, useValue: jwtService },
        { provide: RefreshTokenService, useValue: refreshTokenService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('login', () => {
    it('should throw UnauthorizedException when user not found', async () => {
      userByEmailGetOne.mockResolvedValue(null);
      patientRepo.findOneBy.mockResolvedValue(null);

      await expect(
        service.login({ identifier: 'unknown@test.com', password: 'pass' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when password is wrong', async () => {
      const hashedPassword = await bcrypt.hash('correct-password', 10);
      userByEmailGetOne.mockResolvedValue({
        id: 'user-1',
        email: 'test@test.com',
        password: hashedPassword,
        isActive: true,
        role: UserRole.PATIENT,
        mustChangePassword: false,
        lgpdAcceptedAt: new Date(),
        lgpdAcceptedVersion: '2',
      });

      await expect(
        service.login({
          identifier: 'test@test.com',
          password: 'wrong-password',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should return tokens on successful email login', async () => {
      const hashedPassword = await bcrypt.hash('mypassword', 10);
      userByEmailGetOne.mockResolvedValue({
        id: 'user-1',
        email: 'test@test.com',
        password: hashedPassword,
        isActive: true,
        role: UserRole.PATIENT,
        mustChangePassword: false,
        lgpdAcceptedAt: new Date(),
        lgpdAcceptedVersion: '2',
      });

      const result = await service.login({
        identifier: 'test@test.com',
        password: 'mypassword',
      });

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user.email).toBe('test@test.com');
    });

    it('should throw UnauthorizedException when user is inactive', async () => {
      const hashedPassword = await bcrypt.hash('mypassword', 10);
      userByEmailGetOne.mockResolvedValue({
        id: 'user-1',
        email: 'inactive@test.com',
        password: hashedPassword,
        isActive: false,
        role: UserRole.PATIENT,
      });

      await expect(
        service.login({
          identifier: 'inactive@test.com',
          password: 'mypassword',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('register', () => {
    it('should throw ConflictException when email already exists', async () => {
      userByEmailGetOne.mockResolvedValue({ id: 'existing-user' });

      await expect(
        service.register({
          name: 'Test',
          email: 'existing@test.com',
          password: '123456',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should create a new patient user successfully', async () => {
      userByEmailGetOne.mockResolvedValue(null);
      userRepo.create.mockReturnValue({
        id: 'new-user',
        name: 'New User',
        email: 'new@test.com',
        role: UserRole.PATIENT,
      });
      userRepo.save.mockResolvedValue({
        id: 'new-user',
        name: 'New User',
        email: 'new@test.com',
        role: UserRole.PATIENT,
      });

      const result = await service.register({
        name: 'New User',
        email: 'new@test.com',
        password: '123456',
      });

      expect(result.role).toBe(UserRole.PATIENT);
      expect(result.email).toBe('new@test.com');
    });
  });

  describe('changePassword', () => {
    it('should throw BadRequestException when password is too short', async () => {
      userRepo.findOneBy.mockResolvedValue({ id: 'user-1' });

      await expect(service.changePassword('user-1', 'abc')).rejects.toThrow();
    });
  });
});
