import { IsEmail, IsEnum, IsString, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { UserRole } from '../../common/enums/user-role.enum';

export class CreateStaffDto {
  @IsString()
  @MinLength(3, { message: 'Nome deve ter no mínimo 3 caracteres' })
  name: string;

  @IsEmail({}, { message: 'E-mail inválido' })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  email: string;

  @IsString()
  @MinLength(6, { message: 'Senha deve ter no mínimo 6 caracteres' })
  password: string;

  // Apenas profissional ou admin podem ser criados aqui (paciente usa /auth/register)
  @IsEnum([UserRole.PROFESSIONAL, UserRole.ADMIN] as unknown as object, {
    message: 'Role inválida (apenas PROFESSIONAL ou ADMIN)',
  })
  role: UserRole.PROFESSIONAL | UserRole.ADMIN;
}
