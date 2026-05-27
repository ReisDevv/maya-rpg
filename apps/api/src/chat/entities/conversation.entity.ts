import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Patient } from '../../patients/entities/patient.entity';
import { ChatMessage } from './message.entity';

export enum ConversationKind {
  BOT = 'BOT',
  RECEPTION = 'RECEPTION',
  SUPPORT = 'SUPPORT',
}

@Entity('chat_conversations')
export class Conversation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  patientId: string;

  @ManyToOne(() => Patient, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'patientId' })
  patient: Patient;

  @Column()
  title: string;

  @Column({
    type: 'simple-enum',
    enum: ConversationKind,
    default: ConversationKind.BOT,
  })
  kind: ConversationKind;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => ChatMessage, (message) => message.conversation)
  messages: ChatMessage[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
