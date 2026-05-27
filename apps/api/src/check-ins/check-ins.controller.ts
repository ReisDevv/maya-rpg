import { Controller, Post, Body, Get, Param, Query, ParseUUIDPipe } from '@nestjs/common';
import { CheckInsService } from './check-ins.service';
import { CreateCheckInDto } from './dto/create-check-in.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { User } from '../auth/entities/user.entity';

@Controller('check-ins')
export class CheckInsController {
  constructor(private readonly checkInsService: CheckInsService) {}

  @Roles(UserRole.PATIENT)
  @Post()
  create(@Body() dto: CreateCheckInDto, @CurrentUser() user: User) {
    return this.checkInsService.create(dto, user.id);
  }

  @Roles(UserRole.PATIENT)
  @Post('sync')
  syncBatch(@Body() checkIns: CreateCheckInDto[], @CurrentUser() user: User) {
    return this.checkInsService.syncBatch(checkIns, user.id);
  }

  @Roles(UserRole.PATIENT)
  @Get('my-history')
  findMyHistory(
    @CurrentUser() user: User,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
  ) {
    return this.checkInsService.findAllByPatientPaginated(user.id, page ?? 1, pageSize ?? 20);
  }

  @Roles(UserRole.PROFESSIONAL, UserRole.ADMIN)
  @Get('patient/:patientId')
  findByPatient(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
  ) {
    return this.checkInsService.findAllByPatientIdPaginated(patientId, page ?? 1, pageSize ?? 20);
  }
}
