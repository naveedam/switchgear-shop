
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import LoginForm from '@/components/auth/LoginForm';
import { useAuth } from '@/contexts/AuthContext';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading } = useAuth();
  
  // If user is already authenticated, redirect to appropriate dashboard
  useEffect(() => {
    console.log("LoginPage useEffect - isAuthenticated:", isAuthenticated, "user:", user, "isLoading:", isLoading);
    
    if (!isLoading && isAuthenticated && user) {
      console.log("User authenticated, redirecting based on role:", user.role);
      switch(user.role) {
        case 'admin':
          console.log("Redirecting to admin dashboard");
          navigate('/admin', { replace: true });
          break;
        case 'seller':
          console.log("Redirecting to seller dashboard");
          navigate('/seller', { replace: true });
          break;
        default:
          console.log("Redirecting to home page");
          navigate('/', { replace: true });
      }
    }
  }, [user, isAuthenticated, isLoading, navigate]);
  
  // Show loading while checking auth state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div>Loading...</div>
      </div>
    );
  }
  
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
            console.log("LoginForm onSuccess callback triggered");
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
