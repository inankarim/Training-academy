import { AppError } from '../../middleware/errorHandler';
import { writeAuditLog } from '../../utils/auditLog';
import { env } from '../../config/env';
import * as authRepo from './auth.repository';
import { getPermissionsForRole } from './permission.repository';
import { comparePassword, hashPassword, isPasswordStrongEnough } from './password.util';
import {
  generateAccessToken,
  generateRefreshTokenValue,
  hashRefreshToken,
  parseDurationMs,
} from './token.util';
import { recordFailedLogin, isLoginLocked, clearFailedLogins } from './loginAttempts.util';
import { AuthenticatedUserDTO, ClientContext } from './auth.types';

function toDTO(user: authRepo.UserRecord): AuthenticatedUserDTO {
  return {
    id: user.id,
    fullName: user.full_name,
    email: user.email,
    role: user.role_name,
    designation: user.designation,
    mustChangePassword: user.must_change_password,
  };
}

interface AuthResult {
  accessToken: string;
  refreshTokenValue: string;
  refreshTokenExpiresAt: Date;
  user: AuthenticatedUserDTO;
  permissions: string[];
  isFirstLogin: boolean;
}

async function issueSession(
  user: authRepo.UserRecord,
  ctx: ClientContext,
): Promise<Omit<AuthResult, 'user' | 'permissions' | 'isFirstLogin'>> {
  const accessToken = generateAccessToken(user.id, user.role_name);
  const refreshTokenValue = generateRefreshTokenValue();
  const refreshTokenExpiresAt = new Date(Date.now() + parseDurationMs(env.jwt.refreshExpiresIn));

  await authRepo.insertRefreshToken({
    userId: user.id,
    tokenHash: hashRefreshToken(refreshTokenValue),
    expiresAt: refreshTokenExpiresAt,
    ip: ctx.ip,
    userAgent: ctx.userAgent,
  });

  return { accessToken, refreshTokenValue, refreshTokenExpiresAt };
}

export async function login(email: string, password: string, ctx: ClientContext): Promise<AuthResult> {
  if (await isLoginLocked(email)) {
    await writeAuditLog({
      action: 'auth.login_blocked_locked',
      metadata: { email },
      ipAddress: ctx.ip,
      userAgent: ctx.userAgent,
    });
    throw new AppError('Too many failed attempts. Please try again in 15 minutes.', 429);
  }

  const user = await authRepo.findUserByEmail(email);
  const passwordOk = user ? await comparePassword(password, user.password_hash) : false;

  if (!user || !passwordOk) {
    const { locked } = await recordFailedLogin(email);
    // Same generic message either way — never reveal whether the email
    // exists or the password was the part that was wrong.
    await writeAuditLog({
      action: 'auth.login_failed',
      metadata: { email, reason: !user ? 'no_such_user' : 'bad_password', locked },
      ipAddress: ctx.ip,
      userAgent: ctx.userAgent,
    });
    throw new AppError('Invalid email or password.', 401);
  }

  if (user.status === 'deactivated') {
    await writeAuditLog({
      actorUserId: user.id,
      action: 'auth.login_blocked_deactivated',
      ipAddress: ctx.ip,
      userAgent: ctx.userAgent,
    });
    throw new AppError('This account has been deactivated. Contact your administrator.', 403);
  }

  const isFirstLogin = user.last_login_at === null;

  await clearFailedLogins(email);
  await authRepo.updateLastLogin(user.id);

  const session = await issueSession(user, ctx);
  const permissions = await getPermissionsForRole(user.role_name);

  await writeAuditLog({
    actorUserId: user.id,
    action: 'auth.login',
    ipAddress: ctx.ip,
    userAgent: ctx.userAgent,
  });

  return { ...session, user: toDTO(user), permissions, isFirstLogin };
}

export async function refresh(refreshTokenValue: string, ctx: ClientContext): Promise<AuthResult> {
  const record = await authRepo.findValidRefreshToken(hashRefreshToken(refreshTokenValue));
  if (!record) {
    throw new AppError('Session expired. Please log in again.', 401);
  }

  const user = await authRepo.findUserById(record.user_id);
  if (!user || user.status === 'deactivated') {
    await authRepo.revokeRefreshTokenById(record.id, 'user_inactive');
    throw new AppError('This account is no longer active.', 403);
  }

  // Rotate on every use: the presented token is immediately revoked and a
  // fresh one issued. If a revoked token is ever presented again, that's a
  // strong signal of token theft (Phase 17 hardening can alert on this).
  await authRepo.revokeRefreshTokenById(record.id, 'refresh_rotation');

  const session = await issueSession(user, ctx);
  const permissions = await getPermissionsForRole(user.role_name);

  return { ...session, user: toDTO(user), permissions, isFirstLogin: false };
}

export async function logout(refreshTokenValue: string | undefined, ctx: ClientContext): Promise<void> {
  if (!refreshTokenValue) return;
  const record = await authRepo.findValidRefreshToken(hashRefreshToken(refreshTokenValue));
  if (record) {
    await authRepo.revokeRefreshTokenById(record.id, 'logout');
    await writeAuditLog({
      actorUserId: record.user_id,
      action: 'auth.logout',
      ipAddress: ctx.ip,
      userAgent: ctx.userAgent,
    });
  }
}

export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
  ctx: ClientContext,
): Promise<void> {
  const user = await authRepo.findUserById(userId);
  if (!user) throw new AppError('User not found.', 404);

  const currentOk = await comparePassword(currentPassword, user.password_hash);
  if (!currentOk) {
    await writeAuditLog({
      actorUserId: userId,
      action: 'auth.password_change_failed',
      metadata: { reason: 'bad_current_password' },
      ipAddress: ctx.ip,
      userAgent: ctx.userAgent,
    });
    throw new AppError('Current password is incorrect.', 401);
  }

  if (!isPasswordStrongEnough(newPassword)) {
    throw new AppError(
      'New password must be at least 10 characters and include an uppercase letter, a lowercase letter, and a number.',
      400,
    );
  }

  const newHash = await hashPassword(newPassword);
  await authRepo.updatePasswordHash(userId, newHash, false);

  // A password change invalidates every other active session — if the
  // change was prompted by a compromised password, this cuts off anyone
  // still using the old one.
  await authRepo.revokeAllUserRefreshTokens(userId, 'password_change');

  await writeAuditLog({
    actorUserId: userId,
    action: 'auth.password_change',
    ipAddress: ctx.ip,
    userAgent: ctx.userAgent,
  });
}

export async function getAuthenticatedUser(
  userId: string,
): Promise<{ user: AuthenticatedUserDTO; permissions: string[] } | null> {
  const user = await authRepo.findUserById(userId);
  if (!user) return null;
  const permissions = await getPermissionsForRole(user.role_name);
  return { user: toDTO(user), permissions };
}
