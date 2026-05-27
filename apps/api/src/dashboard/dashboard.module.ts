import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { PatientsModule } from '../patients/patients.module';
import { CheckInsModule } from '../check-ins/check-ins.module';
import { Exercise } from '../exercises/entities/exercise.entity';
import { Prescription } from '../prescriptions/entities/prescription.entity';
import { Patient } from '../patients/entities/patient.entity';
import { Appointment } from '../appointments/entities/appointment.entity';

@Module({
  imports: [
    PatientsModule,
    CheckInsModule,
    TypeOrmModule.forFeature([Exercise, Prescription, Patient, Appointment]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
