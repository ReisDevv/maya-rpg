import { IsString, MinLength, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

export class LoginDto {
  /**
   * Identificador único do usuário (E-mail ou CPF)
   */
  @IsString({ message: 'Identificador (E-mail ou CPF) é obrigatório' })
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  identifier?: string;

  /**
   * Alias para compatibilidade com versões antigas do frontend
   */
  @IsOptional()
  @IsString()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  email?: string;

  @IsString()
  @MinLength(6, { message: 'Senha deve ter no mínimo 6 caracteres' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  password: string;
}
