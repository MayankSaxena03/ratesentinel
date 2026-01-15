import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class KillSwitchGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();

    const tenant = (req as any).tenant;
    const api = (req as any).api;

    if (tenant?.kill_switch === true) {
      throw new ForbiddenException(
        'Tenant is temporarily disabled by administrator',
      );
    }

    if (api && api.is_active === false) {
      throw new ForbiddenException(
        'API is currently disabled by administrator',
      );
    }

    return true;
  }
}
