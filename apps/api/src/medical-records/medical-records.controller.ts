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
  Request,
  Req,
} from '@nestjs/common';
import { MedicalRecordsService } from './medical-records.service';
import { CreateMedicalRecordDto } from './dto/create-medical-record.dto';
import { UpdateMedicalRecordDto } from './dto/update-medical-record.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';

@Controller('medical-records')
export class MedicalRecordsController {
  constructor(private readonly recordsService: MedicalRecordsService) {}

  @Get()
  @Roles(UserRole.PROFESSIONAL, UserRole.ADMIN)
  findAll(@Query('page') page?: number, @Query('pageSize') pageSize?: number) {
    return this.recordsService.findAll(page || 1, pageSize || 10);
  }

  @Get('my')
  @Roles(UserRole.PATIENT)
  findMy(
    @Req() req: any,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
  ) {
    return this.recordsService.findByUser(req.user, page || 1, pageSize || 10);
  }

  @Get('patient/:patientId')
  @Roles(UserRole.PROFESSIONAL, UserRole.ADMIN)
  findByPatient(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
  ) {
    return this.recordsService.findByPatient(
      patientId,
      page || 1,
      pageSize || 10,
    );
  }

  @Get(':id')
  @Roles(UserRole.PATIENT, UserRole.PROFESSIONAL, UserRole.ADMIN)
  findOne(@Param('id', ParseUUIDPipe) id: string, @Req() req: any) {
    return this.recordsService.findOneSecure(id, req.user);
  }

  @Post()
  @Roles(UserRole.PROFESSIONAL, UserRole.ADMIN)
  create(@Body() dto: CreateMedicalRecordDto, @Request() req: any) {
    return this.recordsService.create(dto, req.user.id);
  }

  @Patch(':id')
  @Roles(UserRole.PROFESSIONAL, UserRole.ADMIN)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMedicalRecordDto,
  ) {
    return this.recordsService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.recordsService.remove(id);
  }
}
