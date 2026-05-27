import {
  IsString,
  IsOptional,
  IsDateString,
  IsNumber,
  IsUUID,
  Min,
  Max,
} from 'class-validator';

export class CreateMedicalRecordDto {
  @IsUUID()
  patientId: string;

  @IsDateString()
  date: string;

  @IsString()
  @IsOptional()
  chiefComplaint?: string;

  @IsString()
  clinicalNotes: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(10)
  painLevel?: number;

  @IsString()
  @IsOptional()
  mobilityNotes?: string;

  @IsString()
  @IsOptional()
  postureAssessment?: string;

  @IsString()
  @IsOptional()
  treatmentPlan?: string;
}
