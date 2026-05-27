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
  Req,
} from '@nestjs/common';
import { PrescriptionsService } from './prescriptions.service';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { UpdatePrescriptionDto } from './dto/update-prescription.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';

@Controller('prescriptions')
export class PrescriptionsController {
  constructor(private readonly prescriptionsService: PrescriptionsService) {}

  @Get()
  @Roles(UserRole.PROFESSIONAL, UserRole.ADMIN)
  findAll(@Query('page') page?: number, @Query('pageSize') pageSize?: number) {
    return this.prescriptionsService.findAll(page || 1, pageSize || 10);
  }

  @Get('my')
  @Roles(UserRole.PATIENT)
  findMy(
    @Req() req: any,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
  ) {
    return this.prescriptionsService.findByUser(
      req.user,
      page || 1,
      pageSize || 10,
    );
  }

  @Get('me/full')
  @Roles(UserRole.PATIENT)
  findMyFull(@Req() req: any) {
    return this.prescriptionsService.findFullByUser(req.user);
  }

  @Get('patient/:patientId')
  @Roles(UserRole.PROFESSIONAL, UserRole.ADMIN)
  findByPatient(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
    @Req() req?: any,
  ) {
    return this.prescriptionsService.findByPatientSecure(
      patientId,
      req.user,
      page || 1,
      pageSize || 10,
    );
  }

  @Get(':id')
  @Roles(UserRole.PROFESSIONAL, UserRole.ADMIN, UserRole.PATIENT)
  findOne(@Param('id', ParseUUIDPipe) id: string, @Req() req: any) {
    return this.prescriptionsService.findOneSecure(id, req.user);
  }

  @Post()
  @Roles(UserRole.PROFESSIONAL, UserRole.ADMIN)
  create(@Body() dto: CreatePrescriptionDto, @Req() req: any) {
    return this.prescriptionsService.create(dto, req.user.id);
  }

  @Patch(':id')
  @Roles(UserRole.PROFESSIONAL, UserRole.ADMIN)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePrescriptionDto,
  ) {
    return this.prescriptionsService.update(id, dto);
  }

  @Patch(':id/deactivate')
  @Roles(UserRole.PROFESSIONAL, UserRole.ADMIN)
  deactivate(@Param('id', ParseUUIDPipe) id: string) {
    return this.prescriptionsService.deactivate(id);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.prescriptionsService.remove(id);
  }
}
