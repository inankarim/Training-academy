import { getPool } from '../../database/postgres';
import {
  UserRecord,
  UserFilterParams,
  PaginationParams,
  OrgMetadata,
} from './users.types';

const BASE_USER_SELECT = `
  SELECT 
    u.id,
    u.employee_id,
    u.full_name,
    u.email,
    u.password_hash,
    u.role_id,
    r.name AS role_name,
    u.designation,
    u.department_id,
    d.name AS department_name,
    u.region_id,
    reg.name AS region_name,
    u.area_id,
    ar.name AS area_name,
    u.territory_id,
    t.name AS territory_name,
    u.employee_type,
    u.sales_role,
    u.status,
    u.must_change_password,
    u.last_login_at,
    u.avatar_url,
    u.created_by,
    u.created_at,
    u.updated_at
  FROM users u
  JOIN roles r ON r.id = u.role_id
  LEFT JOIN departments d ON d.id = u.department_id
  LEFT JOIN regions reg ON reg.id = u.region_id
  LEFT JOIN areas ar ON ar.id = u.area_id
  LEFT JOIN territories t ON t.id = u.territory_id
`;

export async function findUserById(id: string): Promise<UserRecord | null> {
  const { rows } = await getPool().query<UserRecord>(
    `${BASE_USER_SELECT} WHERE u.id = $1`,
    [id],
  );
  return rows[0] ?? null;
}

export async function findUserByEmail(email: string): Promise<UserRecord | null> {
  const { rows } = await getPool().query<UserRecord>(
    `${BASE_USER_SELECT} WHERE LOWER(u.email) = LOWER($1)`,
    [email],
  );
  return rows[0] ?? null;
}

export async function findUserByEmployeeId(employeeId: string): Promise<UserRecord | null> {
  const { rows } = await getPool().query<UserRecord>(
    `${BASE_USER_SELECT} WHERE u.employee_id = $1`,
    [employeeId],
  );
  return rows[0] ?? null;
}

export async function findRoleIdByName(roleName: string): Promise<string | null> {
  const { rows } = await getPool().query<{ id: string }>(
    'SELECT id FROM roles WHERE name = $1',
    [roleName],
  );
  return rows[0]?.id ?? null;
}

export async function insertUser(data: {
  employeeId?: string | null;
  fullName: string;
  email: string;
  passwordHash: string;
  roleId: string;
  designation?: string | null;
  departmentId?: string | null;
  regionId?: string | null;
  areaId?: string | null;
  territoryId?: string | null;
  employeeType?: string | null;
  salesRole?: string | null;
  createdBy?: string | null;
}): Promise<UserRecord> {
  const { rows } = await getPool().query<UserRecord>(
    `INSERT INTO users (
      employee_id, full_name, email, password_hash, role_id,
      designation, department_id, region_id, area_id, territory_id,
      employee_type, sales_role, created_by,
      status, must_change_password
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'active', true)
    RETURNING id`,
    [
      data.employeeId || null,
      data.fullName,
      data.email.toLowerCase().trim(),
      data.passwordHash,
      data.roleId,
      data.designation || null,
      data.departmentId || null,
      data.regionId || null,
      data.areaId || null,
      data.territoryId || null,
      data.employeeType || 'permanent',
      data.salesRole || null,
      data.createdBy || null,
    ],
  );

  const created = await findUserById(rows[0].id);
  if (!created) {
    throw new Error('Failed to retrieve newly created user.');
  }
  return created;
}

/** Every active learner's id — feeds "send this notification to all learners." */
export async function findActiveLearnerIds(): Promise<string[]> {
  const { rows } = await getPool().query<{ id: string }>(
    `SELECT u.id FROM users u JOIN roles r ON r.id = u.role_id WHERE r.name = 'learner' AND u.status = 'active'`,
  );
  return rows.map((r) => r.id);
}

export async function listUsers(
  filters: UserFilterParams,
  pagination: PaginationParams,
  allowedRoleNames?: string[],
): Promise<{ items: UserRecord[]; total: number }> {
  const conditions: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (allowedRoleNames && allowedRoleNames.length > 0) {
    conditions.push(`r.name = ANY($${paramIndex++})`);
    values.push(allowedRoleNames);
  }

  if (filters.role) {
    conditions.push(`r.name = $${paramIndex++}`);
    values.push(filters.role);
  }

  if (filters.status) {
    conditions.push(`u.status = $${paramIndex++}`);
    values.push(filters.status);
  }

  if (filters.departmentId) {
    conditions.push(`u.department_id = $${paramIndex++}`);
    values.push(filters.departmentId);
  }

  if (filters.regionId) {
    conditions.push(`u.region_id = $${paramIndex++}`);
    values.push(filters.regionId);
  }

  if (filters.areaId) {
    conditions.push(`u.area_id = $${paramIndex++}`);
    values.push(filters.areaId);
  }

  if (filters.territoryId) {
    conditions.push(`u.territory_id = $${paramIndex++}`);
    values.push(filters.territoryId);
  }

  if (filters.salesRole) {
    conditions.push(`u.sales_role = $${paramIndex++}`);
    values.push(filters.salesRole);
  }

  if (filters.employeeType) {
    conditions.push(`u.employee_type = $${paramIndex++}`);
    values.push(filters.employeeType);
  }

  if (filters.designation) {
    conditions.push(`LOWER(u.designation) LIKE LOWER($${paramIndex++})`);
    values.push(`%${filters.designation}%`);
  }

  if (filters.search) {
    conditions.push(
      `(LOWER(u.full_name) LIKE LOWER($${paramIndex}) OR LOWER(u.email) LIKE LOWER($${paramIndex}) OR LOWER(COALESCE(u.employee_id, '')) LIKE LOWER($${paramIndex}))`,
    );
    values.push(`%${filters.search}%`);
    paramIndex++;
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const countQuery = `
    SELECT COUNT(*)::int AS total
    FROM users u
    JOIN roles r ON r.id = u.role_id
    ${whereClause}
  `;

  const totalRes = await getPool().query<{ total: number }>(countQuery, values);
  const total = totalRes.rows[0]?.total ?? 0;

  const offset = (pagination.page - 1) * pagination.pageSize;
  const listQuery = `
    ${BASE_USER_SELECT}
    ${whereClause}
    ORDER BY u.created_at DESC
    LIMIT $${paramIndex++} OFFSET $${paramIndex++}
  `;

  const listValues = [...values, pagination.pageSize, offset];
  const { rows } = await getPool().query<UserRecord>(listQuery, listValues);

  return { items: rows, total };
}

export async function updateUser(
  id: string,
  data: {
    fullName?: string;
    designation?: string | null;
    departmentId?: string | null;
    regionId?: string | null;
    areaId?: string | null;
    territoryId?: string | null;
    employeeType?: string | null;
    salesRole?: string | null;
    roleId?: string;
  },
): Promise<void> {
  const fields: string[] = [];
  const values: unknown[] = [];
  let paramIdx = 1;

  if (data.fullName !== undefined) {
    fields.push(`full_name = $${paramIdx++}`);
    values.push(data.fullName);
  }

  if (data.designation !== undefined) {
    fields.push(`designation = $${paramIdx++}`);
    values.push(data.designation);
  }

  if (data.departmentId !== undefined) {
    fields.push(`department_id = $${paramIdx++}`);
    values.push(data.departmentId);
  }

  if (data.regionId !== undefined) {
    fields.push(`region_id = $${paramIdx++}`);
    values.push(data.regionId);
  }

  if (data.areaId !== undefined) {
    fields.push(`area_id = $${paramIdx++}`);
    values.push(data.areaId);
  }

  if (data.territoryId !== undefined) {
    fields.push(`territory_id = $${paramIdx++}`);
    values.push(data.territoryId);
  }

  if (data.employeeType !== undefined) {
    fields.push(`employee_type = $${paramIdx++}`);
    values.push(data.employeeType);
  }

  if (data.salesRole !== undefined) {
    fields.push(`sales_role = $${paramIdx++}`);
    values.push(data.salesRole);
  }

  if (data.roleId !== undefined) {
    fields.push(`role_id = $${paramIdx++}`);
    values.push(data.roleId);
  }

  if (fields.length === 0) return;

  values.push(id);
  const query = `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramIdx}`;
  await getPool().query(query, values);
}

export async function setUserStatus(id: string, status: 'active' | 'deactivated'): Promise<void> {
  await getPool().query('UPDATE users SET status = $1 WHERE id = $2', [status, id]);
}

export async function getOrgMetadata(): Promise<OrgMetadata> {
  const pool = getPool();
  const [deptRes, regRes, areaRes, terrRes] = await Promise.all([
    pool.query<{ id: string; name: string }>('SELECT id, name FROM departments ORDER BY name ASC'),
    pool.query<{ id: string; name: string }>('SELECT id, name FROM regions ORDER BY name ASC'),
    pool.query<{ id: string; name: string; region_id: string | null }>(
      'SELECT id, name, region_id FROM areas ORDER BY name ASC',
    ),
    pool.query<{ id: string; name: string; area_id: string | null }>(
      'SELECT id, name, area_id FROM territories ORDER BY name ASC',
    ),
  ]);

  return {
    departments: deptRes.rows,
    regions: regRes.rows,
    areas: areaRes.rows.map((r) => ({ id: r.id, name: r.name, regionId: r.region_id })),
    territories: terrRes.rows.map((t) => ({ id: t.id, name: t.name, areaId: t.area_id })),
    salesRoles: ['SO', 'TSM', 'ASM', 'RSM', 'NON_SALES'],
    employeeTypes: ['Permanent', 'Probationary', 'Contract', 'Consultant', 'Intern'],
  };
}

/** Sets the profile photo URL and returns the previous one (so its file can be removed). */
export async function setUserAvatarUrl(userId: string, avatarUrl: string | null): Promise<string | null> {
  const { rows } = await getPool().query<{ previous: string | null }>(
    `UPDATE users u SET avatar_url = $2
     FROM (SELECT avatar_url AS previous FROM users WHERE id = $1) old
     WHERE u.id = $1
     RETURNING old.previous`,
    [userId, avatarUrl],
  );
  return rows[0]?.previous ?? null;
}
