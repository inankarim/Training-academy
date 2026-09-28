export interface AccessTokenPayload {
  sub: string; // user id
  role: string; // role name at time of token issue
  type: 'access';
}

export interface AuthenticatedUserDTO {
  id: string;
  fullName: string;
  email: string;
  role: string;
  designation: string | null;
  mustChangePassword: boolean;
  avatarUrl: string | null;
}

export interface ClientContext {
  ip?: string;
  userAgent?: string;
}
