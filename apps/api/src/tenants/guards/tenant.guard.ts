import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { TenantsService } from '../tenants.service';
import { AuthUser } from '../../common/interfaces/auth-user.interface';

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private readonly tenantsService: TenantsService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const request = ctx.switchToHttp().getRequest();
    const user: AuthUser = request.user;

    if (!user || !user.tenantId) {
      throw new ForbiddenException('Tenant context missing');
    }

    const tenant = await this.tenantsService.findById(user.tenantId);

    if (!tenant) {
      throw new ForbiddenException('Tenant not found');
    }

    if (tenant.status !== 'active') {
      throw new ForbiddenException('Tenant is suspended');
    }

    if (tenant.killSwitch) {
      throw new ForbiddenException('Tenant is disabled');
    }

    request.tenant = tenant;

    return true;
  }
}
