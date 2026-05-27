import { IsEmail, IsString, MinLength } from 'class-validator';

export class VerifyCurrentEmailCodeDto {
  @IsString()
  requestId: string;

  @IsString()
  @MinLength(6)
  code: string;
}

export class RequestNewEmailCodeDto {
  @IsString()
  requestId: string;

  @IsEmail()
  newEmail: string;

  @IsEmail()
  confirmEmail: string;
}

export class ConfirmNewEmailCodeDto {
  @IsString()
  requestId: string;

  @IsString()
  @MinLength(6)
  code: string;
}
