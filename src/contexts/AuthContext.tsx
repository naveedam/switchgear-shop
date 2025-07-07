
import React, { createContext, useState, useContext, useEffect } from 'react';
import { User, LoginData, RegisterData, UserRole } from '@/types/user';
import { supabase } from '@/integrations/supabase/client';
import { Session } from '@supabase/supabase-js';

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
      role: (session.user.user_metadata?.role as UserRole) || undefined, // Don't default to 'buyer'
      companyName: session.user.user_metadata?.companyName || '',
      phoneNumber: session.user.user_metadata?.phoneNumber || '',
      createdAt: new Date(session.user.created_at),
    };
  };

  const fetchUserProfile = async (userId: string): Promise<User | null> => {
    console.log('AuthContext: Fetching profile for user:', userId);
    
    try {
      const { data: companyProfile, error: profileError } = await supabase
        .from('companies')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.error('AuthContext: Error fetching user profile:', profileError);
        return null;
      }

      if (companyProfile) {
        console.log('AuthContext: Company profile fetched successfully:', companyProfile);
        const fullUser: User = {
          id: userId,
          email: companyProfile.email,
          name: companyProfile.name,
          role: companyProfile.role as UserRole,
          companyName: companyProfile.name,
          phoneNumber: companyProfile.phone || '',
          createdAt: new Date(),
        };
        console.log('AuthContext: Created full user object with role:', fullUser.role);
        return fullUser;
      }

      return null;
    } catch (err: any) {
      console.error('AuthContext: Profile fetch failed:', err.message);
      return null;
    }
  };

  useEffect(() => {
    let mounted = true;
    console.log('AuthContext: Setting up auth state listener');

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        console.log('AuthContext: Auth state change event:', event, 'Session exists:', !!session);
        console.log('AuthContext: Session user:', session?.user?.email);
        
        setSession(session);
        
        if (session?.user) {
          console.log('AuthContext: User authenticated, processing...');
          setIsLoading(true);
          
          // Don't set user state until we have complete profile
          try {
            const fullUser = await fetchUserProfile(session.user.id);
            if (mounted) {
              if (fullUser) {
                console.log('AuthContext: Setting complete user profile with role:', fullUser.role);
                setUser(fullUser);
              } else {
                // Fallback to session data if no database profile
                console.log('AuthContext: No database profile, using session data');
                const basicUser = createUserFromSession(session);
                // If no role in metadata, default to buyer
                if (!basicUser.role) {
                  basicUser.role = 'buyer';
                }
                setUser(basicUser);
              }
            }
          } catch (err: any) {
            console.error('AuthContext: Profile fetch failed, using session data:', err.message);
            if (mounted) {
              const basicUser = createUserFromSession(session);
              // If no role in metadata, default to buyer
              if (!basicUser.role) {
                basicUser.role = 'buyer';
              }
              setUser(basicUser);
            }
          }
          
          setError(null);
        } else {
          console.log('AuthContext: No session, clearing user state');
          setUser(null);
          setError(null);
        }
        
        if (mounted) {
          setIsLoading(false);
          console.log('AuthContext: Auth loading complete');
        }
      }
    );

    // Check for initial session
    const initializeAuth = async () => {
      console.log('AuthContext: Checking for initial session');
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          console.log('AuthContext: Found initial session for:', session.user?.email);
          // The onAuthStateChange will handle the rest
        } else {
          console.log('AuthContext: No initial session found');
          if (mounted) {
            setIsLoading(false);
          }
        }
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
    try {
      const { error } = await supabase.auth.signInWithPassword(credentials);
      if (error) throw error;
      console.log('AuthContext: Login successful');
      // onAuthStateChange will handle setting the user
    } catch (err: any) {
      console.error('AuthContext: Login failed:', err.message);
      setError(err.message || 'An error occurred during login.');
      throw err;
    } finally {
      setIsLoading(false);
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
