import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Patient } from '../patients/entities/patient.entity';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { Conversation } from './entities/conversation.entity';
import { ChatMessage } from './entities/message.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Conversation, ChatMessage, Patient])],
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}
