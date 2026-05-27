import {
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
  MinLength,
} from 'class-validator';
import { ExerciseCategory } from '../../common/enums/exercise-category.enum';

export class CreateExerciseDto {
  @IsString()
  @MinLength(3, { message: 'Título deve ter no mínimo 3 caracteres' })
  title: string;

  @IsString()
  description: string;

  @IsEnum(ExerciseCategory)
  category: ExerciseCategory;

  @IsArray()
  @IsOptional()
  tags?: string[];

  @IsString()
  @IsOptional()
  videoUrl?: string;

  @IsArray()
  @IsOptional()
  imageUrls?: string[];

  @IsString()
  instructions: string;
}
