import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThanOrEqual, Repository } from 'typeorm';
import { PatientsService } from '../patients/patients.service';
import { CheckInsService } from '../check-ins/check-ins.service';
import { Exercise } from '../exercises/entities/exercise.entity';
import { Prescription } from '../prescriptions/entities/prescription.entity';
import { Patient } from '../patients/entities/patient.entity';
import { PatientStatus } from '../common/enums/patient-status.enum';
import {
  Appointment,
  AppointmentStatus,
} from '../appointments/entities/appointment.entity';

@Injectable()
export class DashboardService {
  constructor(
    private readonly patientsService: PatientsService,
    private readonly checkInsService: CheckInsService,
    @InjectRepository(Exercise)
    private readonly exerciseRepo: Repository<Exercise>,
    @InjectRepository(Prescription)
    private readonly prescriptionRepo: Repository<Prescription>,
    @InjectRepository(Patient)
    private readonly patientRepo: Repository<Patient>,
    @InjectRepository(Appointment)
    private readonly appointmentRepo: Repository<Appointment>,
  ) {}

  async getProfessionalMetrics() {
    const now = new Date();
    const [
      activePatients,
      totalPatients,
      totalExercises,
      activePrescriptions,
      recentCheckIns,
      upcomingAppointments,
      nextAppointment,
    ] = await Promise.all([
      this.patientRepo.count({ where: { status: PatientStatus.ACTIVE } }),
      this.patientRepo.count(),
      this.exerciseRepo.count(),
      this.prescriptionRepo.count({ where: { isActive: true } }),
      this.checkInsService.countActiveCheckIns(7),
      this.appointmentRepo.count({
        where: {
          dateTime: MoreThanOrEqual(now),
          status: AppointmentStatus.CONFIRMED,
        },
      }),
      this.appointmentRepo.findOne({
        where: {
          dateTime: MoreThanOrEqual(now),
          status: AppointmentStatus.CONFIRMED,
        },
        relations: ['patient'],
        order: { dateTime: 'ASC' },
      }),
    ]);

    // Adesão proxy: check-ins recentes / pacientes ativos (limitado a 100%)
    const adherence =
      activePatients > 0 ? Math.min(1, recentCheckIns / activePatients) : 0;

    return {
      activePatients,
      totalExercises,
      activePrescriptions,
      upcomingAppointments,
      nextAppointment,
      averageAdherenceRate: Math.round(adherence * 100) / 100,
      // Compat com clientes antigos
      totalPatients,
      recentCheckIns,
      timestamp: new Date(),
    };
  }

  async getPainEvolution(patientId: string) {
    const checkIns =
      await this.checkInsService.findPainEvolutionByPatientId(patientId);

    return checkIns.map((ci) => ({
      date: ci.checkIn_executedAt,
      painLevel: ci.checkIn_painLevel,
    }));
  }
}
