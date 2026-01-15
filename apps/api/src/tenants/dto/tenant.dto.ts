import { IsOptional, IsEnum, IsBoolean, IsNotEmpty } from 'class-validator';

export class CreateTenantDto {
  @IsNotEmpty()
  name: string;
}

export class UpdateTenantDto {
  @IsOptional()
  @IsEnum(['active', 'suspended'])
  status?: 'active' | 'suspended';

  @IsOptional()
  @IsBoolean()
  killSwitch?: boolean;
}

export class UpdateTenantStatusDto {
  @IsEnum(['active', 'suspended'])
  status: 'active' | 'suspended';
}

export class UpdateTenantKillSwitchDto {
  @IsBoolean()
  killSwitch: boolean;
}

export class CreateTenantBootstrapDto {
  tenantName: string;
  adminEmail: string;
  adminPassword: string;
}
