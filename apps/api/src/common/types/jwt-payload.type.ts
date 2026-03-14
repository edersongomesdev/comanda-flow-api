import { CurrentUserData } from './current-user.type';

export interface JwtPayload {
  sub: string;
  userId: string;
  tenantId: string;
  email: string;
  role: CurrentUserData['role'];
  authProvider?: 'legacy';
}
