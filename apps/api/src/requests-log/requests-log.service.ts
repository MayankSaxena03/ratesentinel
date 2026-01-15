import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { RequestsLogEntity, RequestDecision } from './requests-log.entity';

@Injectable()
export class RequestsLogService {
  constructor(
    @InjectRepository(RequestsLogEntity)
    private readonly repo: Repository<RequestsLogEntity>,
  ) {}

  async queryAuditLogs(params: {
    tenantId: number;
    apiId?: number;
    decision?: RequestDecision;
    ip?: string;
    from?: Date;
    to?: Date;
    limit?: number;
    cursor?: number;
  }) {
    const {
      tenantId,
      apiId,
      decision,
      ip,
      from,
      to,
      limit = 50,
      cursor,
    } = params;

    const qb = this.repo
      .createQueryBuilder('log')
      .where('log.tenant_id = :tenantId', { tenantId })
      .orderBy('log.id', 'DESC')
      .limit(limit);

    if (cursor) {
      qb.andWhere('log.id < :cursor', { cursor });
    }

    if (apiId) {
      qb.andWhere('log.api_id = :apiId', { apiId });
    }

    if (decision) {
      qb.andWhere('log.decision = :decision', {
        decision,
      });
    }

    if (ip) {
      qb.andWhere('log.ip_address = :ip', { ip });
    }

    if (from) {
      qb.andWhere('log.created_at >= :from', { from });
    }

    if (to) {
      qb.andWhere('log.created_at <= :to', { to });
    }

    const rows = await qb.getMany();

    return {
      data: rows,
      nextCursor: rows.length > 0 ? rows[rows.length - 1].id : null,
    };
  }

  async getById(
    tenantId: number,
    id: number,
  ): Promise<RequestsLogEntity | null> {
    return this.repo.findOne({
      where: { id, tenant_id: tenantId },
    });
  }
}
