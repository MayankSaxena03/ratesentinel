import {
  Controller,
  Get,
  Query,
  Param,
  Req,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { RequestsLogService } from './requests-log.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { RequestDecision } from './requests-log.entity';

@Controller('audit/requests')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RequestsLogController {
  constructor(private readonly service: RequestsLogService) {}

  @Get()
  @Roles('admin', 'developer')
  async list(@Req() req, @Query() q) {
    return this.service.queryAuditLogs({
      tenantId: req.user.tenantId,
      apiId: q.apiId ? Number(q.apiId) : undefined,
      decision: q.decision as RequestDecision,
      ip: q.ip,
      from: q.from ? new Date(q.from) : undefined,
      to: q.to ? new Date(q.to) : undefined,
      limit: q.limit ? Number(q.limit) : undefined,
      cursor: q.cursor ? Number(q.cursor) : undefined,
    });
  }

  @Get(':id')
  @Roles('admin', 'developer')
  async getOne(@Req() req, @Param('id', ParseIntPipe) id: number) {
    return this.service.getById(req.user.tenantId, id);
  }
}
