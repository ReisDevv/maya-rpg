import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { DashboardController } from '../src/dashboard/dashboard.controller';
import { DashboardService } from '../src/dashboard/dashboard.service';

describe('DashboardController (e2e)', () => {
  let app: INestApplication;
  const dashboardServiceMock = {
    getProfessionalMetrics: jest.fn().mockResolvedValue({
      activePatients: 4,
      totalPatients: 6,
      totalExercises: 12,
      activePrescriptions: 3,
      averageAdherenceRate: 0.75,
      recentCheckIns: 3,
      timestamp: new Date('2026-01-01T00:00:00.000Z'),
    }),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [DashboardController],
      providers: [
        {
          provide: DashboardService,
          useValue: dashboardServiceMock,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  // Teste de Integração 1: Garantir o fluxo de ponta a ponta na API real do Dashboard
  it('/dashboard/metrics (GET) - returns metrics', () => {
    return request(app.getHttpServer())
      .get('/dashboard/metrics')
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('totalPatients');
        expect(res.body).toHaveProperty('recentCheckIns');
        expect(res.body).toHaveProperty('averageAdherenceRate');
        expect(res.body).toHaveProperty('timestamp');
      });
  });

  // Teste de Integração 2: Validação de Not Found
  it('/dashboard/invalid-route (GET) - returns 404', () => {
    return request(app.getHttpServer())
      .get('/dashboard/invalid-route')
      .expect(404);
  });
});
