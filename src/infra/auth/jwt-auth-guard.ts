import { ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from './public';
import { ADMINISTRATOR_ACCESS_KEY } from './admin.decorator';
import { UserPayload } from './jwt.strategy';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  async canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const canActivate = await super.canActivate(context);
    if (!canActivate) {
      return false;
    }

    const requiresAdmin = this.reflector.getAllAndOverride<boolean>(ADMINISTRATOR_ACCESS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (requiresAdmin) {
      const user = context.switchToHttp().getRequest<{ user: UserPayload }>().user;

      if (user.role !== 'ADMIN') {
        throw new ForbiddenException();
      }
    }

    return true;
  }
}
