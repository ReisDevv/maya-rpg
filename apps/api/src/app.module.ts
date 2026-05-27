import { Module, OnApplicationBootstrap, Logger } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';

import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';
import { User } from './auth/entities/user.entity';
import { RefreshToken } from './auth/entities/refresh-token.entity';
import { PasswordResetToken } from './auth/entities/password-reset-token.entity';
import { EmailChangeRequest } from './auth/entities/email-change-request.entity';

import { PatientsModule } from './patients/patients.module';
import { Patient } from './patients/entities/patient.entity';

import { ExercisesModule } from './exercises/exercises.module';
import { Exercise } from './exercises/entities/exercise.entity';

import { PrescriptionsModule } from './prescriptions/prescriptions.module';
import { Prescription } from './prescriptions/entities/prescription.entity';

import { MedicalRecordsModule } from './medical-records/medical-records.module';
import { MedicalRecord } from './medical-records/entities/medical-record.entity';

import { AppointmentsModule } from './appointments/appointments.module';
import { Appointment } from './appointments/entities/appointment.entity';

import { CheckInsModule } from './check-ins/check-ins.module';
import { CheckIn } from './check-ins/entities/check-in.entity';

import { DashboardModule } from './dashboard/dashboard.module';

import { NotificationsModule } from './notifications/notifications.module';
import { Notification } from './notifications/entities/notification.entity';


import { UsersModule } from './users/users.module';

import { ChatModule } from './chat/chat.module';
import { Conversation } from './chat/entities/conversation.entity';
import { ChatMessage } from './chat/entities/message.entity';

import { PaymentsModule } from './payments/payments.module';
import { Payment } from './payments/entities/payment.entity';

import { UploadModule } from './upload/upload.module';

import { AuditModule } from './common/audit/audit.module';
import { AuditLog } from './common/audit/audit-log.entity';
import { AuditInterceptor } from './common/audit/audit.interceptor';
import { LgpdModule } from './common/lgpd/lgpd.module';

const entities = [
  User,
  RefreshToken,
  PasswordResetToken,
  EmailChangeRequest,
  Patient,
  Exercise,
  Prescription,
  MedicalRecord,
  Appointment,
  AuditLog,
  CheckIn,
  Conversation,
  ChatMessage,
  Payment,
  Notification,
];

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    ThrottlerModule.forRoot([{ ttl: 60000, limit: 60 }]),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const logger = new Logger('TypeOrmConfig');
        const host = configService.get<string>('DB_HOST');
        const nodeEnv = configService.get<string>('NODE_ENV') ?? 'development';
        // DB_SYNC=true must be explicitly set to enable synchronize; never defaults on in prod
        const synchronize =
          nodeEnv !== 'production' && configService.get<string>('DB_SYNC') !== 'false';
        const sslEnabled =
          configService.get<string>('DB_SSL') === 'true' || nodeEnv === 'production';

        let sslConfig: boolean | { ca?: string; rejectUnauthorized: boolean } =
          false;
        if (sslEnabled) {
          const ca = configService.get<string>('DB_SSL_CA');
          // Render-managed databases use self-signed certs; rejectUnauthorized must be false
          // unless a custom CA is explicitly provided.
          sslConfig = ca
            ? { ca, rejectUnauthorized: true }
            : { rejectUnauthorized: false };
        }

        if (!host) {
          logger.warn('DB_HOST not set — falling back to localhost');
        }
        if (synchronize) {
          logger.warn('TypeORM synchronize is ENABLED — do not use in production');
        }

        return {
          type: 'postgres',
          host: host ?? 'localhost',
          port: Number(configService.get('DB_PORT')) || 5432,
          username: configService.get<string>('DB_USER'),
          password: configService.get<string>('DB_PASSWORD') ?? '',
          database: configService.get<string>('DB_NAME'),
          entities,
          synchronize,
          ssl: sslConfig,
        };
      },
    }),

    AuthModule,
    PatientsModule,
    ExercisesModule,
    PrescriptionsModule,
    MedicalRecordsModule,
    AppointmentsModule,
    AuditModule,
    CheckInsModule,
    DashboardModule,
    NotificationsModule,
    UploadModule,
    LgpdModule,
    UsersModule,
    ChatModule,
    PaymentsModule,
  ],
  controllers: [AppController],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_INTERCEPTOR, useClass: AuditInterceptor },
  ],
})
export class AppModule implements OnApplicationBootstrap {
  private readonly logger = new Logger('AppModule');

  constructor(private readonly dataSource: DataSource) {}

  onApplicationBootstrap() {
    if (this.dataSource.isInitialized) {
      this.logger.log('Database connection established');
    } else {
      this.logger.error('Database connection failed');
    }
  }
}
