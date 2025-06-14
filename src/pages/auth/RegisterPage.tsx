
import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import RegisterForm from '@/components/auth/RegisterForm';
import { useAuth } from '@/contexts/AuthContext';

const RegisterPage: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // If already authenticated, redirect user
  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      // Redirect based on role
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
  }, [user, isAuthenticated, isLoading, navigate]);

  // Prefill registration type from query, pass as prop to RegisterForm if supported
  const roleQuery = searchParams.get('role');
  const initialTab: 'seller' | 'buyer' | undefined = roleQuery === 'seller'
    ? 'seller'
    : roleQuery === 'buyer'
      ? 'buyer'
      : undefined;

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
          <CardTitle className="text-2xl font-bold">Create an Account</CardTitle>
          <CardDescription>
            Register as a buyer or a seller to start using SwitchgearShop
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RegisterForm initialTab={initialTab} onSuccess={() => {
            // Will auto-redirect via useEffect after auth context updates
          }} />
          <p className="mt-4 text-center text-sm text-gray-500">
            Already have an account?{' '}
            <button 
              onClick={() => navigate('/login')} 
              className="text-blue-600 hover:underline"
            >
              Login
            </button>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default RegisterPage;
