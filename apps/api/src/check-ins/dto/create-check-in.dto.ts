import {
  IsString,
  IsInt,
  Min,
  Max,
  IsOptional,
  IsBoolean,
  IsDateString,
} from 'class-validator';

export class CreateCheckInDto {
  @IsString()
  prescriptionId: string;

  @IsString()
  exerciseId: string;

  @IsInt()
  @Min(0)
  @Max(10)
  painLevel: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  feelingLevel?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsBoolean()
  isCompleted?: boolean;

  @IsDateString()
  executedAt: string;
}
