import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe, ClassSerializerInterceptor, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import * as express from 'express';
import cookieParser from 'cookie-parser';
import { join } from 'path';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.setGlobalPrefix('api');
  app.use(helmet());
  app.use(cookieParser());

  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.set('trust proxy', 1);
  expressApp.set('etag', false);

  expressApp.use('/api', (_req: express.Request, res: express.Response, next: express.NextFunction) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
    next();
  });

  expressApp.use('/uploads', express.static(join(process.cwd(), 'uploads')));

  const corsOriginsEnv = configService.get<string>('CORS_ORIGINS');
  const nodeEnv = configService.get<string>('NODE_ENV') || 'development';
  let parsedOrigins: string[] = [];

  if (corsOriginsEnv && corsOriginsEnv.trim() !== '') {
    parsedOrigins = corsOriginsEnv
      .split(',')
      .map((o) => o.trim())
      .filter((o) => o && o !== '*');
  }

  if (parsedOrigins.length === 0) {
    if (nodeEnv === 'production') {
      logger.error('CRITICAL: CORS_ORIGINS não configurado em produção!');
      throw new Error('CORS_ORIGINS é obrigatório em produção.');
    } else {
      parsedOrigins = ['http://localhost:4200', 'http://localhost:3000'];
    }
  }

  app.enableCors({
    origin: parsedOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'X-Client-Type'],
  });

  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );

  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
  app.useGlobalFilters(new AllExceptionsFilter());

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Maya RPG API')
    .setDescription('API para acompanhamento de pacientes de RPG - Clínica Maya Yoshiko Yamamoto')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, swaggerConfig));

  const port = configService.get<number>('PORT') ?? 3000;
  await app.listen(port);
  logger.log(`Maya RPG API running on http://localhost:${port}/api`);
  logger.log(`Swagger docs at http://localhost:${port}/api/docs`);
}

void bootstrap();
