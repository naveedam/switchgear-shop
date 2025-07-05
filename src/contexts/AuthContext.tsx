
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
    console.log('Fetching profile for user:', userId);
    
    try {
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Profile fetch timeout')), 10000)
      );
      
      const fetchPromise = supabase
        .from('companies')
        .select('*')
        .eq('id', userId)
        .single();

      const { data: companyProfile, error: profileError } = await Promise.race([
        fetchPromise,
        timeoutPromise
      ]);

      if (profileError) {
        console.error('Error fetching user profile:', profileError);
        
        // If profile doesn't exist, create a basic one for authenticated users
        if (profileError.code === 'PGRST116') {
          console.log('No profile found, user may need to complete registration');
          return null;
        }
        throw profileError;
      }

      if (companyProfile) {
        console.log('Company profile fetched successfully:', companyProfile);
        return {
          id: userId,
          email: companyProfile.email,
          name: companyProfile.name,
          role: companyProfile.role as UserRole,
          companyName: companyProfile.name,
          phoneNumber: companyProfile.phone || '',
          createdAt: new Date(),
        };
      }

      return null;
    } catch (err: any) {
      console.error('Profile fetch failed:', err.message);
      throw err;
    }
  };

  useEffect(() => {
    let mounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        console.log('Auth state change event:', event, 'Session exists:', !!session);
        setSession(session);
        
        if (session?.user) {
          console.log('User authenticated, fetching profile...');
          setIsLoading(true);
          
          try {
            const fullUser = await fetchUserProfile(session.user.id);
            if (mounted) {
              if (fullUser) {
                console.log('Setting full user object:', fullUser);
                setUser(fullUser);
                setError(null);
              } else {
                console.log('No profile found, setting basic user');
                // Set basic user info even if profile fetch fails
                setUser({
                  id: session.user.id,
                  email: session.user.email || '',
                  name: session.user.user_metadata?.name || 'User',
                  role: 'buyer', // Default role
                  companyName: '',
                  phoneNumber: '',
                  createdAt: new Date(session.user.created_at),
                });
              }
            }
          } catch (err: any) {
            console.error('Failed to fetch user profile:', err.message);
            if (mounted) {
              // Still set basic user info on profile fetch failure
              setUser({
                id: session.user.id,
                email: session.user.email || '',
                name: session.user.user_metadata?.name || 'User',
                role: 'buyer', // Default role
                companyName: '',
                phoneNumber: '',
                createdAt: new Date(session.user.created_at),
              });
              setError('Failed to load user profile, using basic info');
            }
          }
        } else {
          console.log('No session, clearing user state');
          if (mounted) {
            setUser(null);
            setError(null);
          }
        }
        
        if (mounted) {
          setIsLoading(false);
        }
      }
    );

    // Check for initial session with timeout
    const initializeAuth = async () => {
      try {
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Session check timeout')), 5000)
        );
        
        const sessionPromise = supabase.auth.getSession();
        const { data: { session } } = await Promise.race([sessionPromise, timeoutPromise]);
        
        if (!session && mounted) {
          console.log('No initial session found');
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Session initialization failed:', err);
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  const login = async (credentials: LoginData): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithPassword(credentials);
      if (error) throw error;
      // onAuthStateChange will handle setting the user
    } catch (err: any) {
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
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setError(null);
  };

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
