import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './audit-log.entity';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
  ) {}

  async createLog(logData: Partial<AuditLog>): Promise<void> {
    try {
      const log = this.auditLogRepository.create(logData);
      await this.auditLogRepository.save(log);
    } catch (error) {
      // Falhas no log de auditoria não devem quebrar a aplicação, apenas logar o erro
      this.logger.error('Failed to create audit log', error.stack);
    }
  }
}
