import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { RequestAppointmentDto } from './dto/request-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { User } from '../auth/entities/user.entity';

@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Roles(UserRole.PROFESSIONAL, UserRole.ADMIN)
  @Get()
  findAll(
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.appointmentsService.findAll(page ?? 1, pageSize ?? 50, startDate, endDate);
  }

  @Roles(UserRole.PROFESSIONAL, UserRole.ADMIN)
  @Get('today')
  findToday() {
    return this.appointmentsService.findToday();
  }

  @Roles(UserRole.PROFESSIONAL, UserRole.ADMIN)
  @Get('next')
  findNext() {
    return this.appointmentsService.findNext();
  }

  @Roles(UserRole.PROFESSIONAL, UserRole.ADMIN)
  @Get('satisfaction')
  getSatisfactionSummary() {
    return this.appointmentsService.getSatisfactionSummary();
  }

  @Roles(UserRole.PROFESSIONAL, UserRole.ADMIN)
  @Get('pending-requests')
  getPendingRequests() {
    return this.appointmentsService.getPendingRequests();
  }

  @Roles(UserRole.PATIENT)
  @Get('my')
  findMy(
    @CurrentUser() user: User,
    @Query('filter') filter?: 'upcoming' | 'history' | 'all',
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
  ) {
    return this.appointmentsService.findByUser(user, filter ?? 'all', page ?? 1, pageSize ?? 20);
  }

  // Alias for /my — kept for mobile backward compatibility
  @Roles(UserRole.PATIENT)
  @Get('me')
  findMe(
    @CurrentUser() user: User,
    @Query('filter') filter?: 'upcoming' | 'history' | 'all',
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
  ) {
    return this.appointmentsService.findByUser(user, filter ?? 'all', page ?? 1, pageSize ?? 20);
  }

  @Roles(UserRole.PATIENT)
  @Get('me/upcoming')
  findMyUpcoming(@CurrentUser() user: User, @Query('limit') limit?: number) {
    return this.appointmentsService.findUpcomingByUser(user, limit ?? 3);
  }

  @Roles(UserRole.PATIENT)
  @Get('me/availability')
  findMyAvailability(@Query('month') month: string) {
    return this.appointmentsService.getAvailability(month);
  }

  @Roles(UserRole.PATIENT)
  @Post('me/request')
  requestMyAppointment(@Body() dto: RequestAppointmentDto, @CurrentUser() user: User) {
    return this.appointmentsService.requestByUser(dto, user);
  }

  @Roles(UserRole.PROFESSIONAL, UserRole.ADMIN, UserRole.PATIENT)
  @Get('availability')
  getAvailability(@Query('date') date: string) {
    return this.appointmentsService.getAvailabilityByDate(date);
  }

  @Roles(UserRole.PROFESSIONAL, UserRole.ADMIN)
  @Get('patient/:patientId')
  findByPatient(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
  ) {
    return this.appointmentsService.findByPatientPaginated(patientId, page ?? 1, pageSize ?? 20);
  }

  @Roles(UserRole.PATIENT, UserRole.PROFESSIONAL, UserRole.ADMIN)
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.appointmentsService.findOneSecure(id, user);
  }

  @Roles(UserRole.PROFESSIONAL, UserRole.ADMIN)
  @Post()
  create(@Body() dto: CreateAppointmentDto, @CurrentUser() user: User) {
    return this.appointmentsService.create(dto, user.id);
  }

  @Roles(UserRole.PROFESSIONAL, UserRole.ADMIN)
  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateAppointmentDto) {
    return this.appointmentsService.update(id, dto);
  }

  @Roles(UserRole.PROFESSIONAL, UserRole.ADMIN)
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.appointmentsService.remove(id);
  }
}
