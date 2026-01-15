import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthUser } from '../../common/interfaces/auth-user.interface';

export const CurrentUser = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): AuthUser => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
