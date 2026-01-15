import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsBoolean,
} from 'class-validator';
import { ApiEnvironment } from '../api.entity';

export class CreateApiDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(ApiEnvironment)
  environment: ApiEnvironment;

  @IsString()
  @IsNotEmpty()
  baseUrl: string;
}

export class UpdateApiDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(ApiEnvironment)
  environment?: ApiEnvironment;
}

export class UpdateApiStatusDto {
  @IsBoolean()
  isActive: boolean;
}
