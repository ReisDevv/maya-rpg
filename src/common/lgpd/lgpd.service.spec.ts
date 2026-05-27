import { Test, TestingModule } from '@nestjs/testing';
import { LgpdService } from './lgpd.service';
import { AuditService } from '../audit/audit.service';
import { UploadService } from '../../upload/upload.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../../auth/entities/user.entity';
import { Patient } from '../../patients/entities/patient.entity';
import { Prescription } from '../../prescriptions/entities/prescription.entity';
import { CheckIn } from '../../check-ins/entities/check-in.entity';
import { MedicalRecord } from '../../medical-records/entities/medical-record.entity';
import { Appointment } from '../../appointments/entities/appointment.entity';
import { Exercise } from '../../exercises/entities/exercise.entity';

describe('LgpdService', () => {
  let service: LgpdService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LgpdService,
        { provide: getRepositoryToken(User), useValue: {} },
        { provide: getRepositoryToken(Patient), useValue: {} },
        { provide: getRepositoryToken(Prescription), useValue: {} },
        { provide: getRepositoryToken(CheckIn), useValue: {} },
        { provide: getRepositoryToken(MedicalRecord), useValue: {} },
        { provide: getRepositoryToken(Appointment), useValue: {} },
        { provide: getRepositoryToken(Exercise), useValue: {} },
        { provide: AuditService, useValue: { createLog: jest.fn() } },
        { provide: UploadService, useValue: {} },
      ],
    }).compile();

    service = module.get<LgpdService>(LgpdService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
