import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Payment, PaymentStatus } from './entities/payment.entity';
import {
  Appointment,
  AppointmentStatus,
} from '../appointments/entities/appointment.entity';
import { Patient } from '../patients/entities/patient.entity';
import { User } from '../auth/entities/user.entity';
import { UserRole } from '../common/enums/user-role.enum';
import { CreateAppointmentPaymentDto } from './dto/create-appointment-payment.dto';
import { PaymentResponseDto } from './dto/payment-response.dto';
import { MercadoPagoService } from './mercado-pago.service';
import { clampPagination } from '../common/pagination.util';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
    @InjectRepository(Appointment)
    private readonly appointmentRepo: Repository<Appointment>,
    @InjectRepository(Patient)
    private readonly patientRepo: Repository<Patient>,
    private readonly mercadoPagoService: MercadoPagoService,
  ) {}

  async createAppointmentPayment(
    dto: CreateAppointmentPaymentDto,
    user: User,
  ): Promise<PaymentResponseDto> {
    const patient = await this.patientRepo.findOneBy({ userId: user.id });
    if (!patient) {
      throw new NotFoundException(
        'Paciente não encontrado para o usuário logado',
      );
    }

    if (patient.id !== dto.patientId) {
      throw new ForbiddenException('patientId não pertence ao usuário logado');
    }

    const appointment = await this.appointmentRepo.findOneBy({
      id: dto.appointmentId,
    });
    if (!appointment) {
      throw new NotFoundException('Agendamento não encontrado');
    }

    if (appointment.patientId !== dto.patientId) {
      throw new BadRequestException(
        'O agendamento não pertence ao paciente informado',
      );
    }

    const existingPayment = await this.paymentRepo.findOneBy({
      appointmentId: dto.appointmentId,
      status: PaymentStatus.PENDING,
    });
    if (existingPayment) {
      throw new BadRequestException(
        'Já existe um pagamento pendente para este agendamento',
      );
    }

    // TODO: buscar valor oficial quando disponível; amount aceito temporariamente para sandbox
    const amount = Number(dto.amount);

    const paymentId = uuidv4();

    const description = `Consulta ${appointment.type} - ${new Date(appointment.dateTime).toLocaleString('pt-BR')}`;

    const preference = await this.mercadoPagoService.createPreference(
      amount,
      description,
      paymentId,
    );

    const payment = this.paymentRepo.create({
      id: paymentId,
      userId: user.id,
      patientId: dto.patientId,
      appointmentId: dto.appointmentId,
      amount,
      status: PaymentStatus.PENDING,
      mpPreferenceId: preference.id,
    });

    await this.paymentRepo.save(payment);

    return {
      paymentId: payment.id,
      initPoint: preference.initPoint,
      status: payment.status,
    };
  }

  async handleWebhook(mpPaymentId: string): Promise<void> {
    let mpPayment: Awaited<
      ReturnType<typeof this.mercadoPagoService.getPaymentInfo>
    >;

    try {
      mpPayment = await this.mercadoPagoService.getPaymentInfo(mpPaymentId);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Falha ao consultar pagamento MP ${mpPaymentId}: ${msg}`,
      );
      return;
    }

    const newStatus = this.mercadoPagoService.mapStatus(mpPayment.status);

    let payment = await this.paymentRepo.findOneBy({
      mpPreferenceId: mpPayment.preference_id,
    });

    if (!payment && mpPayment.preference_id) {
      payment = await this.paymentRepo.findOneBy({
        id: mpPayment.preference_id,
      });
    }

    if (!payment) {
      this.logger.warn(
        `Pagamento não encontrado para preference_id=${mpPayment.preference_id}, mpPaymentId=${mpPaymentId}`,
      );
      return;
    }

    payment.status = newStatus;
    payment.mpPaymentId = String(mpPaymentId);
    await this.paymentRepo.save(payment);

    if (newStatus === PaymentStatus.APPROVED) {
      await this.appointmentRepo.update(
        { id: payment.appointmentId },
        { status: AppointmentStatus.CONFIRMED },
      );
      this.logger.log(
        `Agendamento ${payment.appointmentId} confirmado via pagamento ${payment.id}`,
      );
    }
  }

  async findAll(page = 1, pageSize = 10) {
    const clamped = clampPagination(page, pageSize);
    const [data, total] = await this.paymentRepo.findAndCount({
      relations: ['patient', 'appointment'],
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

  async findByAppointment(appointmentId: string) {
    return this.paymentRepo.find({
      where: { appointmentId },
      relations: ['patient', 'appointment'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOneSecure(id: string, user: User): Promise<Payment> {
    const payment = await this.paymentRepo.findOne({
      where: { id },
      relations: ['patient', 'appointment'],
    });
    if (!payment) throw new NotFoundException('Pagamento não encontrado');

    if (user.role === UserRole.PATIENT) {
      const patient = await this.patientRepo.findOneBy({ userId: user.id });
      if (!patient || payment.patientId !== patient.id) {
        throw new ForbiddenException(
          'Sem permissão para acessar este pagamento',
        );
      }
    }

    return payment;
  }
}
