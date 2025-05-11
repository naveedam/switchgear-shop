
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import LoginForm from '@/components/auth/LoginForm';
import { useAuth } from '@/contexts/AuthContext';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  
  // If user is already authenticated, redirect to appropriate dashboard
  useEffect(() => {
    if (isAuthenticated && user) {
      console.log("User authenticated, redirecting based on role:", user.role);
      switch(user.role) {
        case 'admin':
          navigate('/admin', { replace: true });
          break;
        case 'seller':
          navigate('/seller', { replace: true });
          break;
        default:
          navigate('/', { replace: true });
      }
    }
  }, [user, isAuthenticated, navigate]);
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Sign in</CardTitle>
          <CardDescription>
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm onSuccess={() => {
            // The user object will be updated via the AuthContext
            // and the useEffect above will handle redirection
          }} />
          <p className="mt-4 text-center text-sm text-gray-500">
            Don't have an account?{' '}
            <button 
              onClick={() => navigate('/register')} 
              className="text-blue-600 hover:underline"
            >
              Register
            </button>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;
