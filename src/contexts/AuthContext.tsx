import React, { createContext, useState, useContext, useEffect } from 'react';
import { User, LoginData, RegisterData, UserRole } from '@/types/user';
import { supabase } from '@/integrations/supabase/client';
import { Session } from '@supabase/supabase-js';
import { adminRoleService, AdminVerification } from '@/services/AdminRoleService';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginData) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const logRoleAssignment = (
    userId: string, 
    email: string, 
    assignedRole: UserRole | undefined, 
    source: string, 
    context: any
  ) => {
    console.log(`🔐 ROLE ASSIGNMENT [${new Date().toISOString()}]`, {
      userId,
      email,
      assignedRole,
      source,
      context,
      timestamp: Date.now()
    });
  };

  const createUserFromSession = (session: Session): User => {
    console.log('AuthContext: Creating user from session:', {
      userId: session.user.id,
      email: session.user.email,
      metadata: session.user.user_metadata
    });

    return {
      id: session.user.id,
      email: session.user.email || '',
      name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
      role: (session.user.user_metadata?.role as UserRole) || undefined,
      companyName: session.user.user_metadata?.companyName || '',
      phoneNumber: session.user.user_metadata?.phoneNumber || '',
      createdAt: new Date(session.user.created_at),
    };
  };

  const determineUserRole = async (
    userId: string, 
    email: string, 
    sessionRole: UserRole | undefined
  ): Promise<UserRole> => {
    console.log('AuthContext: Determining user role for:', { userId, email, sessionRole });

    // Step 1: Check if user is admin (highest priority)
    const adminVerification: AdminVerification = await adminRoleService.verifyAdminRole(userId);
    
    if (adminVerification.isAdmin) {
      logRoleAssignment(userId, email, 'admin', 'database-admin-verification', adminVerification);
      return 'admin';
    }

    // Step 2: Emergency admin bypass
    if (adminRoleService.isEmergencyAdmin(email)) {
      logRoleAssignment(userId, email, 'admin', 'emergency-admin-bypass', { email });
      return 'admin';
    }

    // Step 3: Check company profile for role
    try {
      const { data: companyProfile, error } = await supabase
        .from('companies')
        .select('role')
        .eq('id', userId)
        .single();

      if (!error && companyProfile?.role) {
        const dbRole = companyProfile.role as UserRole;
        logRoleAssignment(userId, email, dbRole, 'database-company-profile', companyProfile);
        return dbRole;
      }
    } catch (err) {
      console.warn('AuthContext: Failed to fetch company profile:', err);
    }

    // Step 4: Use session metadata role
    if (sessionRole) {
      logRoleAssignment(userId, email, sessionRole, 'session-metadata', { sessionRole });
      return sessionRole;
    }

    // Step 5: Check if user exists in database
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('id')
        .eq('id', userId)
        .single();
      
      if (!error && data) {
        // Existing user without role - don't force buyer role
        logRoleAssignment(userId, email, undefined, 'existing-user-no-role', { exists: true });
        return 'buyer'; // Conservative fallback for existing users
      }
    } catch (err) {
      console.warn('AuthContext: Failed to check user existence:', err);
    }

    // Step 6: New user default
    logRoleAssignment(userId, email, 'buyer', 'new-user-default', { isNewUser: true });
    return 'buyer';
  };

  const processAuthenticatedUser = async (session: Session) => {
    console.log('AuthContext: Processing authenticated user:', session.user.email);
    setIsLoading(true);

    try {
      const basicUser = createUserFromSession(session);
      const finalRole = await determineUserRole(
        session.user.id, 
        session.user.email || '', 
        basicUser.role
      );

      const finalUser: User = {
        ...basicUser,
        role: finalRole
      };

      console.log('AuthContext: Setting final user with role:', {
        email: finalUser.email,
        role: finalUser.role,
        source: 'role-determination-complete'
      });

      setUser(finalUser);
      setError(null);
    } catch (err: any) {
      console.error('AuthContext: Failed to process authenticated user:', err);
      setError('Failed to load user profile');
      
      // Fallback: set basic user without database role
      const basicUser = createUserFromSession(session);
      setUser(basicUser);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    console.log('AuthContext: Setting up auth state listener');

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;

        console.log('AuthContext: Auth state change event:', event, 'Session exists:', !!session);
        setSession(session);
        
        if (session?.user) {
          // Process authenticated user
          processAuthenticatedUser(session);
        } else {
          console.log('AuthContext: No session, clearing user state');
          setUser(null);
          setError(null);
          setIsLoading(false);
          
          // Clear admin cache on logout
          adminRoleService.clearCache();
        }
      }
    );

    // Check for initial session
    const initializeAuth = async () => {
      console.log('AuthContext: Checking for initial session');
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session && mounted) {
          setIsLoading(false);
        }
        // If session exists, onAuthStateChange will handle it
      } catch (err) {
        console.error('AuthContext: Session initialization failed:', err);
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      console.log('AuthContext: Cleaning up auth listener');
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  const login = async (credentials: LoginData): Promise<void> => {
    console.log('AuthContext: Attempting login for:', credentials.email);
    setIsLoading(true);
    setError(null);
    
    // Clear any existing admin cache
    adminRoleService.clearCache();
    
    try {
      const { error } = await supabase.auth.signInWithPassword(credentials);
      if (error) throw error;
      console.log('AuthContext: Login successful');
      // onAuthStateChange will handle setting the user
    } catch (err: any) {
      console.error('AuthContext: Login failed:', err.message);
      setError(err.message || 'An error occurred during login.');
      setIsLoading(false);
      throw err;
    }
  };

  const register = async (data: RegisterData): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            name: data.name,
            companyName: data.companyName,
            phoneNumber: data.phoneNumber,
            role: data.role,
          },
        },
      });
      if (error) throw error;
      // onAuthStateChange will handle setting the user after confirmation
    } catch (err: any) {
      setError(err.message || 'An error occurred during registration.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    console.log('AuthContext: Logging out');
    adminRoleService.clearCache();
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setError(null);
  };

  const contextValue = {
    user,
    isLoading,
    error,
    login,
    register,
    logout,
    isAuthenticated: !!user,
  };

  console.log('AuthContext: Current state - user:', user?.email, 'role:', user?.role, 'isLoading:', isLoading, 'isAuthenticated:', !!user);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
