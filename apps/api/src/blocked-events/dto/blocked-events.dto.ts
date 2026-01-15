import {
  IsEnum,
  IsOptional,
  IsString,
  IsDateString,
  IsNumber,
} from 'class-validator';

export class CreateBlockDto {
  @IsEnum(['ip', 'api_key', 'user', 'global'])
  block_type: 'ip' | 'api_key' | 'user' | 'global';

  @IsString()
  identifier: string;

  @IsString()
  reason: string;

  @IsOptional()
  @IsDateString()
  expires_at?: string;

  @IsOptional()
  api_id?: number;
}

export class UnblockDto {
  @IsEnum(['ip', 'api_key', 'user', 'global'])
  block_type: 'ip' | 'api_key' | 'user' | 'global';

  @IsString()
  identifier: string;
}

export class UnblockByIdDto {
  @IsNumber()
  id: number;
}
