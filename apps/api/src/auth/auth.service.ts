import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { Patient } from '../patients/entities/patient.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { CreateStaffDto } from './dto/create-staff.dto';
import { RefreshTokenService } from './refresh-token.service';
import { UserRole } from '../common/enums/user-role.enum';
import { LgpdPolicy } from '../common/lgpd/lgpd.policy';
import { validatePasswordStrength } from '../common/crypto.util';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Patient)
    private readonly patientRepo: Repository<Patient>,
    private readonly jwtService: JwtService,
    private readonly refreshTokenService: RefreshTokenService,
  ) {}

  private async findUserByEmailInsensitive(email: string) {
    return this.userRepo
      .createQueryBuilder('user')
      .where('LOWER(user.email) = :email', { email: email.toLowerCase() })
      .getOne();
  }

  async login(dto: LoginDto, meta: { ip?: string; ua?: string } = {}) {
    let user: User | null = null;

    const identifierRaw = dto.identifier ?? dto.email ?? '';
    const identifier = identifierRaw.trim();

    if (!identifier) {
      throw new UnauthorizedException('Identificador não fornecido');
    }

    if (identifier.includes('@')) {
      user = await this.findUserByEmailInsensitive(identifier.toLowerCase());
    }

    if (!user) {
      const cleanCpf = identifier.replace(/\D/g, '');
      const patient = await this.patientRepo.findOneBy({ cpf: cleanCpf });

      if (patient && patient.userId) {
        user = await this.userRepo.findOneBy({ id: patient.userId });
      }
    }

    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Usuário inativo');
    }

    const passwordMatch = await bcrypt.compare(dto.password.trim(), user.password);

    if (!passwordMatch) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const accessToken = await this.generateAccessToken(user);
    const refreshToken = await this.refreshTokenService.create(user.id, meta);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isFirstAccess: user.mustChangePassword,
        lgpdAcceptedAt: user.lgpdAcceptedAt ?? null,
        lgpdAcceptedVersion: user.lgpdAcceptedVersion ?? null,
        lgpdCurrentVersion: LgpdPolicy.CURRENT_VERSION,
        lgpdRequiresAcceptance:
          !user.lgpdAcceptedAt ||
          user.lgpdAcceptedVersion !== LgpdPolicy.CURRENT_VERSION,
      },
    };
  }

  // Registro PÚBLICO: sempre cria PATIENT. Admin/Profissional só via createStaff.
  async register(dto: RegisterDto) {
    const normalizedEmail = dto.email.trim().toLowerCase();
    const existingUser = await this.findUserByEmailInsensitive(normalizedEmail);
    if (existingUser) {
      throw new ConflictException('E-mail já cadastrado');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = this.userRepo.create({
      name: dto.name,
      email: normalizedEmail,
      password: hashedPassword,
      role: UserRole.PATIENT,
    });

    const savedUser = await this.userRepo.save(user);

    return {
      id: savedUser.id,
      name: savedUser.name,
      email: savedUser.email,
      role: savedUser.role,
    };
  }

  // Criação de staff (PROFESSIONAL/ADMIN) — restrito a admin via @Roles no controller
  async createStaff(dto: CreateStaffDto) {
    const normalizedEmail = dto.email.trim().toLowerCase();
    const existingUser = await this.findUserByEmailInsensitive(normalizedEmail);
    if (existingUser) {
      throw new ConflictException('E-mail já cadastrado');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = this.userRepo.create({
      name: dto.name,
      email: normalizedEmail,
      password: hashedPassword,
      role: dto.role,
      mustChangePassword: true,
    });

    const saved = await this.userRepo.save(user);
    return {
      id: saved.id,
      name: saved.name,
      email: saved.email,
      role: saved.role,
    };
  }

  async getProfile(userId: string) {
    const user = await this.userRepo.findOneBy({ id: userId });
    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado');
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      isFirstAccess: user.mustChangePassword,
      lgpdAcceptedAt: user.lgpdAcceptedAt ?? null,
      lgpdAcceptedVersion: user.lgpdAcceptedVersion ?? null,
      lgpdCurrentVersion: LgpdPolicy.CURRENT_VERSION,
      lgpdRequiresAcceptance:
        !user.lgpdAcceptedAt ||
        user.lgpdAcceptedVersion !== LgpdPolicy.CURRENT_VERSION,
      createdAt: user.createdAt,
    };
  }

  async changePassword(userId: string, newPassword: string) {
    const user = await this.userRepo.findOneBy({ id: userId });
    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado');
    }

    const passwordError = validatePasswordStrength(newPassword);
    if (passwordError) {
      throw new BadRequestException(passwordError);
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.mustChangePassword = false;

    await this.userRepo.save(user);

    return { message: 'Senha alterada com sucesso' };
  }

  async acceptLgpd(userId: string) {
    const user = await this.userRepo.findOneBy({ id: userId });
    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado');
    }
    user.lgpdAcceptedAt = new Date();
    user.lgpdAcceptedVersion = LgpdPolicy.CURRENT_VERSION;
    await this.userRepo.save(user);

    const patient = await this.patientRepo.findOneBy({ userId: user.id });
    if (patient) {
      patient.lgpdConsentAt = user.lgpdAcceptedAt;
      await this.patientRepo.save(patient);
    }

    return {
      message: 'Termo LGPD aceito',
      lgpdAcceptedAt: user.lgpdAcceptedAt,
      lgpdAcceptedVersion: user.lgpdAcceptedVersion,
    };
  }

  /**
   * Endpoint público que descreve a política vigente. Usado pelos clientes
   * (web e mobile) para exibir o termo na tela de aceite.
   */
  getLgpdPolicy() {
    return {
      version: LgpdPolicy.CURRENT_VERSION,
      retentionYears: LgpdPolicy.DATA_RETENTION_YEARS,
      summary:
        'A Clínica Maya coleta apenas os dados necessários para o atendimento ' +
        'de RPG. Os dados são guardados pelo prazo mínimo legal e podem ser ' +
        'apagados mediante solicitação ao DPO.',
    };
  }

  async updateFcmToken(userId: string, fcmToken: string) {
    const user = await this.userRepo.findOneBy({ id: userId });
    if (!user) throw new UnauthorizedException('Usuário não encontrado');

    user.fcmToken = fcmToken;
    await this.userRepo.save(user);
    return { message: 'FCM Token atualizado' };
  }

  generateAccessToken(user: User) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    return this.jwtService.sign(payload, { expiresIn: '15m' });
  }
}
