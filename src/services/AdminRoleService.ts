
import { supabase } from '@/integrations/supabase/client';

export interface AdminVerification {
  isAdmin: boolean;
  isSuperAdmin: boolean;
  verificationSource: 'database' | 'session' | 'cache' | 'none';
  timestamp: number;
}

class AdminRoleService {
  private adminCache = new Map<string, { data: AdminVerification; expiry: number }>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  async verifyAdminRole(userId: string): Promise<AdminVerification> {
    console.log('AdminRoleService: Verifying admin role for user:', userId);
    
    // Check cache first
    const cached = this.adminCache.get(userId);
    if (cached && cached.expiry > Date.now()) {
      console.log('AdminRoleService: Using cached admin verification:', cached.data);
      return cached.data;
    }

    try {
      // Single query to get both company and admin_users data
      const [companyResult, adminResult] = await Promise.all([
        supabase
          .from('companies')
          .select('role')
          .eq('id', userId)
          .single(),
        supabase
          .from('admin_users')
          .select('is_super_admin, status')
          .eq('id', userId)
          .single()
      ]);

      const isAdminFromCompany = companyResult.data?.role === 'admin';
      const isAdminFromAdminTable = adminResult.data && adminResult.data.status === 'active';
      const isSuperAdmin = adminResult.data?.is_super_admin === true;

      const verification: AdminVerification = {
        isAdmin: isAdminFromCompany || isAdminFromAdminTable,
        isSuperAdmin,
        verificationSource: 'database',
        timestamp: Date.now()
      };

      console.log('AdminRoleService: Database verification result:', {
        userId,
        companyRole: companyResult.data?.role,
        adminTableStatus: adminResult.data?.status,
        isSuperAdmin,
        finalVerification: verification
      });

      // Cache the result
      this.adminCache.set(userId, {
        data: verification,
        expiry: Date.now() + this.CACHE_TTL
      });

      return verification;
    } catch (error) {
      console.error('AdminRoleService: Failed to verify admin role:', error);
      
      // Return safe default - not admin
      return {
        isAdmin: false,
        isSuperAdmin: false,
        verificationSource: 'none',
        timestamp: Date.now()
      };
    }
  }

  clearCache(userId?: string) {
    if (userId) {
      this.adminCache.delete(userId);
      console.log('AdminRoleService: Cleared cache for user:', userId);
    } else {
      this.adminCache.clear();
      console.log('AdminRoleService: Cleared all admin cache');
    }
  }

  // Emergency admin access bypass for known admin emails
  /** Removed: admin access is granted only via the database (companies.role / admin_users). */
  isEmergencyAdmin(_email: string): boolean {
    return false;
  }
}

export const adminRoleService = new AdminRoleService();
