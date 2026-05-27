import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In, LessThan, MoreThanOrEqual } from 'typeorm';
import { Appointment, AppointmentStatus } from './entities/appointment.entity';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { RequestAppointmentDto } from './dto/request-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { Patient } from '../patients/entities/patient.entity';
import { User } from '../auth/entities/user.entity';
import { UserRole } from '../common/enums/user-role.enum';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/entities/notification.entity';
import { clampPagination } from '../common/pagination.util';

@Injectable()
export class AppointmentsService {
  private readonly logger = new Logger(AppointmentsService.name);

  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentRepo: Repository<Appointment>,
    @InjectRepository(Patient)
    private readonly patientRepo: Repository<Patient>,
    private readonly notificationsService: NotificationsService,
  ) {}

  async findAll(page = 1, pageSize = 50, startDate?: string, endDate?: string) {
    const clamped = clampPagination(page, pageSize);
    const where =
      startDate && endDate
        ? { dateTime: Between(new Date(startDate), new Date(endDate)) }
        : {};

    const [data, total] = await this.appointmentRepo.findAndCount({
      where,
      relations: ['patient'],
      order: { dateTime: 'ASC' },
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

  async findByPatientPaginated(patientId: string, page = 1, pageSize = 20) {
    const clamped = clampPagination(page, pageSize);
    const [data, total] = await this.appointmentRepo.findAndCount({
      where: { patientId },
      order: { dateTime: 'ASC' },
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

  async findByUser(
    user: User,
    filter: 'upcoming' | 'history' | 'all' = 'all',
    page = 1,
    pageSize = 20,
  ) {
    const patient = await this.patientRepo.findOneBy({ userId: user.id });
    if (!patient)
      throw new NotFoundException('Paciente não encontrado para este usuário');

    const now = new Date();
    const where: any = { patientId: patient.id };
    if (filter === 'upcoming') {
      where.dateTime = MoreThanOrEqual(now);
      where.status = In([
        AppointmentStatus.PENDING,
        AppointmentStatus.CONFIRMED,
      ]);
    }
    if (filter === 'history') {
      where.dateTime = LessThan(now);
    }

    const clamped = clampPagination(page, pageSize);
    const [data, total] = await this.appointmentRepo.findAndCount({
      where,
      order: { dateTime: filter === 'history' ? 'DESC' : 'ASC' },
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

  async findUpcomingByUser(user: User, limit = 3) {
    const patient = await this.patientRepo.findOneBy({ userId: user.id });
    if (!patient)
      throw new NotFoundException('Paciente não encontrado para este usuário');

    return this.appointmentRepo.find({
      where: {
        patientId: patient.id,
        dateTime: MoreThanOrEqual(new Date()),
        status: In([AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED]),
      },
      order: { dateTime: 'ASC' },
      take: Math.min(Math.max(Number(limit) || 3, 1), 10),
    });
  }

  async getAvailability(month: string) {
    const { start, end } = this.parseMonthRange(month);
    const appointments = await this.appointmentRepo.find({
      where: {
        dateTime: Between(start, end),
        status: In([AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED]),
      },
      order: { dateTime: 'ASC' },
    });

    const reserved = appointments.map((appointment) => ({
      id: appointment.id,
      dateTime: appointment.dateTime,
      status: appointment.status,
    }));

    return {
      month,
      workingHours: [
        '07:50',
        '08:30',
        '10:50',
        '11:30',
        '14:00',
        '15:00',
        '16:30',
        '17:40',
      ],
      reserved,
    };
  }

  private async findOne(id: string): Promise<Appointment> {
    const appointment = await this.appointmentRepo.findOne({
      where: { id },
      relations: ['patient'],
    });
    if (!appointment) throw new NotFoundException('Agendamento não encontrado');
    return appointment;
  }

  async findOneSecure(id: string, user: User): Promise<Appointment> {
    const appointment = await this.findOne(id);

    if (user.role === UserRole.PATIENT) {
      const patient = await this.patientRepo.findOneBy({ userId: user.id });
      if (!patient || appointment.patientId !== patient.id) {
        throw new ForbiddenException(
          'Sem permissão para acessar este agendamento',
        );
      }
    }

    return appointment;
  }

  async findToday() {
    const now = new Date();
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0));
    const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));

    return this.appointmentRepo.find({
      where: { dateTime: Between(start, end) },
      relations: ['patient'],
      order: { dateTime: 'ASC' },
    });
  }

  async findNext() {
    const now = new Date();
    const appointments = await this.appointmentRepo.find({
      where: {
        dateTime: MoreThanOrEqual(now),
        status: AppointmentStatus.CONFIRMED,
      },
      relations: ['patient'],
      order: { dateTime: 'ASC' },
      take: 1,
    });
    return appointments[0] || null;
  }

  async getSatisfactionSummary() {
    const rows: { rating: string; count: string }[] = await this.appointmentRepo
      .createQueryBuilder('a')
      .select('a.satisfactionRating', 'rating')
      .addSelect('COUNT(*)', 'count')
      .where('a.status = :status', { status: AppointmentStatus.COMPLETED })
      .andWhere('a.satisfactionRating IS NOT NULL')
      .groupBy('a.satisfactionRating')
      .getRawMany();

    if (!rows.length) return { average: null, total: 0, percentage: 0 };

    const total = rows.reduce((acc, r) => acc + Number(r.count), 0);
    const positiveRatings = new Set(['BEM', 'SUPER_BEM']);
    const positive = rows
      .filter((r) => positiveRatings.has(r.rating))
      .reduce((acc, r) => acc + Number(r.count), 0);

    const mostCommon = rows.sort((a, b) => Number(b.count) - Number(a.count))[0].rating;

    return {
      mostCommon,
      total,
      percentage: Math.round((positive / total) * 100),
    };
  }

  async create(
    dto: CreateAppointmentDto,
    professionalId: string,
  ): Promise<Appointment> {
    if (!dto.patientId) {
      throw new BadRequestException('patientId é obrigatório');
    }

    if (dto.dateTime && new Date(dto.dateTime) <= new Date()) {
      throw new BadRequestException('A data do agendamento deve ser no futuro');
    }

    const patient = await this.patientRepo.findOneBy({ id: dto.patientId });
    if (!patient) throw new NotFoundException('Paciente não encontrado');

    const duration = dto.durationMinutes ?? 50;
    const buffer = dto.bufferMinutes ?? 15;
    await this.checkOverlap(new Date(dto.dateTime), duration, buffer);

    const appointment = this.appointmentRepo.create({
      ...dto,
      durationMinutes: duration,
      bufferMinutes: buffer,
      professionalId,
    });
    const saved = await this.appointmentRepo.save(appointment);

    if (patient.userId) {
      const displayTime = saved.dateTime.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
      void this.notificationsService
        .sendPushNotification(
          patient.userId,
          'Sessão agendada ✓',
          `Você tem uma sessão marcada para ${displayTime}.`,
          { type: 'appointment', appointmentId: saved.id },
        )
        .catch(() => undefined);
    }

    return saved;
  }

  async requestByUser(
    dto: RequestAppointmentDto,
    user: User,
  ): Promise<Appointment> {
    if (dto.dateTime && new Date(dto.dateTime) <= new Date()) {
      throw new BadRequestException('A data do agendamento deve ser no futuro');
    }

    const patient = await this.patientRepo.findOneBy({ userId: user.id });
    if (!patient)
      throw new NotFoundException('Paciente não encontrado para este usuário');

    const duration = dto.durationMinutes ?? 50;
    await this.checkOverlap(new Date(dto.dateTime), duration, 15);

    const appointment = this.appointmentRepo.create({
      patientId: patient.id,
      dateTime: new Date(dto.dateTime),
      durationMinutes: duration,
      bufferMinutes: 15,
      type: dto.type,
      status: AppointmentStatus.PENDING,
      notes: dto.notes,
    });

    const saved = await this.appointmentRepo.save(appointment);

    const tz = 'America/Sao_Paulo';
    const reqDayLabel = saved.dateTime.toLocaleDateString('pt-BR', {
      timeZone: tz,
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
    const reqHourLabel = saved.dateTime.toLocaleTimeString('pt-BR', {
      timeZone: tz,
      hour: '2-digit',
      minute: '2-digit',
    });
    const firstName = patient.fullName.split(' ')[0];
    const notifTitle = '📅 Nova solicitação de sessão';
    const notifBody = `${firstName} quer agendar para ${reqDayLabel} às ${reqHourLabel}. Toque para aceitar ou recusar.`;
    const notifData = { type: 'appointment_request', appointmentId: saved.id };

    // Persiste notificação no banco para cada admin/professional poder ver no painel web
    void this.notificationsService
      .getUsersByRoles([UserRole.ADMIN, UserRole.PROFESSIONAL])
      .then((staffUsers) =>
        Promise.all(
          staffUsers.map((staffUser) =>
            this.notificationsService
              .sendPushAndPersist(staffUser.id, notifTitle, notifBody, NotificationType.APPOINTMENT_REMINDER, notifData)
              .catch((err) => this.logger.error(`Falha ao notificar staff ${staffUser.id}`, err)),
          ),
        ),
      )
      .catch((err) => this.logger.error('Falha ao buscar staff para notificação', err));

    return saved;
  }

  async getPendingRequests() {
    const appointments = await this.appointmentRepo.find({
      where: { status: AppointmentStatus.PENDING },
      relations: ['patient'],
      order: { dateTime: 'ASC' },
    });

    return appointments.map((appointment) => ({
      id: appointment.id,
      type: 'APPOINTMENT_REQUEST',
      createdAt: appointment.createdAt,
      appointment: {
        id: appointment.id,
        patientId: appointment.patientId,
        patientName: appointment.patient?.fullName || 'Paciente',
        dateTime: appointment.dateTime,
        type: appointment.type,
        status: appointment.status,
      },
    }));
  }

  async getAvailabilityByDate(date: string) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '')) {
      throw new BadRequestException('Informe date no formato YYYY-MM-DD');
    }

    const openHour = 8;
    const closeHour = 18;

    const start = new Date(`${date}T00:00:00Z`);
    const end = new Date(`${date}T23:59:59Z`);

    const appointments = await this.appointmentRepo.find({
      where: {
        dateTime: Between(start, end),
        status: In([AppointmentStatus.CONFIRMED, AppointmentStatus.PENDING]),
      },
    });

    const occupiedByHour = new Map<number, string | null>();
    for (const appt of appointments) {
      const hour = new Date(appt.dateTime).getHours();
      occupiedByHour.set(hour, appt.id);
    }

    const slots = [];
    let occupiedSlots = 0;

    for (let h = openHour; h < closeHour; h++) {
      const time = `${String(h).padStart(2, '0')}:00`;
      const appointmentId = occupiedByHour.get(h) || null;
      const available = !occupiedByHour.has(h);
      if (!available) occupiedSlots++;
      slots.push({ time, available, appointmentId });
    }

    const totalSlots = closeHour - openHour;
    const availableSlots = totalSlots - occupiedSlots;
    const isFull = occupiedSlots >= totalSlots;

    return {
      date,
      availableSlots,
      occupiedSlots,
      isFull,
      operatingHours: { open: '08:00', close: '18:00' },
      slots,
    };
  }

  async update(id: string, dto: UpdateAppointmentDto): Promise<Appointment> {
    if (dto.dateTime && new Date(dto.dateTime) <= new Date()) {
      throw new BadRequestException('A data do agendamento deve ser no futuro');
    }
    const appointment = await this.findOne(id);
    const previousStatus = appointment.status;

    if (dto.dateTime) {
      const duration = dto.durationMinutes ?? appointment.durationMinutes;
      const buffer = dto.bufferMinutes ?? appointment.bufferMinutes;
      await this.checkOverlap(new Date(dto.dateTime), duration, buffer, id);
    }
    Object.assign(appointment, dto);
    const saved = await this.appointmentRepo.save(appointment);

    // Notifica paciente quando admin aceita ou recusa a solicitação
    if (
      dto.status &&
      dto.status !== previousStatus &&
      (dto.status === AppointmentStatus.CONFIRMED || dto.status === AppointmentStatus.CANCELLED)
    ) {
      const patient = await this.patientRepo.findOneBy({ id: saved.patientId });
      if (patient?.userId) {
        const tz = 'America/Sao_Paulo';
        const firstName = patient.fullName.split(' ')[0];
        const dayLabel = saved.dateTime.toLocaleDateString('pt-BR', {
          timeZone: tz,
          weekday: 'long',
          day: 'numeric',
          month: 'long',
        });
        const hourLabel = saved.dateTime.toLocaleTimeString('pt-BR', {
          timeZone: tz,
          hour: '2-digit',
          minute: '2-digit',
        });

        const confirmed = dto.status === AppointmentStatus.CONFIRMED;
        const title = confirmed ? '✅ Sessão confirmada!' : '❌ Sessão não confirmada';
        const body = confirmed
          ? `Oi, ${firstName}! Sua sessão de ${hourLabel} de ${dayLabel} está confirmada. Te esperamos lá! 🌟`
          : `Oi, ${firstName}! Infelizmente sua solicitação para ${dayLabel} às ${hourLabel} não pôde ser aceita. Entre em contato pelo chat para remarcar. 💬`;

        void this.notificationsService
          .sendPushAndPersist(
            patient.userId,
            title,
            body,
            NotificationType.APPOINTMENT_REMINDER,
            { type: 'appointment_status_update', appointmentId: saved.id, status: dto.status },
          )
          .catch((err) => this.logger.error(`Falha ao notificar paciente ${patient.userId}`, err));
      }
    }

    return saved;
  }

  async remove(id: string): Promise<void> {
    const appointment = await this.findOne(id);
    await this.appointmentRepo.remove(appointment);
  }

  private async checkOverlap(
    dateTime: Date,
    durationMinutes: number,
    bufferMinutes: number,
    excludeId?: string,
  ): Promise<void> {
    const slotEnd = new Date(
      dateTime.getTime() + (durationMinutes + bufferMinutes) * 60_000,
    );

    // Busca agendamentos activos cujo início seja antes do fim do novo slot
    // e cujo fim seja depois do início do novo slot (interseção de intervalos)
    const existing = await this.appointmentRepo
      .createQueryBuilder('a')
      .where('a.status IN (:...statuses)', {
        statuses: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED],
      })
      .andWhere('a.dateTime < :slotEnd', { slotEnd })
      .andWhere(
        `a.dateTime + (a.durationMinutes + a.bufferMinutes) * interval '1 minute' > :dateTime`,
        { dateTime },
      )
      .andWhere(excludeId ? 'a.id != :excludeId' : '1=1', { excludeId })
      .getOne();

    if (existing) {
      throw new ConflictException(
        `Conflito de horário: já existe um agendamento de ${existing.dateTime.toISOString()} que ocupa este intervalo.`,
      );
    }
  }

  private parseMonthRange(month: string) {
    if (!/^\d{4}-\d{2}$/.test(month || '')) {
      throw new BadRequestException('Informe month no formato YYYY-MM');
    }

    const [year, monthIndex] = month.split('-').map(Number);
    const start = new Date(Date.UTC(year, monthIndex - 1, 1, 0, 0, 0, 0));
    const end = new Date(Date.UTC(year, monthIndex, 0, 23, 59, 59, 999));
    return { start, end };
  }
}
