import {
  Controller,
  Post,
  Delete,
  Param,
  Get,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiKeyService } from './api-key.service';
import { CurrentTenant } from '../auth/decorators/current-tenant.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { TenantGuard } from 'src/tenants/guards/tenant.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';

@Controller('apis/:apiId/keys')
@UseGuards(JwtAuthGuard, RolesGuard, TenantGuard)
export class ApiKeyController {
  constructor(private readonly apiKeyService: ApiKeyService) {}

  @Post()
  @Roles('admin')
  generate(
    @CurrentTenant() tenantId: number,
    @Param('apiId', ParseIntPipe) apiId: number,
  ) {
    return this.apiKeyService.generateKey(tenantId, apiId);
  }

  @Get()
  @Roles('admin')
  list(
    @CurrentTenant() tenantId: number,
    @Param('apiId', ParseIntPipe) apiId: number,
  ) {
    return this.apiKeyService.listKeys(tenantId, apiId);
  }

  @Delete(':keyId')
  @Roles('admin')
  revoke(
    @CurrentTenant() tenantId: number,
    @Param('apiId', ParseIntPipe) apiId: number,
    @Param('keyId', ParseIntPipe) keyId: number,
  ) {
    return this.apiKeyService.revokeKey(tenantId, apiId, keyId);
  }

  @Post('rotate-all')
  @Roles('admin')
  rotateAll(
    @CurrentTenant() tenantId: number,
    @Param('apiId', ParseIntPipe) apiId: number,
  ) {
    return this.apiKeyService.rotateAll(tenantId, apiId);
  }

  @Post(':keyId/rotate')
  @Roles('admin')
  rotate(
    @CurrentTenant() tenantId: number,
    @Param('apiId', ParseIntPipe) apiId: number,
    @Param('keyId', ParseIntPipe) keyId: number,
  ) {
    return this.apiKeyService.rotate(tenantId, apiId, keyId);
  }
}
