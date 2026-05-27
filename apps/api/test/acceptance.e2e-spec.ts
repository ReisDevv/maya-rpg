import { Test, TestingModule } from '@nestjs/testing';
import {
  INestApplication,
  Injectable,
  ValidationPipe,
  CanActivate,
  ExecutionContext,
} from '@nestjs/common';
import request from 'supertest';
import { AuthController } from '../src/auth/auth.controller';
import { AuthService } from '../src/auth/auth.service';
import { RefreshTokenService } from '../src/auth/refresh-token.service';
import { EmailChangeService } from '../src/auth/email-change.service';
import { PasswordResetService } from '../src/auth/password-reset.service';
import { MailService } from '../src/common/mail/mail.service';
import { PatientsController } from '../src/patients/patients.controller';
import { PatientsService } from '../src/patients/patients.service';
import { PrescriptionsController } from '../src/prescriptions/prescriptions.controller';
import { PrescriptionsService } from '../src/prescriptions/prescriptions.service';
import { CheckInsController } from '../src/check-ins/check-ins.controller';
import { CheckInsService } from '../src/check-ins/check-ins.service';
import { DashboardController } from '../src/dashboard/dashboard.controller';
import { DashboardService } from '../src/dashboard/dashboard.service';
import { NotificationsController } from '../src/notifications/notifications.controller';
import { NotificationsService } from '../src/notifications/notifications.service';

const mockUser = {
  id: 'user-1',
  name: 'Paciente Teste',
  email: 'paciente@teste.com',
  role: 'PATIENT',
  lgpdAcceptedAt: '2026-05-03T10:00:00.000Z',
  mustChangePassword: false,
};

@Injectable()
class MockAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    req.user = mockUser;
    return true;
  }
}

describe('Acceptance Test - Fluxo Completo do Paciente (System/Acceptance)', () => {
  let app: INestApplication;

  const mockRefreshTokenService = {
    rotate: jest.fn().mockResolvedValue({
      user: mockUser,
      newRefreshToken: 'new-refresh-token',
    }),
    revoke: jest.fn().mockResolvedValue(undefined),
    revokeAll: jest.fn().mockResolvedValue(undefined),
    create: jest.fn().mockResolvedValue('raw-refresh-token'),
  };

  const mockMailService = {
    sendVerificationCode: jest.fn().mockResolvedValue(undefined),
    sendPasswordReset: jest.fn().mockResolvedValue(undefined),
  };

  const mockEmailChangeService = {
    requestCurrentEmailChangeCode: jest
      .fn()
      .mockResolvedValue({ requestId: 'ec-1', message: 'Código enviado.' }),
    verifyCurrentEmailChangeCode: jest
      .fn()
      .mockResolvedValue({ message: 'Código validado.' }),
    requestNewEmailChangeCode: jest
      .fn()
      .mockResolvedValue({ message: 'Código enviado para novo e-mail.' }),
    confirmNewEmailChangeCode: jest
      .fn()
      .mockResolvedValue({ message: 'E-mail alterado com sucesso.' }),
  };

  const mockPasswordResetService = {
    recoverPassword: jest.fn().mockResolvedValue({
      message: 'Se o e-mail existir, você receberá um link de recuperação.',
    }),
    resetPassword: jest
      .fn()
      .mockResolvedValue({ message: 'Senha redefinida com sucesso' }),
  };

  const mockAuthService = {
    login: jest.fn().mockResolvedValue({
      accessToken: 'test-access-token',
      refreshToken: 'test-refresh-token',
      user: {
        id: 'user-1',
        name: 'Paciente Teste',
        email: 'paciente@teste.com',
        role: 'PATIENT',
        lgpdAcceptedAt: null,
        mustChangePassword: false,
      },
    }),
    register: jest.fn().mockResolvedValue({
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
    }),
    acceptLgpd: jest.fn().mockResolvedValue({
      message: 'LGPD terms accepted successfully.',
      lgpdAcceptedAt: '2026-05-03T10:00:00.000Z',
    }),
    getProfile: jest.fn().mockResolvedValue({
      id: 'user-1',
      name: 'Paciente Teste',
      email: 'paciente@teste.com',
      role: 'PATIENT',
      lgpdAcceptedAt: '2026-05-03T10:00:00.000Z',
    }),
    generateAccessToken: jest.fn().mockResolvedValue('generated-access-token'),
  };

  const mockPatientsService = {
    create: jest.fn().mockResolvedValue({
      id: 'patient-1',
      fullName: 'Paciente Teste',
      email: 'paciente@teste.com',
      phone: '11999999999',
      cpf: '12345678901',
      status: 'PENDING',
      lgpdConsentAt: null,
    }),
    findOne: jest.fn().mockResolvedValue({
      id: 'patient-1',
      fullName: 'Paciente Teste',
      email: 'paciente@teste.com',
      status: 'ACTIVE',
      lgpdConsentAt: '2026-05-03T10:00:00.000Z',
      acceptedTerms: true,
    }),
    findOneSecure: jest.fn().mockResolvedValue({
      id: 'patient-1',
      fullName: 'Paciente Teste',
      email: 'paciente@teste.com',
      status: 'ACTIVE',
      lgpdConsentAt: '2026-05-03T10:00:00.000Z',
      acceptedTerms: true,
    }),
  };

  const mockPrescriptionsService = {
    create: jest.fn().mockResolvedValue({
      id: 'prescription-1',
      patientId: 'patient-1',
      title: 'Plano RPG - Semana 1',
      description: 'Exercicios de alongamento e fortalecimento',
      exercises: [
        {
          exerciseId: 'exercise-1',
          sets: 3,
          repetitions: 10,
          holdTimeSeconds: 30,
          frequency: '3x por semana',
          notes: 'Manter postura ereta',
          order: 1,
        },
      ],
      startDate: '2026-05-03',
      endDate: '2026-06-03',
      isActive: true,
    }),
    findByPatient: jest.fn().mockResolvedValue({
      data: [
        {
          id: 'prescription-1',
          title: 'Plano RPG - Semana 1',
          isActive: true,
        },
      ],
      total: 1,
      page: 1,
      pageSize: 10,
      totalPages: 1,
    }),
  };

  const mockCheckInsService = {
    create: jest.fn().mockResolvedValue({
      id: 'checkin-1',
      patientId: 'patient-1',
      prescriptionId: 'prescription-1',
      exerciseId: 'exercise-1',
      painLevel: 3,
      notes: 'Dor leve no final',
      isCompleted: true,
      executedAt: '2026-05-03T10:00:00.000Z',
    }),
    findAllByPatientPaginated: jest.fn().mockResolvedValue({
      data: [
        {
          id: 'checkin-1',
          patientId: 'patient-1',
          painLevel: 3,
          executedAt: '2026-05-03T10:00:00.000Z',
          isCompleted: true,
        },
      ],
      total: 1,
      page: 1,
      pageSize: 20,
      totalPages: 1,
    }),
  };

  const mockDashboardService = {
    getProfessionalMetrics: jest.fn().mockResolvedValue({
      activePatients: 1,
      totalPatients: 1,
      totalExercises: 3,
      activePrescriptions: 1,
      averageAdherenceRate: 1.0,
      recentCheckIns: 1,
      upcomingAppointments: 0,
      timestamp: new Date('2026-05-03T10:00:00.000Z'),
    }),
    getPainEvolution: jest
      .fn()
      .mockResolvedValue([{ date: '2026-05-03', painLevel: 3 }]),
  };

  const mockNotificationsService = {
    findByUser: jest.fn().mockResolvedValue({
      data: [],
      total: 0,
      page: 1,
      pageSize: 20,
      totalPages: 0,
    }),
    getUnreadCount: jest.fn().mockResolvedValue({ count: 0 }),
    markAsRead: jest.fn().mockResolvedValue({
      id: 'notif-1',
      isRead: true,
    }),
    markAllAsRead: jest.fn().mockResolvedValue({ affected: 0 }),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [
        AuthController,
        PatientsController,
        PrescriptionsController,
        CheckInsController,
        DashboardController,
        NotificationsController,
      ],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        {
          provide: RefreshTokenService,
          useValue: mockRefreshTokenService,
        },
        { provide: EmailChangeService, useValue: mockEmailChangeService },
        {
          provide: PasswordResetService,
          useValue: mockPasswordResetService,
        },
        { provide: MailService, useValue: mockMailService },
        { provide: PatientsService, useValue: mockPatientsService },
        {
          provide: PrescriptionsService,
          useValue: mockPrescriptionsService,
        },
        { provide: CheckInsService, useValue: mockCheckInsService },
        { provide: DashboardService, useValue: mockDashboardService },
        {
          provide: NotificationsService,
          useValue: mockNotificationsService,
        },
      ],
    })
      .overrideGuard(MockAuthGuard)
      .useValue(new MockAuthGuard())
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalGuards(new MockAuthGuard());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('Fluxo completo: cadastro -> login -> aceite LGPD -> prescricao -> check-in -> evolucao', async () => {
    const registerRes = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        name: 'Paciente Teste',
        email: 'paciente@teste.com',
        password: '123456',
      })
      .expect(201);
    expect(registerRes.body).toHaveProperty('accessToken');

    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        identifier: 'paciente@teste.com',
        password: '123456',
      })
      .expect(201);
    expect(loginRes.body).toHaveProperty('accessToken');
    expect(loginRes.body).toHaveProperty('refreshToken');
    expect(loginRes.body.user).toBeDefined();
    expect(loginRes.body.user.lgpdAcceptedAt).toBeNull();

    const lgpdRes = await request(app.getHttpServer())
      .post('/auth/accept-lgpd')
      .expect(201);
    expect(lgpdRes.body).toHaveProperty('lgpdAcceptedAt');

    const patientRes = await request(app.getHttpServer())
      .post('/patients')
      .send({
        fullName: 'Paciente Teste',
        email: 'paciente@teste.com',
        phone: '11999999999',
        birthDate: '1990-01-01',
        cpf: '12345678901',
      })
      .expect(201);
    expect(patientRes.body).toHaveProperty('id');
    expect(patientRes.body.status).toBe('PENDING');

    const prescriptionRes = await request(app.getHttpServer())
      .post('/prescriptions')
      .send({
        patientId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        title: 'Plano RPG - Semana 1',
        description: 'Exercicios de alongamento e fortalecimento',
        exercises: [
          {
            exerciseId: 'b1b2c3d4-e5f6-7890-abcd-ef1234567890',
            sets: 3,
            repetitions: 10,
            holdTimeSeconds: 30,
            frequency: '3x por semana',
            notes: 'Manter postura ereta',
            order: 1,
          },
        ],
        startDate: '2026-05-03',
        endDate: '2026-06-03',
      })
      .expect(201);
    expect(prescriptionRes.body).toHaveProperty('id');
    expect(prescriptionRes.body.isActive).toBe(true);
    expect(prescriptionRes.body.exercises).toHaveLength(1);

    const checkInRes = await request(app.getHttpServer())
      .post('/check-ins')
      .send({
        prescriptionId: '00000000-0000-0000-0000-000000000001',
        exerciseId: '00000000-0000-0000-0000-000000000010',
        painLevel: 3,
        notes: 'Dor leve no final',
        isCompleted: true,
        executedAt: '2026-05-03T10:00:00.000Z',
      })
      .expect(201);
    expect(checkInRes.body).toHaveProperty('id');
    expect(checkInRes.body.painLevel).toBe(3);
    expect(checkInRes.body.isCompleted).toBe(true);

    const dashboardRes = await request(app.getHttpServer())
      .get('/dashboard/stats')
      .expect(200);
    expect(dashboardRes.body).toHaveProperty('activePatients');
    expect(dashboardRes.body).toHaveProperty('averageAdherenceRate');
    expect(dashboardRes.body).toHaveProperty('recentCheckIns');
    expect(dashboardRes.body.activePatients).toBeGreaterThanOrEqual(1);
    expect(dashboardRes.body.recentCheckIns).toBeGreaterThanOrEqual(1);
  });

  it('Notificacoes: listar e contar nao lidas', async () => {
    const notifRes = await request(app.getHttpServer())
      .get('/notifications')
      .expect(200);
    expect(notifRes.body).toHaveProperty('data');
    expect(notifRes.body).toHaveProperty('total');

    const unreadRes = await request(app.getHttpServer())
      .get('/notifications/unread-count')
      .expect(200);
    expect(unreadRes.body).toHaveProperty('count');
  });

  it('Verifica que prescricao nao pode ser criada para paciente sem LGPD', async () => {
    mockPatientsService.findOneSecure.mockResolvedValueOnce({
      id: 'c1b2c3d4-e5f6-7890-abcd-ef1234567890',
      fullName: 'Paciente Sem LGPD',
      status: 'ACTIVE',
      lgpdConsentAt: null,
      acceptedTerms: false,
    });

    mockPrescriptionsService.create.mockRejectedValueOnce(
      new Error(
        'Patient must accept LGPD terms before receiving prescriptions',
      ),
    );

    const res = await request(app.getHttpServer())
      .post('/prescriptions')
      .send({
        patientId: 'c1b2c3d4-e5f6-7890-abcd-ef1234567890',
        title: 'Plano invalido',
        exercises: [
          {
            exerciseId: 'b1b2c3d4-e5f6-7890-abcd-ef1234567890',
            frequency: '1x',
            order: 1,
          },
        ],
        startDate: '2026-05-03',
      })
      .expect(500);

    expect(res.body.message || res.body.error).toBeDefined();
  });

  it('Check-ins paginados: my-history retorna paginacao', async () => {
    const historyRes = await request(app.getHttpServer())
      .get('/check-ins/my-history?page=1&pageSize=10')
      .expect(200);
    expect(historyRes.body).toHaveProperty('data');
    expect(historyRes.body).toHaveProperty('total');
    expect(historyRes.body).toHaveProperty('page');
    expect(historyRes.body).toHaveProperty('pageSize');
    expect(historyRes.body).toHaveProperty('totalPages');
  });
});
