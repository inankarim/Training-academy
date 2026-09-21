import crypto from 'crypto';
import { AppError } from '../../middleware/errorHandler';
import { writeAuditLog } from '../../utils/auditLog';
import { hashPassword, isPasswordStrongEnough } from '../auth/password.util';
import { revokeAllUserRefreshTokens } from '../auth/auth.repository';
import * as usersRepo from './users.repository';
import {
  CreateUserInput,
  UpdateUserInput,
  UserFilterParams,
  PaginationParams,
  PaginatedUsersResult,
  RequesterContext,
  UserRecord,
  UserSummaryDTO,
  OrgMetadata,
} from './users.types';
import { ClientContext } from '../auth/auth.types';

function toDTO(user: UserRecord): UserSummaryDTO {
  return {
    id: user.id,
    employeeId: user.employee_id,
    fullName: user.full_name,
    email: user.email,
    role: user.role_name,
    designation: user.designation,
    department: user.department_name,
    departmentId: user.department_id,
    region: user.region_name,
    regionId: user.region_id,
    area: user.area_name,
    areaId: user.area_id,
    territory: user.territory_name,
    territoryId: user.territory_id,
    employeeType: user.employee_type,
    salesRole: user.sales_role,
    status: user.status,
    mustChangePassword: user.must_change_password,
    lastLoginAt: user.last_login_at,
    createdAt: user.created_at,
  };
}

function generateSecureTempPassword(): string {
  const randomSuffix = crypto.randomBytes(4).toString('hex');
  return `Hlc#${randomSuffix}2026`;
}

function checkRoleCreationAllowed(requester: RequesterContext, targetRole: string): void {
  if (requester.role === 'super_admin') {
    return;
  }

  if (requester.role === 'admin') {
    const hasStaffManage = requester.permissions.includes('users.manage_staff_roles');
    if (!hasStaffManage && ['admin', 'hr', 'super_admin'].includes(targetRole)) {
      throw new AppError('Admins cannot create staff roles (Admin, HR, Super Admin).', 403);
    }
    return;
  }

  if (requester.role === 'hr') {
    if (targetRole !== 'learner') {
      throw new AppError('HR users can only create learner/employee accounts.', 403);
    }
    return;
  }

  throw new AppError('You do not have permission to create users.', 403);
}

function getAllowedRolesForViewer(requester: RequesterContext): string[] | undefined {
  if (requester.role === 'super_admin') {
    return undefined; // no filter, can see all
  }
  if (requester.role === 'admin') {
    return ['learner', 'content_creator', 'hr', 'admin'];
  }
  if (requester.role === 'hr') {
    return ['learner'];
  }
  return [];
}

export async function createUser(
  requester: RequesterContext,
  input: CreateUserInput,
  ctx: ClientContext,
): Promise<{ user: UserSummaryDTO; tempPassword: string }> {
  checkRoleCreationAllowed(requester, input.roleName);

  const existingEmail = await usersRepo.findUserByEmail(input.email);
  if (existingEmail) {
    throw new AppError('A user with this email address already exists.', 409);
  }

  if (input.employeeId) {
    const existingEmployeeId = await usersRepo.findUserByEmployeeId(input.employeeId);
    if (existingEmployeeId) {
      throw new AppError('A user with this employee ID already exists.', 409);
    }
  }

  const roleId = await usersRepo.findRoleIdByName(input.roleName);
  if (!roleId) {
    throw new AppError(`Role '${input.roleName}' does not exist.`, 400);
  }

  let finalPassword = input.password?.trim();
  if (finalPassword) {
    if (!isPasswordStrongEnough(finalPassword)) {
      throw new AppError(
        'Specified password must be at least 10 characters with uppercase, lowercase, and a number.',
        400,
      );
    }
  } else {
    finalPassword = generateSecureTempPassword();
  }

  const passwordHash = await hashPassword(finalPassword);

  const createdRecord = await usersRepo.insertUser({
    employeeId: input.employeeId,
    fullName: input.fullName,
    email: input.email,
    passwordHash,
    roleId,
    designation: input.designation,
    departmentId: input.departmentId,
    regionId: input.regionId,
    areaId: input.areaId,
    territoryId: input.territoryId,
    employeeType: input.employeeType,
    salesRole: input.salesRole,
    createdBy: requester.id,
  });

  await writeAuditLog({
    actorUserId: requester.id,
    action: 'user.create',
    targetType: 'user',
    targetId: createdRecord.id,
    metadata: {
      email: createdRecord.email,
      role: createdRecord.role_name,
      employeeId: createdRecord.employee_id,
      salesRole: createdRecord.sales_role,
      employeeType: createdRecord.employee_type,
    },
    ipAddress: ctx.ip,
    userAgent: ctx.userAgent,
  });

  return {
    user: toDTO(createdRecord),
    tempPassword: finalPassword,
  };
}

export async function listUsers(
  requester: RequesterContext,
  filters: UserFilterParams,
  pagination: PaginationParams,
): Promise<PaginatedUsersResult> {
  const allowedRoles = getAllowedRolesForViewer(requester);
  const { items, total } = await usersRepo.listUsers(filters, pagination, allowedRoles);

  return {
    items: items.map(toDTO),
    total,
    page: pagination.page,
    pageSize: pagination.pageSize,
    totalPages: Math.ceil(total / pagination.pageSize) || 1,
  };
}

export async function getUserDetail(
  requester: RequesterContext,
  userId: string,
): Promise<UserSummaryDTO> {
  const user = await usersRepo.findUserById(userId);
  if (!user) {
    throw new AppError('User not found.', 404);
  }

  const allowedRoles = getAllowedRolesForViewer(requester);
  if (allowedRoles && !allowedRoles.includes(user.role_name)) {
    throw new AppError('You do not have access to view this user.', 403);
  }

  return toDTO(user);
}

export async function updateUser(
  requester: RequesterContext,
  userId: string,
  input: UpdateUserInput,
  ctx: ClientContext,
): Promise<void> {
  const user = await usersRepo.findUserById(userId);
  if (!user) {
    throw new AppError('User not found.', 404);
  }

  if (requester.role === 'hr' && user.role_name !== 'learner') {
    throw new AppError('HR users can only manage learner accounts.', 403);
  }

  if (user.role_name === 'super_admin' && requester.role !== 'super_admin') {
    throw new AppError('Only Super Admins can modify Super Admin accounts.', 403);
  }

  let roleId: string | undefined;
  if (input.roleName) {
    checkRoleCreationAllowed(requester, input.roleName);
    const foundRoleId = await usersRepo.findRoleIdByName(input.roleName);
    if (!foundRoleId) {
      throw new AppError(`Role '${input.roleName}' does not exist.`, 400);
    }
    roleId = foundRoleId;
  }

  await usersRepo.updateUser(userId, {
    fullName: input.fullName,
    designation: input.designation,
    departmentId: input.departmentId,
    regionId: input.regionId,
    areaId: input.areaId,
    territoryId: input.territoryId,
    employeeType: input.employeeType,
    salesRole: input.salesRole,
    roleId,
  });

  await writeAuditLog({
    actorUserId: requester.id,
    action: 'user.update',
    targetType: 'user',
    targetId: userId,
    metadata: { changes: input },
    ipAddress: ctx.ip,
    userAgent: ctx.userAgent,
  });
}

export async function deactivateUser(
  requester: RequesterContext,
  userId: string,
  ctx: ClientContext,
): Promise<void> {
  if (requester.id === userId) {
    throw new AppError('You cannot deactivate your own account.', 400);
  }

  const user = await usersRepo.findUserById(userId);
  if (!user) {
    throw new AppError('User not found.', 404);
  }

  if (user.role_name === 'super_admin') {
    throw new AppError('Super Admin accounts cannot be deactivated.', 400);
  }

  await usersRepo.setUserStatus(userId, 'deactivated');
  await revokeAllUserRefreshTokens(userId, 'deactivated');

  await writeAuditLog({
    actorUserId: requester.id,
    action: 'user.deactivate',
    targetType: 'user',
    targetId: userId,
    ipAddress: ctx.ip,
    userAgent: ctx.userAgent,
  });
}

export async function reactivateUser(
  requester: RequesterContext,
  userId: string,
  ctx: ClientContext,
): Promise<void> {
  const user = await usersRepo.findUserById(userId);
  if (!user) {
    throw new AppError('User not found.', 404);
  }

  await usersRepo.setUserStatus(userId, 'active');

  await writeAuditLog({
    actorUserId: requester.id,
    action: 'user.reactivate',
    targetType: 'user',
    targetId: userId,
    ipAddress: ctx.ip,
    userAgent: ctx.userAgent,
  });
}

export async function getOrganizationalMetadata(): Promise<OrgMetadata> {
  return usersRepo.getOrgMetadata();
}
