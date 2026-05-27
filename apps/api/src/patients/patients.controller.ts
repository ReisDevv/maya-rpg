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
import { PatientsService } from './patients.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { PatientResponseDto } from './dto/patient-response.dto';
import { PatientStatus } from '../common/enums/patient-status.enum';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { User } from '../auth/entities/user.entity';

@Controller('patients')
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Roles(UserRole.PROFESSIONAL, UserRole.ADMIN)
  @Get()
  async findAll(
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
    @Query('search') search?: string,
    @Query('status') status?: PatientStatus,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'ASC' | 'DESC',
  ) {
    const result = await this.patientsService.findAll(
      page ?? 1,
      pageSize ?? 10,
      search,
      status,
      sortBy,
      sortOrder,
    );
    return { ...result, data: result.data.map((p) => new PatientResponseDto(p)) };
  }

  @Roles(UserRole.PATIENT, UserRole.PROFESSIONAL, UserRole.ADMIN)
  @Get('me')
  async getMe(@CurrentUser() user: User) {
    const patient = await this.patientsService.findByUserId(user.id);
    return new PatientResponseDto(patient);
  }

  @Roles(UserRole.PATIENT)
  @Patch('me')
  async updateMe(@CurrentUser() user: User, @Body() dto: UpdatePatientDto) {
    const patient = await this.patientsService.updateByUserId(user.id, dto);
    return new PatientResponseDto(patient);
  }

  @Roles(UserRole.PATIENT, UserRole.PROFESSIONAL, UserRole.ADMIN)
  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    const patient = await this.patientsService.findOneSecure(id, user);
    return new PatientResponseDto(patient);
  }

  @Roles(UserRole.PROFESSIONAL, UserRole.ADMIN)
  @Post()
  async create(@Body() dto: CreatePatientDto) {
    const patient = await this.patientsService.create(dto);
    return new PatientResponseDto(patient);
  }

  @Roles(UserRole.PROFESSIONAL, UserRole.ADMIN)
  @Patch(':id')
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdatePatientDto) {
    const patient = await this.patientsService.update(id, dto);
    return new PatientResponseDto(patient);
  }

  @Roles(UserRole.PROFESSIONAL, UserRole.ADMIN)
  @Post(':id/reminders')
  sendReminder(@Param('id', ParseUUIDPipe) id: string) {
    return this.patientsService.sendReminder(id);
  }

  @Roles(UserRole.ADMIN)
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.patientsService.remove(id);
  }
}
