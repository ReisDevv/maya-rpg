import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Patient } from '../../patients/entities/patient.entity';

@Entity('medical_records')
export class MedicalRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  patientId: string;

  @ManyToOne(() => Patient, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'patientId' })
  patient: Patient;

  @Column({ nullable: true })
  professionalId: string;

  @Column({ type: 'date' })
  date: Date;

  @Column({ type: 'text', nullable: true })
  chiefComplaint: string;

  @Column({ type: 'text' })
  clinicalNotes: string;

  @Column({ type: 'int', nullable: true })
  painLevel: number;

  @Column({ type: 'text', nullable: true })
  mobilityNotes: string;

  @Column({ type: 'text', nullable: true })
  postureAssessment: string;

  @Column({ type: 'text', nullable: true })
  treatmentPlan: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
