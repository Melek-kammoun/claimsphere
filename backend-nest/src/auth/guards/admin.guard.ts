import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';

type JwtPayload = {
  role?: string;
  app_metadata?: { role?: string };
  user_metadata?: { role?: string };
};

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();

    const role =
      request.user?.role ||
      request.headers['x-user-role'] ||
      this.getRoleFromAuthorization(request.headers['authorization']);

    if (role !== 'admin') {
      throw new ForbiddenException('Accès réservé aux administrateurs');
    }

    return true;
  }

  private getRoleFromAuthorization(authorization?: string): string | undefined {
    if (typeof authorization !== 'string' || !authorization.startsWith('Bearer ')) {
      return undefined;
    }

    const token = authorization.slice('Bearer '.length).trim();
    const parts = token.split('.');

    if (parts.length < 2) {
      return undefined;
    }

    try {
      const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8')) as JwtPayload;
      return payload.role || payload.user_metadata?.role || payload.app_metadata?.role;
    } catch {
      return undefined;
    }
  }
}