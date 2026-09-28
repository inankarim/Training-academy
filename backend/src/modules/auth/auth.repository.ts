import { getPool } from '../../database/postgres';

export interface UserRecord {
  id: string;
  full_name: string;
  email: string;
  password_hash: string;
  role_id: string;
  role_name: string;
  designation: string | null;
  status: 'active' | 'deactivated';
  must_change_password: boolean;
  last_login_at: Date | null;
  avatar_url: string | null;
}

const USER_SELECT = `
  SELECT u.id, u.full_name, u.email, u.password_hash, u.role_id, r.name AS role_name,
         u.designation, u.status, u.must_change_password, u.last_login_at, u.avatar_url
  FROM users u
  JOIN roles r ON r.id = u.role_id
`;

export async function findUserByEmail(email: string): Promise<UserRecord | null> {
  const { rows } = await getPool().query(`${USER_SELECT} WHERE LOWER(u.email) = LOWER($1)`, [email]);
  return rows[0] ?? null;
}

export async function findUserById(id: string): Promise<UserRecord | null> {
  const { rows } = await getPool().query(`${USER_SELECT} WHERE u.id = $1`, [id]);
  return rows[0] ?? null;
}

export async function updateLastLogin(userId: string): Promise<void> {
  await getPool().query('UPDATE users SET last_login_at = now() WHERE id = $1', [userId]);
}

export async function updatePasswordHash(
  userId: string,
  newHash: string,
  mustChangePassword: boolean,
): Promise<void> {
  await getPool().query(
    'UPDATE users SET password_hash = $1, must_change_password = $2 WHERE id = $3',
    [newHash, mustChangePassword, userId],
  );
}

export async function insertRefreshToken(params: {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  ip?: string;
  userAgent?: string;
}): Promise<void> {
  await getPool().query(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at, created_by_ip, user_agent)
     VALUES ($1, $2, $3, $4, $5)`,
    [params.userId, params.tokenHash, params.expiresAt, params.ip ?? null, params.userAgent ?? null],
  );
}

export interface RefreshTokenRecord {
  id: string;
  user_id: string;
  expires_at: Date;
}

export async function findValidRefreshToken(tokenHash: string): Promise<RefreshTokenRecord | null> {
  const { rows } = await getPool().query(
    `SELECT id, user_id, expires_at FROM refresh_tokens
     WHERE token_hash = $1 AND revoked_at IS NULL AND expires_at > now()`,
    [tokenHash],
  );
  return rows[0] ?? null;
}

export async function revokeRefreshTokenById(id: string, reason: string): Promise<void> {
  await getPool().query(
    'UPDATE refresh_tokens SET revoked_at = now(), revoked_reason = $2 WHERE id = $1',
    [id, reason],
  );
}

export async function revokeAllUserRefreshTokens(userId: string, reason: string): Promise<void> {
  await getPool().query(
    'UPDATE refresh_tokens SET revoked_at = now(), revoked_reason = $2 WHERE user_id = $1 AND revoked_at IS NULL',
    [userId, reason],
  );
}
