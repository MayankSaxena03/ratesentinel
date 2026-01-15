export interface JwtPayload {
  sub: number;
  tenantId: number;
  role: 'admin' | 'developer' | 'viewer';
  email: string;
}
