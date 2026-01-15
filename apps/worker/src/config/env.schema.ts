import { plainToInstance } from 'class-transformer';
import { IsEnum, IsInt, IsString, validateSync } from 'class-validator';

enum NodeEnv {
  development = 'development',
  test = 'test',
  production = 'production',
}

class EnvSchema {
  @IsEnum(NodeEnv)
  NODE_ENV!: NodeEnv;

  @IsString()
  REDIS_HOST!: string;

  @IsInt()
  REDIS_PORT!: number;
}

export function validateEnv(config: Record<string, unknown>) {
  const validated = plainToInstance(EnvSchema, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validated, {
    skipMissingProperties: false,
  });

  if (errors.length) {
    throw new Error(
      `Worker env validation failed:\n${errors
        .map((e) => Object.values(e.constraints ?? {}).join(', '))
        .join('\n')}`,
    );
  }

  return validated;
}
