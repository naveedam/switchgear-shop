
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

  const fetchUserProfile = async (userId: string): Promise<User | null> => {
    console.log('AuthContext: Fetching profile for user:', userId);
    
    try {
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Profile fetch timeout')), 10000)
      );
      
      const fetchPromise = supabase
        .from('companies')
        .select('*')
        .eq('id', userId)
        .single();

      const result = await Promise.race([
        fetchPromise,
        timeoutPromise
      ]);

      const { data: companyProfile, error: profileError } = result;

      if (profileError) {
        console.error('AuthContext: Error fetching user profile:', profileError);
        
        // If profile doesn't exist, create a basic one for authenticated users
        if (profileError.code === 'PGRST116') {
          console.log('AuthContext: No profile found, user may need to complete registration');
          return null;
        }
        throw profileError;
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
      throw err;
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
          console.log('AuthContext: User authenticated, fetching profile...');
          setIsLoading(true);
          
          try {
            const fullUser = await fetchUserProfile(session.user.id);
            if (mounted) {
              if (fullUser) {
                console.log('AuthContext: Setting full user object:', fullUser);
                console.log('AuthContext: User role set to:', fullUser.role);
                setUser(fullUser);
                setError(null);
              } else {
                console.log('AuthContext: No profile found, setting basic user');
                // Set basic user info even if profile fetch fails
                const basicUser: User = {
                  id: session.user.id,
                  email: session.user.email || '',
                  name: session.user.user_metadata?.name || 'User',
                  role: 'buyer', // Default role
                  companyName: '',
                  phoneNumber: '',
                  createdAt: new Date(session.user.created_at),
                };
                console.log('AuthContext: Setting basic user with role:', basicUser.role);
                setUser(basicUser);
              }
            }
          } catch (err: any) {
            console.error('AuthContext: Failed to fetch user profile:', err.message);
            if (mounted) {
              // Still set basic user info on profile fetch failure
              const basicUser: User = {
                id: session.user.id,
                email: session.user.email || '',
                name: session.user.user_metadata?.name || 'User',
                role: 'buyer', // Default role
                companyName: '',
                phoneNumber: '',
                createdAt: new Date(session.user.created_at),
              };
              console.log('AuthContext: Setting fallback user with role:', basicUser.role);
              setUser(basicUser);
              setError('Failed to load user profile, using basic info');
            }
          }
        } else {
          console.log('AuthContext: No session, clearing user state');
          if (mounted) {
            setUser(null);
            setError(null);
          }
        }
        
        if (mounted) {
          setIsLoading(false);
          console.log('AuthContext: Auth loading complete');
        }
      }
    );

    // Check for initial session with timeout
    const initializeAuth = async () => {
      console.log('AuthContext: Initializing auth check');
      try {
        const timeoutPromise = new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Session check timeout')), 5000)
        );
        
        const sessionPromise = supabase.auth.getSession();
        const result = await Promise.race([sessionPromise, timeoutPromise]);
        
        const { data: { session } } = result;
        
        if (!session && mounted) {
          console.log('AuthContext: No initial session found');
          setIsLoading(false);
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

  console.log('AuthContext: Current state - user:', user?.email, 'role:', user?.role, 'isLoading:', isLoading, 'isAuthenticated:', !!user);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        error,
        login,
        register,
        logout,
        isAuthenticated: !!user,
      }}
    >
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
