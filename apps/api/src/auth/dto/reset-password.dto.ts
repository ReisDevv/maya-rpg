import { IsEmail, IsString, IsUUID, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @IsString()
  token: string;

  @IsString()
  @MinLength(6, { message: 'Senha deve ter no mínimo 6 caracteres' })
  newPassword: string;
}

export class RequestPasswordResetCodeDto {
  @IsEmail({}, { message: 'E-mail inválido' })
  email: string;
}

export class ConfirmPasswordResetCodeDto {
  @IsUUID()
  requestId: string;

  @IsString()
  code: string;

  @IsString()
  @MinLength(6, { message: 'Senha deve ter no mínimo 6 caracteres' })
  newPassword: string;
}
