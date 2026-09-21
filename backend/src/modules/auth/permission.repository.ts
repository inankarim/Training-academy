import { getPool } from '../../database/postgres';

/**
 * Returns the flat list of permission keys granted to a role, straight from
 * role_permissions — this is intentionally an uncached, plain query for now.
 * The table is tiny and indexed; if this ever becomes a hot path worth
 * caching (e.g. once request volume is high), wrap this with a short-TTL
 * Redis cache keyed by role name, invalidated whenever role_permissions
 * changes. Premature caching here would just be a staleness bug waiting to
 * happen for no real benefit yet.
 */
export async function getPermissionsForRole(roleName: string): Promise<string[]> {
  const { rows } = await getPool().query<{ key: string }>(
    `SELECT p.key FROM role_permissions rp
     JOIN permissions p ON p.id = rp.permission_id
     JOIN roles r ON r.id = rp.role_id
     WHERE r.name = $1`,
    [roleName],
  );
  return rows.map((r) => r.key);
}
