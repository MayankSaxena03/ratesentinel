import { IsEmail, IsEnum, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsNotEmpty()
  password: string;

  @IsEnum(['admin', 'developer', 'viewer'])
  role: 'admin' | 'developer' | 'viewer';
}

export class UpdateUserDto {
  @IsOptional()
  @IsEnum(['admin', 'developer', 'viewer'])
  role?: 'admin' | 'developer' | 'viewer';

  @IsOptional()
  @IsEnum(['active', 'disabled'])
  status?: 'active' | 'disabled';
}

export class UpdateUserRoleDto {
  @IsEnum(['admin', 'developer', 'viewer'])
  role: 'admin' | 'developer' | 'viewer';
}

export class UpdateUserStatusDto {
  @IsEnum(['active', 'disabled'])
  status: 'active' | 'disabled';
}
