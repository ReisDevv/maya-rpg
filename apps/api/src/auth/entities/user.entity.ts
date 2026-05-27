import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { UserRole } from '../../common/enums/user-role.enum';
import { RefreshToken } from './refresh-token.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column()
  @Exclude()
  password: string;

  @Column({
    type: 'simple-enum',
    enum: UserRole,
    default: UserRole.PATIENT,
  })
  role: UserRole;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  mustChangePassword: boolean;

  @Column({ nullable: true })
  fcmToken: string;

  // Data em que o usuário aceitou o termo LGPD (null = ainda não aceitou)
  @Column({ type: 'timestamp', nullable: true })
  lgpdAcceptedAt: Date | null;

  // Versão do termo LGPD aceita pelo usuário. Quando a clínica publica uma nova
  // versão (constante LgpdPolicy.CURRENT_VERSION), comparamos este valor para
  // exigir novo aceite.
  @Column({ type: 'varchar', length: 16, nullable: true })
  lgpdAcceptedVersion: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Flag para indicar se os dados pessoais deste usuário foram anonimizados
  @Column({ default: false })
  isAnonymized: boolean;

  @Column({ type: 'timestamp', nullable: true })
  anonymizedAt: Date | null;

  @OneToMany(() => RefreshToken, (token) => token.user)
  refreshTokens: RefreshToken[];
}
