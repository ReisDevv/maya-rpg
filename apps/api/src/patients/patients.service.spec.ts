import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { PatientsService } from './patients.service';
import { Patient } from './entities/patient.entity';
import { User } from '../auth/entities/user.entity';
import { MailService } from '../common/mail/mail.service';
import { NotificationsService } from '../notifications/notifications.service';

describe('PatientsService', () => {
  let service: PatientsService;
  let patientRepo: {
    findOne: jest.Mock;
    findOneBy: jest.Mock;
    createQueryBuilder: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    remove: jest.Mock;
  };
  let userRepo: {
    findOneBy: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    createQueryBuilder: jest.Mock;
  };
  let mailService: { sendPatientCredentials: jest.Mock };
  let notificationsService: { sendPushNotification: jest.Mock };

  beforeEach(async () => {
    const queryBuilder = {
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getCount: jest.fn().mockResolvedValue(0),
      getMany: jest.fn().mockResolvedValue([]),
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue(null),
    };

    patientRepo = {
      findOne: jest.fn(),
      findOneBy: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
    };
    userRepo = {
      findOneBy: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      }),
    };
    mailService = { sendPatientCredentials: jest.fn() };
    notificationsService = { sendPushNotification: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PatientsService,
        { provide: getRepositoryToken(Patient), useValue: patientRepo },
        { provide: getRepositoryToken(User), useValue: userRepo },
        { provide: MailService, useValue: mailService },
        { provide: NotificationsService, useValue: notificationsService },
      ],
    }).compile();

    service = module.get<PatientsService>(PatientsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findByUserId', () => {
    it('should throw NotFoundException when patient not found', async () => {
      patientRepo.findOneBy.mockResolvedValue(null);

      await expect(service.findByUserId('nonexistent-user')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return patient when found by userId', async () => {
      const mockPatient = {
        id: 'patient-1',
        userId: 'user-1',
        fullName: 'Test',
      };
      patientRepo.findOneBy.mockResolvedValue(mockPatient);

      const result = await service.findByUserId('user-1');
      expect(result).toEqual(mockPatient);
    });
  });

  describe('findAll', () => {
    it('should return paginated results with defaults', async () => {
      const result = await service.findAll();
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('page', 1);
      expect(result).toHaveProperty('pageSize', 10);
    });
  });
});
