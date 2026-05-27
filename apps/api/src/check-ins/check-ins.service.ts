import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CheckIn } from './entities/check-in.entity';
import { CreateCheckInDto } from './dto/create-check-in.dto';
import { PatientsService } from '../patients/patients.service';
import { Prescription } from '../prescriptions/entities/prescription.entity';
import { clampPagination } from '../common/pagination.util';

@Injectable()
export class CheckInsService {
  constructor(
    @InjectRepository(CheckIn)
    private readonly checkInRepository: Repository<CheckIn>,
    @InjectRepository(Prescription)
    private readonly prescriptionRepository: Repository<Prescription>,
    private readonly patientsService: PatientsService,
  ) {}

  private async getPatientId(userId: string): Promise<string> {
    const patient = await this.patientsService.findByUserId(userId);
    return patient.id;
  }

  async create(
    createCheckInDto: CreateCheckInDto,
    patientUserId: string,
  ): Promise<CheckIn> {
    const patientId = await this.getPatientId(patientUserId);
    await this.validatePrescriptionExercise(createCheckInDto, patientId);

    const checkIn = this.checkInRepository.create({
      ...createCheckInDto,
      patientId: patientId,
    });
    return this.checkInRepository.save(checkIn);
  }

  async syncBatch(
    checkInsDto: CreateCheckInDto[],
    patientUserId: string,
  ): Promise<CheckIn[]> {
    const patientId = await this.getPatientId(patientUserId);
    await Promise.all(
      checkInsDto.map((dto) =>
        this.validatePrescriptionExercise(dto, patientId),
      ),
    );

    const checkInsToSave = checkInsDto.map((dto) =>
      this.checkInRepository.create({
        ...dto,
        patientId: patientId,
      }),
    );
    return this.checkInRepository.save(checkInsToSave);
  }

  async findAllByPatientIdPaginated(
    patientId: string,
    page = 1,
    pageSize = 20,
  ) {
    const clamped = clampPagination(page, pageSize);
    const [data, total] = await this.checkInRepository.findAndCount({
      where: { patientId },
      order: { executedAt: 'DESC' },
      skip: (clamped.page - 1) * clamped.pageSize,
      take: clamped.pageSize,
    });

    return {
      data: data.map((checkIn) => this.toExecutionResponse(checkIn)),
      total,
      page: clamped.page,
      pageSize: clamped.pageSize,
      totalPages: Math.ceil(total / clamped.pageSize),
    };
  }

  async findAllByPatientPaginated(
    patientUserId: string,
    page = 1,
    pageSize = 20,
  ) {
    const patientId = await this.getPatientId(patientUserId);
    const clamped = clampPagination(page, pageSize);

    const [data, total] = await this.checkInRepository.findAndCount({
      where: { patientId },
      order: { executedAt: 'DESC' },
      relations: ['prescription'],
      skip: (clamped.page - 1) * clamped.pageSize,
      take: clamped.pageSize,
    });

    return {
      data,
      total,
      page: clamped.page,
      pageSize: clamped.pageSize,
      totalPages: Math.ceil(total / clamped.pageSize),
    };
  }

  async countActiveCheckIns(days: number = 7): Promise<number> {
    const date = new Date();
    date.setDate(date.getDate() - days);

    return this.checkInRepository
      .createQueryBuilder('checkIn')
      .where('checkIn.executedAt >= :date', { date })
      .getCount();
  }

  async findPainEvolutionByPatientId(
    patientId: string,
  ): Promise<{ checkIn_executedAt: Date; checkIn_painLevel: number }[]> {
    return this.checkInRepository
      .createQueryBuilder('checkIn')
      .select(['checkIn.executedAt', 'checkIn.painLevel'])
      .where('checkIn.patientId = :patientId', { patientId })
      .orderBy('checkIn.executedAt', 'ASC')
      .getRawMany<{ checkIn_executedAt: Date; checkIn_painLevel: number }>();
  }

  private async validatePrescriptionExercise(
    dto: CreateCheckInDto,
    patientId: string,
  ): Promise<void> {
    const prescription = await this.prescriptionRepository.findOneBy({
      id: dto.prescriptionId,
      patientId,
    });

    if (!prescription) {
      throw new NotFoundException('Prescrição não encontrada para o paciente');
    }

    const hasExercise = prescription.exercises.some(
      (exercise) => exercise.exerciseId === dto.exerciseId,
    );

    if (!hasExercise) {
      throw new ForbiddenException(
        'Exercício não pertence à prescrição informada',
      );
    }
  }

  private toExecutionResponse(checkIn: CheckIn) {
    return {
      id: checkIn.id,
      prescriptionId: checkIn.prescriptionId,
      exerciseId: checkIn.exerciseId,
      patientId: checkIn.patientId,
      executedAt: checkIn.executedAt,
      painLevel: checkIn.painLevel,
      feelingLevel: checkIn.feelingLevel,
      notes: checkIn.notes,
      completed: checkIn.isCompleted,
      createdAt: checkIn.createdAt,
    };
  }
}
