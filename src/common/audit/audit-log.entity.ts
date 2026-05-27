import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('audit_logs')
@Index(['userId', 'createdAt']) // query: "o que esse user fez?"
@Index(['action', 'createdAt']) // query: "quem fez PATIENT_DELETED?"
@Index(['resourceId']) // query: "quem tocou nesse recurso?"
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Quem fez
  @Column({ nullable: true })
  userId: string;

  @Column({ nullable: true })
  userEmail: string; // desnormalizado — sem JOIN na query de auditoria

  // O que fez
  @Column()
  action: string; // ex: PATIENTS_VIEWED, APPOINTMENTS_CREATED

  @Column({ length: 10 })
  method: string; // GET | POST | PATCH | DELETE

  @Column()
  path: string;

  @Column({ type: 'int' })
  statusCode: number;

  // Em qual recurso
  @Column({ nullable: true })
  resourceId: string; // req.params.id quando existir

  // Contexto técnico
  @Column({ nullable: true })
  ipAddress: string;

  @Column({ type: 'int' })
  durationMs: number;

  // Dados extras sem PII
  @Column({ type: 'simple-json', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;
}
