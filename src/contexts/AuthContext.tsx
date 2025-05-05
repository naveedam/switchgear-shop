
import React, { createContext, useState, useContext, useEffect } from 'react';
import { User, LoginData, RegisterData, UserRole } from '@/types/user';

// Mock user data for development
const MOCK_USERS = [
  {
    id: '1',
    email: 'naveedahmedm@hotmail.com',
    name: 'Admin User',
    role: 'admin' as UserRole,
    companyName: 'Switchgear Shop',
    phoneNumber: '555-1234',
    createdAt: new Date(),
    password: 'admin123' // Added password field for admin
  },
  {
    id: '2',
    email: 'seller@example.com',
    name: 'Seller User',
    role: 'seller' as UserRole,
    companyName: 'ElectroTech Industries',
    phoneNumber: '555-5678',
    createdAt: new Date(),
  },
  {
    id: '3',
    email: 'buyer@example.com',
    name: 'Buyer User',
    role: 'buyer' as UserRole,
    companyName: 'PowerGrid Solutions',
    phoneNumber: '555-9012',
    createdAt: new Date(),
  }
];

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
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check for saved user in localStorage
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (credentials: LoginData): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Find user in mock data
      const foundUser = MOCK_USERS.find(u => u.email === credentials.email);
      
      if (foundUser) {
        // For the admin account, check the password
        if (foundUser.email === 'naveedahmedm@hotmail.com' && credentials.password !== 'admin123') {
          throw new Error('Invalid password for admin account');
        }
        
        // For other accounts, password check would go here in a real app
        // We'll just extract the relevant user fields without the password
        const { password, ...userWithoutPassword } = foundUser;
        
        setUser(userWithoutPassword);
        localStorage.setItem('user', JSON.stringify(userWithoutPassword));
      } else {
        throw new Error('Invalid email or password');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterData): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check if user already exists
      if (MOCK_USERS.some(u => u.email === data.email)) {
        throw new Error('User already exists');
      }
      
      // Create new user - ensure required fields are provided with defaults if needed
      const newUser: User = {
        id: (MOCK_USERS.length + 1).toString(),
        email: data.email,
        name: data.name,
        role: data.role,
        companyName: data.companyName || 'Default Company', // Provide default if not supplied
        phoneNumber: data.phoneNumber || 'Not provided', // Provide default if not supplied
        createdAt: new Date()
      };
      
      // In a real app, you would save this to your backend
      // For now, we'll just update our mock data and local state
      MOCK_USERS.push({...newUser, password: data.password});
      setUser(newUser);
      localStorage.setItem('user', JSON.stringify(newUser));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = (): void => {
    localStorage.removeItem('user');
    setUser(null);
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
