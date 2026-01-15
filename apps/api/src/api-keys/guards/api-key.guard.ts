import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { ApiKeyService } from '../api-key.service';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly apiKeyService: ApiKeyService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();

    const header = req.headers['x-api-key'] ?? req.headers['authorization'];

    if (!header || typeof header !== 'string') {
      throw new UnauthorizedException('API key missing');
    }

    const plaintextKey = header.startsWith('Bearer ')
      ? header.slice(7)
      : header;

    const apiKey = await this.apiKeyService.findByPlaintextKey(plaintextKey);

    if (!apiKey) {
      throw new UnauthorizedException('Invalid API key');
    }

    if (!apiKey.api.isActive) {
      throw new ForbiddenException('API is disabled');
    }

    req.apiKey = apiKey;
    req.api = apiKey.api;
    req.tenantId = apiKey.api.tenantId;

    req.user = undefined;

    return true;
  }
}
