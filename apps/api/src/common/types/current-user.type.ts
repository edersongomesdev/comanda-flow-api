export interface CurrentUserData {
  userId: string;
  tenantId: string;
  email: string;
  role: 'OWNER' | 'ADMIN';
  authProvider: 'legacy' | 'supabase';
}
