import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiService } from './api.service';
import { CreateApiDto, UpdateApiDto, UpdateApiStatusDto } from './dto/api.dto';
import { CurrentTenant } from '../auth/decorators/current-tenant.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { TenantGuard } from 'src/tenants/guards/tenant.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';

@Controller('apis')
@UseGuards(JwtAuthGuard, RolesGuard, TenantGuard)
export class ApiController {
  constructor(private readonly apiService: ApiService) {}

  @Post()
  @Roles('admin')
  create(@CurrentTenant() tenantId: number, @Body() dto: CreateApiDto) {
    return this.apiService.create(tenantId, dto);
  }

  @Get()
  @Roles('admin')
  findAll(@CurrentTenant() tenantId: number) {
    return this.apiService.findAll(tenantId);
  }

  @Get(':id')
  @Roles('admin')
  findOne(
    @CurrentTenant() tenantId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.apiService.findOne(tenantId, id);
  }

  @Patch(':id')
  @Roles('admin')
  update(
    @CurrentTenant() tenantId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateApiDto,
  ) {
    return this.apiService.update(tenantId, id, dto);
  }

  @Patch(':id/disable')
  @Roles('admin')
  disable(
    @CurrentTenant() tenantId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateApiStatusDto,
  ) {
    return this.apiService.setApiActiveStatus(tenantId, id, dto.isActive);
  }

  @Delete(':id')
  @Roles('admin')
  async remove(
    @CurrentTenant() tenantId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    await this.apiService.remove(tenantId, id);
    return { success: true };
  }
}
