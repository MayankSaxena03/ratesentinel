import { IsEmail, IsEnum, IsNotEmpty, MinLength } from 'class-validator';
import type { UserRole } from '../../common/types/role.type';

export class SignupDto {
  @IsEmail()
  email: string;

  @MinLength(8)
  password: string;

  @IsEnum(['admin', 'developer', 'viewer'])
  role: UserRole;
}
