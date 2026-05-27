import {
  Controller,
  Get,
  Post,
  Req,
  Res,
  HttpCode,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { LgpdService } from './lgpd.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Controller('me/lgpd')
export class LgpdController {
  constructor(private readonly lgpdService: LgpdService) {}

  @Get('export')
  @UseGuards(JwtAuthGuard)
  async exportMyData(
    @Req() req: Request & { user?: any },
    @Res() res: Response,
  ) {
    const user = req.user;
    // Set headers for zip
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="maya-rpg-export-${user.id}.zip"`,
    );

    // The service will pipe the archive into the response stream
    await this.lgpdService.exportUserDataToZip(user.id, res);
    // response will be finalized by archive stream
  }

  @Post('anonymize')
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  async anonymizeMyData(@Req() req: Request & { user?: any }) {
    const user = req.user;
    const result = await this.lgpdService.anonymizeUser(user.id);
    return { message: 'User anonymized', ...result };
  }
}
