import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApiKey } from './api-key.entity';
import { Api } from '../apis/api.entity';
import { ApiKeyService } from './api-key.service';
import { ApiKeyController } from './api-key.controller';
import { TenantsModule } from 'src/tenants/tenants.module';
import { ApiKeyGuard } from './guards/api-key.guard';

@Module({
  imports: [TypeOrmModule.forFeature([ApiKey, Api]), TenantsModule],
  providers: [ApiKeyService, ApiKeyGuard],
  controllers: [ApiKeyController],
  exports: [ApiKeyService, ApiKeyGuard],
})
export class ApiKeyModule {}
