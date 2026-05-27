import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { LgpdController } from './lgpd.controller';
import { LgpdService } from './lgpd.service';
import { AuditService } from '../audit/audit.service';
import { AuditLog } from '../audit/audit-log.entity';

import { User } from '../../auth/entities/user.entity';
import { Patient } from '../../patients/entities/patient.entity';
import { Prescription } from '../../prescriptions/entities/prescription.entity';
import { Exercise } from '../../exercises/entities/exercise.entity';
import { CheckIn } from '../../check-ins/entities/check-in.entity';
import { MedicalRecord } from '../../medical-records/entities/medical-record.entity';
import { Appointment } from '../../appointments/entities/appointment.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Patient,
      Prescription,
      Exercise,
      CheckIn,
      MedicalRecord,
      Appointment,
      AuditLog,
    ]),
  ],
  controllers: [LgpdController],
  providers: [LgpdService, AuditService],
  exports: [LgpdService],
})
export class LgpdModule {}
