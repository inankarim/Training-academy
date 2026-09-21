export type UserRole = 'super_admin' | 'admin' | 'hr' | 'content_creator' | 'learner';
export type SalesRole = 'SO' | 'TSM' | 'ASM' | 'RSM' | 'NON_SALES';

export interface AuthenticatedUser {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  designation: string | null;
  mustChangePassword: boolean;
}

export interface AuthResponseData {
  accessToken: string;
  user: AuthenticatedUser;
  permissions: string[];
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    details?: unknown;
    requestId?: string;
  };
}

export interface UserSummary {
  id: string;
  employeeId: string | null;
  fullName: string;
  email: string;
  role: UserRole;
  designation: string | null;
  department: string | null;
  departmentId: string | null;
  region: string | null;
  regionId: string | null;
  area: string | null;
  areaId: string | null;
  territory: string | null;
  territoryId: string | null;
  employeeType: string | null;
  salesRole: SalesRole | null;
  status: 'active' | 'deactivated';
  mustChangePassword: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface CreateUserInput {
  fullName: string;
  email: string;
  roleName: UserRole;
  password?: string;
  employeeId?: string;
  designation?: string;
  departmentId?: string;
  regionId?: string;
  areaId?: string;
  territoryId?: string;
  employeeType?: string;
  salesRole?: SalesRole | string;
}

export interface CreateUserResponse {
  user: UserSummary;
  tempPassword: string;
}

export interface UserListParams {
  role?: string;
  status?: 'active' | 'deactivated';
  departmentId?: string;
  regionId?: string;
  areaId?: string;
  territoryId?: string;
  salesRole?: string;
  employeeType?: string;
  designation?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface PaginatedUsersResponse {
  items: UserSummary[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface OrgMetadata {
  departments: Array<{ id: string; name: string }>;
  regions: Array<{ id: string; name: string }>;
  areas: Array<{ id: string; name: string; regionId: string | null }>;
  territories: Array<{ id: string; name: string; areaId: string | null }>;
  salesRoles: string[];
  employeeTypes: string[];
}
