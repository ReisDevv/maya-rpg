import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MedicalRecord } from './entities/medical-record.entity';
import { CreateMedicalRecordDto } from './dto/create-medical-record.dto';
import { UpdateMedicalRecordDto } from './dto/update-medical-record.dto';
import { Patient } from '../patients/entities/patient.entity';
import { User } from '../auth/entities/user.entity';
import { UserRole } from '../common/enums/user-role.enum';
import { clampPagination } from '../common/pagination.util';

@Injectable()
export class MedicalRecordsService {
  constructor(
    @InjectRepository(MedicalRecord)
    private readonly recordRepo: Repository<MedicalRecord>,
    @InjectRepository(Patient)
    private readonly patientRepo: Repository<Patient>,
  ) {}

  async findAll(page = 1, pageSize = 10) {
    const clamped = clampPagination(page, pageSize);
    const [data, total] = await this.recordRepo.findAndCount({
      relations: ['patient'],
      order: { date: 'DESC' },
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
    const [data, total] = await this.recordRepo.findAndCount({
      where: { patientId },
      order: { date: 'DESC' },
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

  async findByUser(user: User, page = 1, pageSize = 10) {
    const patient = await this.patientRepo.findOneBy({ userId: user.id });
    if (!patient)
      throw new NotFoundException('Paciente não encontrado para este usuário');
    return this.findByPatient(patient.id, page, pageSize);
  }

  private async findOne(id: string): Promise<MedicalRecord> {
    const record = await this.recordRepo.findOne({
      where: { id },
      relations: ['patient'],
    });
    if (!record) {
      throw new NotFoundException('Prontuário não encontrado');
    }
    return record;
  }

  async findOneSecure(id: string, user: User): Promise<MedicalRecord> {
    const record = await this.findOne(id);

    if (user.role === UserRole.PATIENT) {
      const patient = await this.patientRepo.findOneBy({ userId: user.id });
      if (!patient || record.patientId !== patient.id) {
        throw new ForbiddenException(
          'Sem permissão para acessar este prontuário',
        );
      }
    }

    return record;
  }

  async create(
    dto: CreateMedicalRecordDto,
    professionalId: string,
  ): Promise<MedicalRecord> {
    const record = this.recordRepo.create({
      ...dto,
      professionalId,
    });
    return this.recordRepo.save(record);
  }

  async update(
    id: string,
    dto: UpdateMedicalRecordDto,
  ): Promise<MedicalRecord> {
    const record = await this.findOne(id);
    Object.assign(record, dto);
    return this.recordRepo.save(record);
  }

  async remove(id: string): Promise<void> {
    const record = await this.findOne(id);
    await this.recordRepo.remove(record);
  }
}
