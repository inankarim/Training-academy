import bcrypt from 'bcryptjs';
import { env } from '../../config/env';

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, env.jwt.bcryptSaltRounds);
}

export async function comparePassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/**
 * Enforced both here (defense in depth, in case a caller skips validation)
 * and via express-validator on the route itself.
 */
export function isPasswordStrongEnough(password: string): boolean {
  return (
    password.length >= 10 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password)
  );
}
