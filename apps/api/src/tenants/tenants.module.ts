import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tenant } from './tenant.entity';
import { TenantsService } from './tenants.service';
import { TenantController } from './tenants.controller';
import { User } from 'src/users/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Tenant, User])],
  providers: [TenantsService],
  exports: [TenantsService],
  controllers: [TenantController],
})
export class TenantsModule {}
