import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../modules/auth/token.util';
import { getPermissionsForRole } from '../modules/auth/permission.repository';
import { AppError } from './errorHandler';

/** Verifies the JWT access token and attaches { id, role } to req.user. */
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    next(new AppError('Authentication required.', 401));
    return;
  }
  try {
    const token = header.slice('Bearer '.length);
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub, role: payload.role };
    next();
  } catch {
    next(new AppError('Invalid or expired session.', 401));
  }
}

/** Restricts a route to one or more specific roles. Use requirePermission() instead where possible — it's more granular and survives role changes without a code edit. */
export function requireRole(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      next(new AppError('You do not have permission to perform this action.', 403));
      return;
    }
    next();
  };
}

/** Restricts a route to roles holding a specific permission key — reads role_permissions, never a hardcoded role list. */
export function requirePermission(permissionKey: string) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      next(new AppError('Authentication required.', 401));
      return;
    }
    try {
      const permissions = await getPermissionsForRole(req.user.role);
      if (!permissions.includes(permissionKey)) {
        next(new AppError('You do not have permission to perform this action.', 403));
        return;
      }
      req.user.permissions = permissions;
      next();
    } catch (err) {
      next(err);
    }
  };
}
