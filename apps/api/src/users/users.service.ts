import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../auth/entities/user.entity';
import { UserRole } from '../common/enums/user-role.enum';
import { clampPagination } from '../common/pagination.util';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async findAll(page = 1, pageSize = 10, role?: UserRole, isActive?: boolean) {
    const clamped = clampPagination(page, pageSize);
    const query = this.userRepo.createQueryBuilder('user');

    if (role) {
      query.andWhere('user.role = :role', { role });
    }

    if (isActive !== undefined) {
      query.andWhere('user.isActive = :isActive', { isActive });
    }

    query
      .select([
        'user.id',
        'user.name',
        'user.email',
        'user.role',
        'user.isActive',
        'user.mustChangePassword',
        'user.lgpdAcceptedAt',
        'user.lgpdAcceptedVersion',
        'user.createdAt',
        'user.updatedAt',
      ])
      .andWhere('user.role IN (:...roles)', {
        roles: [UserRole.ADMIN, UserRole.PROFESSIONAL],
      })
      .orderBy('user.createdAt', 'DESC')
      .skip((clamped.page - 1) * clamped.pageSize)
      .take(clamped.pageSize);

    const [data, total] = await query.getManyAndCount();

    return {
      data: data.map((user) => this.toResponse(user)),
      total,
      page: clamped.page,
      pageSize: clamped.pageSize,
      totalPages: Math.ceil(total / clamped.pageSize),
    };
  }

  async updateStatus(id: string, isActive: boolean) {
    const user = await this.userRepo.findOneBy({ id });
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    user.isActive = isActive;
    const saved = await this.userRepo.save(user);
    return this.toResponse(saved);
  }

  private toResponse(user: User) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      mustChangePassword: user.mustChangePassword,
      lgpdAcceptedAt: user.lgpdAcceptedAt,
      lgpdAcceptedVersion: user.lgpdAcceptedVersion,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
