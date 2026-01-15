export interface AuthUser {
  sub: number;
  tenantId: number;
  role: 'admin' | 'developer' | 'viewer';
  email: string;
}
