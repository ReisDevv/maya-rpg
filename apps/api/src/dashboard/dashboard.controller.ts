import { Controller, Get, Param } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  @Roles(UserRole.PROFESSIONAL, UserRole.ADMIN)
  getStats() {
    return this.dashboardService.getProfessionalMetrics();
  }

  @Get('evolution/:patientId')
  @Roles(UserRole.PROFESSIONAL, UserRole.ADMIN)
  getEvolution(@Param('patientId') patientId: string) {
    return this.dashboardService.getPainEvolution(patientId);
  }
}
