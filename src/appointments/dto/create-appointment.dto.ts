import {
  IsUUID,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import {
  AppointmentType,
  AppointmentStatus,
} from '../entities/appointment.entity';

export class CreateAppointmentDto {
  @IsUUID()
  @IsOptional()
  patientId: string;

  @IsDateString()
  dateTime: string;

  @IsInt()
  @Min(15)
  @Max(240)
  @IsOptional()
  durationMinutes?: number;

  @IsInt()
  @Min(0)
  @Max(60)
  @IsOptional()
  bufferMinutes?: number;

  @IsEnum(AppointmentType)
  @IsOptional()
  type?: AppointmentType;

  @IsEnum(AppointmentStatus)
  @IsOptional()
  status?: AppointmentStatus;

  @IsString()
  @IsOptional()
  notes?: string;
}
