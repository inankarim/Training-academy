import { Request, Response, NextFunction, CookieOptions } from 'express';
import { env } from '../../config/env';
import * as authService from './auth.service';

const REFRESH_COOKIE_NAME = 'refreshToken';
// Scoped to /auth so the browser doesn't attach this cookie to every single
// API request — only the endpoints that actually need it.
const REFRESH_COOKIE_PATH = `/api/${env.apiVersion}/auth`;

function refreshCookieOptions(expiresAt: Date): CookieOptions {
  return {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: 'strict',
    expires: expiresAt,
    path: REFRESH_COOKIE_PATH,
  };
}

function clientContext(req: Request) {
  return { ip: req.ip, userAgent: req.headers['user-agent'] };
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password, clientContext(req));
    res.cookie(REFRESH_COOKIE_NAME, result.refreshTokenValue, refreshCookieOptions(result.refreshTokenExpiresAt));
    res.json({
      success: true,
      data: {
        accessToken: result.accessToken,
        user: result.user,
        permissions: result.permissions,
        isFirstLogin: result.isFirstLogin,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const token = req.cookies?.[REFRESH_COOKIE_NAME];
    if (!token) {
      res.status(401).json({ success: false, error: { message: 'No active session.' } });
      return;
    }
    const result = await authService.refresh(token, clientContext(req));
    res.cookie(REFRESH_COOKIE_NAME, result.refreshTokenValue, refreshCookieOptions(result.refreshTokenExpiresAt));
    res.json({
      success: true,
      data: { accessToken: result.accessToken, user: result.user, permissions: result.permissions },
    });
  } catch (err) {
    next(err);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const token = req.cookies?.[REFRESH_COOKIE_NAME];
    await authService.logout(token, clientContext(req));
    res.clearCookie(REFRESH_COOKIE_NAME, { path: REFRESH_COOKIE_PATH });
    res.json({ success: true, data: { message: 'Logged out.' } });
  } catch (err) {
    next(err);
  }
}

export async function changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id; // requireAuth guarantees this is set
    const { currentPassword, newPassword } = req.body;
    await authService.changePassword(userId, currentPassword, newPassword, clientContext(req));
    res.json({ success: true, data: { message: 'Password updated. You have been logged out of other sessions.' } });
  } catch (err) {
    next(err);
  }
}

export async function me(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await authService.getAuthenticatedUser(req.user!.id);
    if (!result) {
      res.status(404).json({ success: false, error: { message: 'User not found.' } });
      return;
    }
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}
