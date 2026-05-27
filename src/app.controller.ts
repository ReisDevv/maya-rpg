import { Controller, Get, Head } from '@nestjs/common';
import { Public } from './auth/decorators/public.decorator';
import { SkipThrottle } from '@nestjs/throttler';

@SkipThrottle()
@Controller()
export class AppController {
  @Public()
  @Head()
  @Get()
  healthCheck() {
    return { status: 'ok' };
  }
}
