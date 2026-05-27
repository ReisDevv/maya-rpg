import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ExerciseCategory } from '../../common/enums/exercise-category.enum';

@Entity('exercises')
export class Exercise {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({
    type: 'simple-enum',
    enum: ExerciseCategory,
    default: ExerciseCategory.POSTURE,
  })
  category: ExerciseCategory;

  @Column('simple-array', { nullable: true })
  tags: string[];

  @Column({ nullable: true })
  videoUrl: string;

  @Column('simple-array', { nullable: true })
  imageUrls: string[];

  @Column({ type: 'text' })
  instructions: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
