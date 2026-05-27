import {
  IsString,
  IsOptional,
  IsArray,
  IsDateString,
  IsBoolean,
  IsUUID,
  ValidateNested,
  IsNumber,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class PrescriptionExerciseDto {
  @IsUUID()
  exerciseId: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  sets?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  repetitions?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  holdTimeSeconds?: number;

  @IsString()
  frequency: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsNumber()
  @Min(0)
  order: number;
}

export class CreatePrescriptionDto {
  @IsUUID()
  patientId: string;

  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PrescriptionExerciseDto)
  exercises: PrescriptionExerciseDto[];

  @IsDateString()
  startDate: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
