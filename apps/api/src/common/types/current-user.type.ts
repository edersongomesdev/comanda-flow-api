import { UserRole } from '@prisma/client';

export interface CurrentUserData {
  userId: string;
  tenantId: string;
  email: string;
  role: UserRole;
  authProvider: 'supabase';
}
