import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { CreateAppointmentPaymentDto } from './dto/create-appointment-payment.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import type { AuthenticatedRequest } from '../common/types/request.types';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('appointment')
  @Roles(UserRole.PATIENT)
  @ApiOperation({ summary: 'Criar pagamento para consulta (mobile only)' })
  createAppointmentPayment(
    @Body() dto: CreateAppointmentPaymentDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.paymentsService.createAppointmentPayment(dto, req.user);
  }

  @Get('appointment/:appointmentId')
  @Roles(UserRole.PATIENT, UserRole.PROFESSIONAL, UserRole.ADMIN)
  @ApiOperation({ summary: 'Buscar pagamentos por agendamento' })
  findByAppointment(
    @Param('appointmentId', ParseUUIDPipe) appointmentId: string,
  ) {
    return this.paymentsService.findByAppointment(appointmentId);
  }

  @Get()
  @Roles(UserRole.PROFESSIONAL, UserRole.ADMIN)
  @ApiOperation({ summary: 'Listar pagamentos (paginado)' })
  findAll(@Query('page') page?: number, @Query('pageSize') pageSize?: number) {
    return this.paymentsService.findAll(page || 1, pageSize || 10);
  }

  @Get(':id')
  @Roles(UserRole.PATIENT, UserRole.PROFESSIONAL, UserRole.ADMIN)
  @ApiOperation({ summary: 'Buscar pagamento por ID' })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.paymentsService.findOneSecure(id, req.user);
  }
}
