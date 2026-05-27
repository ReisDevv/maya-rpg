import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DashboardService } from './dashboard.service';
import { PatientsService } from '../patients/patients.service';
import { CheckInsService } from '../check-ins/check-ins.service';
import { Exercise } from '../exercises/entities/exercise.entity';
import { Prescription } from '../prescriptions/entities/prescription.entity';
import { Patient } from '../patients/entities/patient.entity';
import { PatientStatus } from '../common/enums/patient-status.enum';
import { Appointment } from '../appointments/entities/appointment.entity';

describe('DashboardService', () => {
  let service: DashboardService;
  let checkInsService: jest.Mocked<Partial<CheckInsService>>;
  let exerciseRepo: { count: jest.Mock };
  let prescriptionRepo: { count: jest.Mock };
  let patientRepo: { count: jest.Mock };
  let appointmentRepo: { count: jest.Mock; findOne: jest.Mock };

  beforeEach(async () => {
    checkInsService = {
      countActiveCheckIns: jest.fn(),
    };
    exerciseRepo = { count: jest.fn() };
    prescriptionRepo = { count: jest.fn() };
    patientRepo = { count: jest.fn() };
    appointmentRepo = { count: jest.fn(), findOne: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        { provide: PatientsService, useValue: {} },
        { provide: CheckInsService, useValue: checkInsService },
        { provide: getRepositoryToken(Exercise), useValue: exerciseRepo },
        {
          provide: getRepositoryToken(Prescription),
          useValue: prescriptionRepo,
        },
        { provide: getRepositoryToken(Patient), useValue: patientRepo },
        { provide: getRepositoryToken(Appointment), useValue: appointmentRepo },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
  });

  // Test 1: Verifica instanciação
  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // Test 2: Calcula as métricas corretamente para números válidos
  it('should calculate metrics correctly', async () => {
    patientRepo.count.mockResolvedValueOnce(4).mockResolvedValueOnce(10);
    exerciseRepo.count.mockResolvedValue(8);
    prescriptionRepo.count.mockResolvedValue(3);
    checkInsService.countActiveCheckIns.mockResolvedValue(5);
    appointmentRepo.count.mockResolvedValue(2);
    appointmentRepo.findOne.mockResolvedValue({ id: 'appointment-1' });

    const result = await service.getProfessionalMetrics();

    expect(patientRepo.count).toHaveBeenNthCalledWith(1, {
      where: { status: PatientStatus.ACTIVE },
    });
    expect(result.totalPatients).toBe(10);
    expect(result.activePatients).toBe(4);
    expect(result.totalExercises).toBe(8);
    expect(result.activePrescriptions).toBe(3);
    expect(result.upcomingAppointments).toBe(2);
    expect(result.nextAppointment).toEqual({ id: 'appointment-1' });
    expect(result.recentCheckIns).toBe(5);
    expect(result.averageAdherenceRate).toBe(1);
  });

  // Test 3: Trata ausência de pacientes sem estourar erro matemático
  it('should handle zero patients gracefully', async () => {
    patientRepo.count.mockResolvedValueOnce(0).mockResolvedValueOnce(0);
    exerciseRepo.count.mockResolvedValue(0);
    prescriptionRepo.count.mockResolvedValue(0);
    checkInsService.countActiveCheckIns.mockResolvedValue(0);
    appointmentRepo.count.mockResolvedValue(0);
    appointmentRepo.findOne.mockResolvedValue(null);

    const result = await service.getProfessionalMetrics();

    expect(result.totalPatients).toBe(0);
    expect(result.averageAdherenceRate).toBe(0);
  });

  // Test 4: Trata múltiplos check-ins do mesmo paciente (adesão > 1)
  it('should handle more check-ins than patients (e.g., multiple sessions)', async () => {
    patientRepo.count.mockResolvedValueOnce(2).mockResolvedValueOnce(2);
    exerciseRepo.count.mockResolvedValue(0);
    prescriptionRepo.count.mockResolvedValue(0);
    checkInsService.countActiveCheckIns.mockResolvedValue(6);
    appointmentRepo.count.mockResolvedValue(0);
    appointmentRepo.findOne.mockResolvedValue(null);

    const result = await service.getProfessionalMetrics();

    expect(result.totalPatients).toBe(2);
    expect(result.recentCheckIns).toBe(6);
    expect(result.averageAdherenceRate).toBe(1);
  });
});
