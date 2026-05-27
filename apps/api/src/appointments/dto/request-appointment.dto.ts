import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { AppointmentType } from '../entities/appointment.entity';

export class RequestAppointmentDto {
  @IsDateString()
  dateTime: string;

  @IsInt()
  @Min(15)
  @Max(240)
  @IsOptional()
  durationMinutes?: number;

  @IsEnum(AppointmentType)
  @IsOptional()
  type?: AppointmentType;

  @IsString()
  @IsOptional()
  notes?: string;
}
