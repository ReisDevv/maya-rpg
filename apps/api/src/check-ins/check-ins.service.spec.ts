import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { CheckInsService } from './check-ins.service';
import { CheckIn } from './entities/check-in.entity';
import { Prescription } from '../prescriptions/entities/prescription.entity';
import { PatientsService } from '../patients/patients.service';

describe('CheckInsService', () => {
  let service: CheckInsService;
  let checkInRepo: {
    create: jest.Mock;
    save: jest.Mock;
    find: jest.Mock;
    findAndCount: jest.Mock;
    createQueryBuilder: jest.Mock;
  };
  let prescriptionRepo: { findOneBy: jest.Mock };
  let patientsService: { findByUserId: jest.Mock };

  beforeEach(async () => {
    const queryBuilder = {
      where: jest.fn().mockReturnThis(),
      getCount: jest.fn().mockResolvedValue(0),
      select: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue([]),
    };

    checkInRepo = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findAndCount: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
    };
    prescriptionRepo = { findOneBy: jest.fn() };
    patientsService = { findByUserId: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CheckInsService,
        { provide: getRepositoryToken(CheckIn), useValue: checkInRepo },
        {
          provide: getRepositoryToken(Prescription),
          useValue: prescriptionRepo,
        },
        { provide: PatientsService, useValue: patientsService },
      ],
    }).compile();

    service = module.get<CheckInsService>(CheckInsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should throw NotFoundException when prescription not found', async () => {
      patientsService.findByUserId.mockResolvedValue({ id: 'patient-1' });
      prescriptionRepo.findOneBy.mockResolvedValue(null);

      await expect(
        service.create(
          {
            prescriptionId: 'rx-1',
            exerciseId: 'ex-1',
            painLevel: 3,
            isCompleted: true,
            executedAt: new Date().toISOString(),
          },
          'user-1',
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when exercise not in prescription', async () => {
      patientsService.findByUserId.mockResolvedValue({ id: 'patient-1' });
      prescriptionRepo.findOneBy.mockResolvedValue({
        id: 'rx-1',
        patientId: 'patient-1',
        exercises: [{ exerciseId: 'ex-other' }],
      });

      await expect(
        service.create(
          {
            prescriptionId: 'rx-1',
            exerciseId: 'ex-1',
            painLevel: 3,
            isCompleted: true,
            executedAt: new Date().toISOString(),
          },
          'user-1',
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('findAllByPatientPaginated', () => {
    it('should return paginated check-ins', async () => {
      patientsService.findByUserId.mockResolvedValue({ id: 'patient-1' });
      checkInRepo.findAndCount.mockResolvedValue([[], 0]);

      const result = await service.findAllByPatientPaginated('user-1', 1, 20);

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('total', 0);
      expect(result).toHaveProperty('page', 1);
      expect(result).toHaveProperty('pageSize', 20);
    });
  });

  describe('countActiveCheckIns', () => {
    it('should return count from query builder', async () => {
      const qb = checkInRepo.createQueryBuilder();
      qb.getCount.mockResolvedValue(5);

      const result = await service.countActiveCheckIns(7);
      expect(result).toBe(5);
    });
  });
});
