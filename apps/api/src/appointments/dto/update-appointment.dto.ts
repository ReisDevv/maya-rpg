import { PartialType } from '@nestjs/mapped-types';
import { CreateAppointmentDto } from './create-appointment.dto';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { SatisfactionRating } from '../entities/appointment.entity';

export class UpdateAppointmentDto extends PartialType(CreateAppointmentDto) {
  @IsEnum(SatisfactionRating)
  @IsOptional()
  satisfactionRating?: SatisfactionRating;

  @IsString()
  @IsOptional()
  satisfactionNotes?: string;
}
