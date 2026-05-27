import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { PatientStatus } from '../../common/enums/patient-status.enum';
import { User } from '../../auth/entities/user.entity';
import { Prescription } from '../../prescriptions/entities/prescription.entity';
import { CheckIn } from '../../check-ins/entities/check-in.entity';

@Entity('patients')
export class Patient {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  @Index()
  userId: string;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  fullName: string;

  @Column({ unique: true })
  email: string;

  @Column()
  phone: string;

  @Column()
  birthDate: Date;

  @Column({ unique: true })
  cpf: string;

  @Column({
    type: 'simple-enum',
    enum: PatientStatus,
    default: PatientStatus.PENDING,
  })
  status: PatientStatus;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'timestamp', nullable: true })
  lgpdConsentAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => Prescription, (prescription) => prescription.patient)
  prescriptions: Prescription[];

  @OneToMany(() => CheckIn, (checkIn) => checkIn.patient)
  checkIns: CheckIn[];

  @UpdateDateColumn()
  updatedAt: Date;

  // Flag para indicar se o paciente teve seus dados anonimizados
  @Column({ default: false })
  isAnonymized: boolean;

  @Column({ type: 'timestamp', nullable: true })
  anonymizedAt: Date | null;
}
