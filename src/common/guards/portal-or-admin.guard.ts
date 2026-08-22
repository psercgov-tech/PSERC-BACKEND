import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CanActivate } from '@nestjs/common';

@Injectable()
export class PortalOrAdminGuard implements CanActivate {
  private readonly adminGuard = new (AuthGuard('jwt'))();
  private readonly portalGuard = new (AuthGuard('portal-jwt'))();

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const adminOk = await Promise.resolve(
        this.adminGuard.canActivate(context),
      );
      if (adminOk) return true;
    } catch {
      /* not an admin session — try portal */
    }

    try {
      const portalOk = await Promise.resolve(
        this.portalGuard.canActivate(context),
      );
      if (portalOk) return true;
    } catch {
      /* neither session is valid */
    }

    throw new UnauthorizedException('Please sign in again.');
  }
}
