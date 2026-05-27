import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { Patient } from './entities/patient.entity';
import { User } from '../auth/entities/user.entity';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { PatientStatus } from '../common/enums/patient-status.enum';
import { UserRole } from '../common/enums/user-role.enum';
import { MailService } from '../common/mail/mail.service';
import { NotificationsService } from '../notifications/notifications.service';
import { clampPagination } from '../common/pagination.util';

@Injectable()
export class PatientsService {
  private readonly logger = new Logger(PatientsService.name);

  constructor(
    @InjectRepository(Patient)
    private readonly patientRepo: Repository<Patient>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly mailService: MailService,
    private readonly notificationsService: NotificationsService,
  ) {}

  private findUserByEmailInsensitive(email: string) {
    return this.userRepo
      .createQueryBuilder('user')
      .where('LOWER(user.email) = :email', { email: email.toLowerCase() })
      .getOne();
  }

  async findAll(
    page = 1,
    pageSize = 10,
    search?: string,
    status?: PatientStatus,
    sortBy = 'fullName',
    sortOrder: string = 'ASC',
  ) {
    const clamped = clampPagination(page, pageSize);
    const query = this.patientRepo.createQueryBuilder('patient');

    if (status) {
      query.andWhere('patient.status = :status', { status });
    }

    if (search) {
      query.andWhere(
        '(patient.fullName ILIKE :search OR patient.email ILIKE :search OR patient.cpf LIKE :search)',
        { search: `%${search}%` },
      );
    }

    const allowedSortFields = ['fullName', 'email', 'createdAt', 'status'];
    const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'fullName';
    query.orderBy(`patient.${safeSortBy}`, sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC');

    const total = await query.getCount();
    const data = await query
      .skip((clamped.page - 1) * clamped.pageSize)
      .take(clamped.pageSize)
      .getMany();

    return { data, total, page: clamped.page, pageSize: clamped.pageSize, totalPages: Math.ceil(total / clamped.pageSize) };
  }

  private async findOneById(id: string): Promise<Patient> {
    const patient = await this.patientRepo.findOne({ where: { id } });
    if (!patient) throw new NotFoundException('Paciente não encontrado');
    return patient;
  }

  async findOneSecure(id: string, requestingUser: User): Promise<Patient> {
    const patient = await this.patientRepo.findOne({ where: { id } });

    if (!patient) throw new NotFoundException('Paciente não encontrado');

    if (requestingUser.role === UserRole.PATIENT && patient.userId !== requestingUser.id) {
      throw new ForbiddenException('Sem permissão para acessar este paciente');
    }

    return patient;
  }

  async findByUserId(userId: string): Promise<Patient> {
    const patient = await this.patientRepo.findOneBy({ userId });
    if (!patient) throw new NotFoundException('Paciente não encontrado para este usuário');
    return patient;
  }

  private async ensureUserForPatient(
    email: string,
    name: string,
    cpf: string,
  ): Promise<User> {
    let user = await this.findUserByEmailInsensitive(email);
    if (!user) {
      user = await this.userRepo.save(
        this.userRepo.create({
          name,
          email,
          password: await bcrypt.hash(cpf, 10),
          role: UserRole.PATIENT,
          mustChangePassword: true,
        }),
      );
      await this.mailService.sendPatientCredentials(user.email, user.name, cpf);
    }
    return user;
  }

  async create(dto: CreatePatientDto): Promise<Patient> {
    const normalizedEmail = dto.email.trim().toLowerCase();
    const cleanCpf = dto.cpf.replace(/\D/g, '');

    const user = await this.ensureUserForPatient(normalizedEmail, dto.fullName, cleanCpf);

    return this.patientRepo.save(
      this.patientRepo.create({ ...dto, email: normalizedEmail, cpf: cleanCpf, userId: user.id }),
    );
  }

  async update(id: string, dto: UpdatePatientDto): Promise<Patient> {
    const patient = await this.findOneById(id);
    const normalizedEmail = dto.email?.trim().toLowerCase();
    const normalizedCpf = dto.cpf?.replace(/\D/g, '');

    if (!patient.userId) {
      const email = normalizedEmail ?? patient.email.trim().toLowerCase();
      const cpf = normalizedCpf ?? patient.cpf.replace(/\D/g, '');
      const user = await this.ensureUserForPatient(email, dto.fullName ?? patient.fullName, cpf);
      patient.userId = user.id;
    }

    Object.assign(patient, {
      ...dto,
      ...(normalizedEmail ? { email: normalizedEmail } : {}),
      ...(normalizedCpf ? { cpf: normalizedCpf } : {}),
    });

    const saved = await this.patientRepo.save(patient);
    await this.syncUserFromPatient(saved);
    return saved;
  }

  async updateByUserId(userId: string, dto: UpdatePatientDto): Promise<Patient> {
    const patient = await this.findByUserId(userId);
    const normalizedEmail = dto.email?.trim().toLowerCase();
    const normalizedCpf = dto.cpf?.replace(/\D/g, '');

    Object.assign(patient, {
      fullName: dto.fullName,
      phone: dto.phone,
      birthDate: dto.birthDate,
      notes: dto.notes,
      ...(normalizedEmail ? { email: normalizedEmail } : {}),
      ...(normalizedCpf ? { cpf: normalizedCpf } : {}),
    });

    const saved = await this.patientRepo.save(patient);
    await this.syncUserFromPatient(saved);
    return saved;
  }

  async remove(id: string): Promise<void> {
    const patient = await this.findOneById(id);
    await this.patientRepo.remove(patient);
  }

  async sendReminder(id: string): Promise<{ sent: boolean; message: string }> {
    const patient = await this.findOneById(id);

    if (!patient.userId) {
      this.logger.log(`Reminder requested for patient ${id} — no linked user account`);
      return { sent: false, message: 'Paciente não possui conta de usuário vinculada.' };
    }

    const sent = await this.notificationsService.sendPushNotification(
      patient.userId,
      'Lembrete da sua clínica',
      `Oi, ${patient.fullName.split(' ')[0]}! Não esquece da sua sessão. Qualquer dúvida, estamos aqui.`,
      { type: 'manual_reminder', patientId: patient.id },
    );

    if (sent) return { sent: true, message: 'Lembrete enviado com sucesso via notificação push.' };

    this.logger.log(`Reminder for patient ${id} — push failed (no FCM token or config)`);
    return { sent: false, message: 'Solicitação de lembrete registrada. Envio externo ainda não configurado.' };
  }

  private async syncUserFromPatient(patient: Patient): Promise<void> {
    if (!patient.userId) return;
    const user = await this.userRepo.findOneBy({ id: patient.userId });
    if (!user) return;
    user.name = patient.fullName;
    user.email = patient.email.trim().toLowerCase();
    await this.userRepo.save(user);
  }
}
