export interface UserRecord {
  id: string;
  employee_id: string | null;
  full_name: string;
  email: string;
  password_hash: string;
  role_id: string;
  role_name: string;
  designation: string | null;
  department_id: string | null;
  department_name: string | null;
  region_id: string | null;
  region_name: string | null;
  area_id: string | null;
  area_name: string | null;
  territory_id: string | null;
  territory_name: string | null;
  employee_type: string | null;
  sales_role: string | null;
  status: 'active' | 'deactivated';
  must_change_password: boolean;
  last_login_at: Date | null;
  created_by: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface UserSummaryDTO {
  id: string;
  employeeId: string | null;
  fullName: string;
  email: string;
  role: string;
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
  salesRole: string | null;
  status: 'active' | 'deactivated';
  mustChangePassword: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
}

export interface CreateUserInput {
  fullName: string;
  email: string;
  roleName: string;
  password?: string | null;
  employeeId?: string | null;
  designation?: string | null;
  departmentId?: string | null;
  regionId?: string | null;
  areaId?: string | null;
  territoryId?: string | null;
  employeeType?: string | null;
  salesRole?: string | null;
}

export interface UpdateUserInput {
  fullName?: string;
  designation?: string | null;
  departmentId?: string | null;
  regionId?: string | null;
  areaId?: string | null;
  territoryId?: string | null;
  employeeType?: string | null;
  salesRole?: string | null;
  roleName?: string;
}

export interface UserFilterParams {
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
}

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PaginatedUsersResult {
  items: UserSummaryDTO[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface RequesterContext {
  id: string;
  role: string;
  permissions: string[];
}

export interface OrgMetadata {
  departments: Array<{ id: string; name: string }>;
  regions: Array<{ id: string; name: string }>;
  areas: Array<{ id: string; name: string; regionId: string | null }>;
  territories: Array<{ id: string; name: string; areaId: string | null }>;
  salesRoles: string[];
  employeeTypes: string[];
}
