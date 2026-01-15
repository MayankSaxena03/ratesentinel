import {
  Controller,
  Post,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
  All,
} from '@nestjs/common';
import type { Request } from 'express';

import { ApiKeyGuard } from '../api-keys/guards/api-key.guard';
import { RateLimitGuard } from '../rate-limit/rate-limit.guard';
import { BlockedEventsService } from '../blocked-events/blocked-events.service';
import { GatewayService } from './gateway.service';

@Controller('gateway')
export class GatewayController {
  constructor(
    private readonly blockedEvents: BlockedEventsService,
    private readonly gatewayService: GatewayService,
  ) {}

  @HttpCode(HttpStatus.OK)
  @UseGuards(ApiKeyGuard, RateLimitGuard)
  @All('*')
  async handle(@Req() req: Request) {
    const tenantId = req.api!.tenantId;
    const apiId = req.api!.id;
    const apiKeyId = req.apiKey!.id;

    const ip =
      req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim() ||
      req.ip ||
      '0.0.0.0';

    const blocked = await this.blockedEvents.isBlocked(tenantId, 'ip', ip);

    if (blocked) {
      return {
        decision: 'BLOCKED',
        reason: 'IP blocked',
      };
    }

    return this.gatewayService.allow({
      tenantId,
      apiId,
      apiKeyId,
      ip,
      method: req.method,
      path: req.originalUrl,
      body: req.body,
    });
  }
}
