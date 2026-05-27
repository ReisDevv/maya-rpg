import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { createHash, randomBytes } from 'crypto';
import { RefreshToken } from './entities/refresh-token.entity';

const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

@Injectable()
export class RefreshTokenService {
  constructor(
    @InjectRepository(RefreshToken)
    private readonly repo: Repository<RefreshToken>,
  ) {}

  private hash(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  async create(userId: string, meta: { ip?: string; ua?: string }): Promise<string> {
    const rawToken = randomBytes(64).toString('hex');
    await this.repo.save(
      this.repo.create({
        token: this.hash(rawToken),
        userId,
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
        ipAddress: meta.ip,
        userAgent: meta.ua,
      }),
    );
    return rawToken;
  }

  async rotate(rawToken: string, meta: { ip?: string; ua?: string }) {
    const hashed = this.hash(rawToken);
    const existing = await this.repo.findOne({ where: { token: hashed }, relations: ['user'] });

    if (!existing) throw new UnauthorizedException('Refresh token inválido');

    if (existing.revoked) {
      await this.repo.update({ userId: existing.userId }, { revoked: true });
      throw new UnauthorizedException('Token reutilizado — sessão encerrada');
    }

    if (existing.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token expirado');
    }

    const newRaw = await this.create(existing.userId, meta);
    existing.revoked = true;
    existing.replacedByToken = this.hash(newRaw);
    await this.repo.save(existing);

    return { user: existing.user, newRefreshToken: newRaw };
  }

  async revoke(rawToken: string): Promise<void> {
    await this.repo.update({ token: this.hash(rawToken) }, { revoked: true });
  }

  async revokeAll(userId: string): Promise<void> {
    await this.repo.update({ userId }, { revoked: true });
  }

  async cleanup(): Promise<void> {
    await this.repo.delete({ expiresAt: LessThan(new Date()) });
  }
}
