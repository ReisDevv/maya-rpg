import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Patient } from '../../patients/entities/patient.entity';

export enum AppointmentStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum AppointmentType {
  RPG = 'RPG',
  FISIO_ORTOPEDICA = 'FISIO_ORTOPEDICA',
  AVALIACAO = 'AVALIACAO',
  RETORNO = 'RETORNO',
  OUTROS = 'OUTROS',
}

export enum SatisfactionRating {
  MUITO_MAL = 'MUITO_MAL',
  MAL = 'MAL',
  NEUTRO = 'NEUTRO',
  BEM = 'BEM',
  SUPER_BEM = 'SUPER_BEM',
}

@Entity('appointments')
export class Appointment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  patientId: string;

  @ManyToOne(() => Patient, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'patientId' })
  patient: Patient;

  @Index()
  @Column({ type: 'timestamptz' })
  dateTime: Date;

  @Column({ default: 50 })
  durationMinutes: number;

  @Column({ default: 15 })
  bufferMinutes: number;

  @Column({
    type: 'simple-enum',
    enum: AppointmentType,
    default: AppointmentType.RPG,
  })
  type: AppointmentType;

  @Column({
    type: 'simple-enum',
    enum: AppointmentStatus,
    default: AppointmentStatus.PENDING,
  })
  status: AppointmentStatus;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({
    type: 'simple-enum',
    enum: SatisfactionRating,
    nullable: true,
  })
  satisfactionRating: SatisfactionRating;

  @Column({ type: 'text', nullable: true })
  satisfactionNotes: string;

  @Column({ nullable: true })
  professionalId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
