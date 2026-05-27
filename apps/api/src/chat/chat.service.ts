import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../auth/entities/user.entity';
import { UserRole } from '../common/enums/user-role.enum';
import { Patient } from '../patients/entities/patient.entity';
import { Conversation, ConversationKind } from './entities/conversation.entity';
import { ChatMessage } from './entities/message.entity';
import { CreateMessageDto } from './dto/create-message.dto';
import { clampPagination } from '../common/pagination.util';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Conversation)
    private readonly conversationRepo: Repository<Conversation>,
    @InjectRepository(ChatMessage)
    private readonly messageRepo: Repository<ChatMessage>,
    @InjectRepository(Patient)
    private readonly patientRepo: Repository<Patient>,
  ) {}

  async findConversations(user: User, page = 1, pageSize = 20) {
    const clamped = clampPagination(page, pageSize);
    if (user.role === UserRole.PATIENT) {
      const patient = await this.getPatientForUser(user);
      await this.ensureDefaultConversations(patient.id, user.id);
      const [data, total] = await this.conversationRepo.findAndCount({
        where: { patientId: patient.id, isActive: true },
        order: { updatedAt: 'DESC' },
        skip: (clamped.page - 1) * clamped.pageSize,
        take: clamped.pageSize,
      });

      return {
        data,
        total,
        page: clamped.page,
        pageSize: clamped.pageSize,
        totalPages: Math.ceil(total / clamped.pageSize),
      };
    }

    const [data, total] = await this.conversationRepo.findAndCount({
      where: { isActive: true },
      relations: ['patient'],
      order: { updatedAt: 'DESC' },
      skip: (clamped.page - 1) * clamped.pageSize,
      take: clamped.pageSize,
    });

    return {
      data,
      total,
      page: clamped.page,
      pageSize: clamped.pageSize,
      totalPages: Math.ceil(total / clamped.pageSize),
    };
  }

  async findMessages(
    conversationId: string,
    user: User,
    page = 1,
    pageSize = 50,
  ) {
    await this.findConversationSecure(conversationId, user);
    const clamped = clampPagination(page, pageSize);
    const [data, total] = await this.messageRepo.findAndCount({
      where: { conversationId },
      order: { createdAt: 'ASC' },
      skip: (clamped.page - 1) * clamped.pageSize,
      take: clamped.pageSize,
    });

    return {
      data,
      total,
      page: clamped.page,
      pageSize: clamped.pageSize,
      totalPages: Math.ceil(total / clamped.pageSize),
    };
  }

  async createMessage(
    conversationId: string,
    user: User,
    dto: CreateMessageDto,
  ) {
    const conversation = await this.findConversationSecure(
      conversationId,
      user,
    );
    const saved = await this.messageRepo.save(
      this.messageRepo.create({
        conversationId: conversation.id,
        senderUserId: user.id,
        senderRole: user.role,
        body: dto.body.trim(),
      }),
    );

    conversation.updatedAt = new Date();
    await this.conversationRepo.save(conversation);

    return saved;
  }

  private async findConversationSecure(conversationId: string, user: User) {
    const conversation = await this.conversationRepo.findOne({
      where: { id: conversationId },
      relations: ['patient'],
    });

    if (!conversation) throw new NotFoundException('Conversa não encontrada');

    if (user.role === UserRole.PATIENT) {
      const patient = await this.getPatientForUser(user);
      if (conversation.patientId !== patient.id) {
        throw new ForbiddenException(
          'Sem permissão para acessar esta conversa',
        );
      }
    }

    return conversation;
  }

  private async getPatientForUser(user: User) {
    const patient = await this.patientRepo.findOneBy({ userId: user.id });
    if (!patient)
      throw new NotFoundException('Paciente não encontrado para este usuário');
    return patient;
  }

  private async ensureDefaultConversations(patientId: string, userId: string) {
    const existing = await this.conversationRepo.find({
      where: { patientId },
      select: ['kind'],
    });
    const existingKinds = new Set(existing.map((item) => item.kind));

    const defaults = [
      {
        kind: ConversationKind.BOT,
        title: 'Chat Bot Dra Maya',
        body: 'Olá! Me conte como foi o exercício de hoje.',
      },
      {
        kind: ConversationKind.RECEPTION,
        title: 'Recepção',
        body: 'Sua sessão de RPG aparecerá aqui quando for confirmada.',
      },
    ];

    for (const item of defaults) {
      if (existingKinds.has(item.kind)) continue;

      const conversation = await this.conversationRepo.save(
        this.conversationRepo.create({
          patientId,
          title: item.title,
          kind: item.kind,
        }),
      );

      await this.messageRepo.save(
        this.messageRepo.create({
          conversationId: conversation.id,
          senderUserId: userId,
          senderRole: UserRole.PROFESSIONAL,
          body: item.body,
        }),
      );
    }
  }
}
