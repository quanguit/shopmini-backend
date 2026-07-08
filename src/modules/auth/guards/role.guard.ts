import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from 'src/modules/user/enums/user-role.enum';
import { ROLES_KEY } from '../decorators/role.decorator';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

export type RequestWithUser = Request & { user: JwtPayload };

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles) return true;

    const { user } = context.switchToHttp().getRequest<RequestWithUser>();

    if (!user) return false;

    return requiredRoles.includes(user.role);
  }
}
