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

  const fetchUserProfile = async (userId: string, retryCount = 0): Promise<User | null> => {
    console.log('AuthContext: Fetching profile for user:', userId, 'Retry:', retryCount);
    
    try {
      const { data: companyProfile, error: profileError } = await supabase
        .from('companies')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.error('AuthContext: Error fetching user profile:', profileError);
        
        // Retry logic for temporary database issues
        if (retryCount < 2 && profileError.code !== 'PGRST116') { // PGRST116 is "not found"
          console.log('AuthContext: Retrying profile fetch...');
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
          return fetchUserProfile(userId, retryCount + 1);
        }
        
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
      
      // Retry logic for network/connection issues
      if (retryCount < 2) {
        console.log('AuthContext: Retrying profile fetch due to error...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        return fetchUserProfile(userId, retryCount + 1);
      }
      
      return null;
    }
  };

  const checkIfUserExists = async (userId: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('id')
        .eq('id', userId)
        .single();
      
      return !error && !!data;
    } catch {
      return false;
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
                // Check if user exists in database before applying fallback
                const userExists = await checkIfUserExists(session.user.id);
                console.log('AuthContext: User exists in database:', userExists);
                
                if (!userExists) {
                  // Genuinely new user - can default to buyer
                  console.log('AuthContext: New user detected, creating with buyer role');
                  const basicUser = createUserFromSession(session);
                  basicUser.role = 'buyer';
                  setUser(basicUser);
                } else {
                  // Existing user with fetch issues - don't override their role
                  console.log('AuthContext: Existing user with fetch issues, using session data only');
                  const basicUser = createUserFromSession(session);
                  // Keep role as undefined if not in session metadata - don't force buyer role
                  setUser(basicUser);
                }
              }
            }
          } catch (err: any) {
            console.error('AuthContext: Profile fetch failed completely:', err.message);
            if (mounted) {
              // For complete failures, create basic user but don't force buyer role for existing users
              const basicUser = createUserFromSession(session);
              const userExists = await checkIfUserExists(session.user.id);
              
              if (!userExists && !basicUser.role) {
                // Only default to buyer for new users without role in metadata
                console.log('AuthContext: New user with fetch failure, defaulting to buyer');
                basicUser.role = 'buyer';
              } else {
                console.log('AuthContext: Existing user with fetch failure, keeping session role only');
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
