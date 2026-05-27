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
import { Prescription } from '../../prescriptions/entities/prescription.entity';

@Entity('check_ins')
export class CheckIn {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  patientId: string;

  @ManyToOne(() => Patient, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'patientId' })
  patient: Patient;

  @Column()
  @Index()
  prescriptionId: string;

  @ManyToOne(() => Prescription, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'prescriptionId' })
  prescription: Prescription;

  @Column({ type: 'uuid', nullable: true })
  @Index()
  exerciseId: string | null;

  @Column({ type: 'int', default: 0 })
  painLevel: number; // 0 to 10

  @Column({ type: 'int', nullable: true })
  feelingLevel: number | null; // 1 to 5 (bem-estar geral)

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ default: true })
  isCompleted: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  executedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
