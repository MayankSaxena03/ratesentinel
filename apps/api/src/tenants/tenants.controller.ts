import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { TenantsService } from './tenants.service';
import {
  CreateTenantDto,
  UpdateTenantDto,
  UpdateTenantStatusDto,
  UpdateTenantKillSwitchDto,
  CreateTenantBootstrapDto,
} from './dto/tenant.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Public } from 'src/auth/decorators/public.decorator';

@Controller('tenants')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class TenantController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Post()
  create(@Body() dto: CreateTenantDto) {
    return this.tenantsService.create(dto);
  }

  @Get()
  findAll() {
    return this.tenantsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.tenantsService.getByIdOrFail(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateTenantDto) {
    return this.tenantsService.update(id, dto);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTenantStatusDto,
  ) {
    return this.tenantsService.updateStatus(id, dto.status);
  }

  @Patch(':id/kill-switch')
  toggleKillSwitch(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTenantKillSwitchDto,
  ) {
    return this.tenantsService.updateKillSwitch(id, dto.killSwitch);
  }

  @Post('/bootstrap')
  @Public()
  createTenantWithAdmin(@Body() dto: CreateTenantBootstrapDto) {
    return this.tenantsService.createTenantWithAdmin({
      tenant: {
        name: dto.tenantName,
      },
      adminEmail: dto.adminEmail,
      adminPassword: dto.adminPassword,
    });
  }
}
