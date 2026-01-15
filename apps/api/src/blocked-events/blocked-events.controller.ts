import {
  Controller,
  Post,
  Delete,
  Get,
  Body,
  Req,
  UseGuards,
} from '@nestjs/common';
import { BlockedEventsService } from './blocked-events.service';
import {
  CreateBlockDto,
  UnblockByIdDto,
  UnblockDto,
} from './dto/blocked-events.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { TenantGuard } from 'src/tenants/guards/tenant.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';

@Controller('blocked-events')
@UseGuards(JwtAuthGuard, RolesGuard, TenantGuard)
export class BlockedEventsController {
  constructor(private readonly service: BlockedEventsService) {}

  @Post()
  @Roles('admin')
  create(@Req() req, @Body() dto: CreateBlockDto) {
    return this.service.create(req.user.tenantId, dto);
  }

  @Get()
  @Roles('admin')
  list(@Req() req) {
    return this.service.listActive(req.user.tenantId);
  }

  @Delete('by-id')
  @Roles('admin')
  unblockById(@Req() req, @Body() dto: UnblockByIdDto) {
    return this.service.unblockById(req.user.tenantId, dto.id);
  }

  @Post('unblock')
  @Roles('admin')
  unblockByEntity(@Req() req, @Body() dto: UnblockDto) {
    return this.service.unblockByEntity(
      req.user.tenantId,
      dto.block_type,
      dto.identifier,
    );
  }
}
