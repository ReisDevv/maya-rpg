import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Prescription } from './entities/prescription.entity';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { UpdatePrescriptionDto } from './dto/update-prescription.dto';
import { Patient } from '../patients/entities/patient.entity';
import { User } from '../auth/entities/user.entity';
import { UserRole } from '../common/enums/user-role.enum';
import { NotificationsService } from '../notifications/notifications.service';
import { Exercise } from '../exercises/entities/exercise.entity';
import { clampPagination } from '../common/pagination.util';

@Injectable()
export class PrescriptionsService {
  constructor(
    @InjectRepository(Prescription)
    private readonly prescriptionRepo: Repository<Prescription>,
    @InjectRepository(Patient)
    private readonly patientRepo: Repository<Patient>,
    @InjectRepository(Exercise)
    private readonly exerciseRepo: Repository<Exercise>,
    private readonly notificationsService: NotificationsService,
  ) {}

  async findAll(page = 1, pageSize = 10) {
    const clamped = clampPagination(page, pageSize);
    const [data, total] = await this.prescriptionRepo.findAndCount({
      relations: ['patient'],
      order: { createdAt: 'DESC' },
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

  async findByPatient(patientId: string, page = 1, pageSize = 10) {
    const clamped = clampPagination(page, pageSize);
    const [data, total] = await this.prescriptionRepo.findAndCount({
      where: { patientId },
      order: { createdAt: 'DESC' },
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

  async findByPatientSecure(
    patientId: string,
    user: User,
    page = 1,
    pageSize = 10,
  ) {
    if (user.role === UserRole.PATIENT) {
      const patient = await this.patientRepo.findOneBy({ userId: user.id });
      if (!patient || patient.id !== patientId) {
        throw new ForbiddenException(
          'Sem permissão para acessar prescrições deste paciente',
        );
      }
    }

    return this.findByPatient(patientId, page, pageSize);
  }

  async findByUser(user: User, page = 1, pageSize = 10) {
    const clamped = clampPagination(page, pageSize);
    // Query única com JOIN: evita o N+1 de buscar patient e depois prescriptions separadamente
    const [data, total] = await this.prescriptionRepo
      .createQueryBuilder('prescription')
      .innerJoin(
        'patients',
        'patient',
        'patient."userId" = :userId AND patient.id = prescription."patientId"',
        {
          userId: user.id,
        },
      )
      .orderBy('prescription."createdAt"', 'DESC')
      .skip((clamped.page - 1) * clamped.pageSize)
      .take(clamped.pageSize)
      .getManyAndCount();

    if (total === 0) {
      // Verifica se o paciente existe antes de lançar erro
      const patientExists = await this.patientRepo.findOneBy({
        userId: user.id,
      });
      if (!patientExists) {
        throw new NotFoundException(
          'Paciente não encontrado para este usuário',
        );
      }
    }

    return {
      data,
      total,
      page: clamped.page,
      pageSize: clamped.pageSize,
      totalPages: Math.ceil(total / clamped.pageSize),
    };
  }

  async findFullByUser(user: User) {
    const patient = await this.patientRepo.findOneBy({ userId: user.id });
    if (!patient) {
      throw new NotFoundException('Paciente não encontrado para este usuário');
    }

    const prescriptions = await this.prescriptionRepo.find({
      where: { patientId: patient.id, isActive: true },
      order: { createdAt: 'DESC' },
    });

    const exerciseIds = Array.from(
      new Set(
        prescriptions.flatMap((prescription) =>
          (prescription.exercises || []).map((item) => item.exerciseId),
        ),
      ),
    ).filter(Boolean);

    const exercises = exerciseIds.length
      ? await this.exerciseRepo.find({ where: { id: In(exerciseIds) } })
      : [];
    const exerciseById = new Map(
      exercises.map((exercise) => [exercise.id, exercise]),
    );

    const data = prescriptions.map((prescription) => ({
      ...prescription,
      exercises: (prescription.exercises || []).map((item) => ({
        ...item,
        exercise: exerciseById.get(item.exerciseId) ?? null,
      })),
    }));

    return {
      data,
      total: data.length,
      patientId: patient.id,
      generatedAt: new Date(),
    };
  }

  private async findOne(id: string): Promise<Prescription> {
    const prescription = await this.prescriptionRepo.findOne({
      where: { id },
      relations: ['patient'],
    });
    if (!prescription) {
      throw new NotFoundException('Prescrição não encontrada');
    }
    return prescription;
  }

  async findOneSecure(id: string, user: User): Promise<Prescription> {
    const prescription = await this.findOne(id);

    if (user.role === UserRole.PATIENT) {
      const patient = await this.patientRepo.findOneBy({ userId: user.id });
      if (!patient || prescription.patientId !== patient.id) {
        throw new ForbiddenException(
          'Sem permissão para acessar esta prescrição',
        );
      }
    }

    return prescription;
  }

  async create(
    dto: CreatePrescriptionDto,
    professionalId: string,
  ): Promise<Prescription> {
    const patient = await this.patientRepo.findOneBy({ id: dto.patientId });
    if (!patient) {
      throw new NotFoundException('Paciente não encontrado');
    }

    if (!patient.lgpdConsentAt) {
      throw new BadRequestException(
        'Paciente ainda não aceitou os termos LGPD',
      );
    }

    const prescription = this.prescriptionRepo.create({
      ...dto,
      professionalId,
    });
    const saved = await this.prescriptionRepo.save(prescription);

    if (patient.userId) {
      void this.notificationsService
        .sendPushNotification(
          patient.userId,
          'Novo plano disponível',
          'Sua prescrição de exercícios foi atualizada. Confira agora.',
          { type: 'prescription', prescriptionId: saved.id },
        )
        .catch(() => undefined);
    }

    return saved;
  }

  async update(id: string, dto: UpdatePrescriptionDto): Promise<Prescription> {
    const prescription = await this.findOne(id);
    Object.assign(prescription, dto);
    return this.prescriptionRepo.save(prescription);
  }

  async deactivate(id: string): Promise<void> {
    const prescription = await this.findOne(id);
    prescription.isActive = false;
    await this.prescriptionRepo.save(prescription);
  }

  async remove(id: string): Promise<void> {
    const prescription = await this.findOne(id);
    await this.prescriptionRepo.remove(prescription);
  }
}
