
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const Index = () => {
  const { user, isAuthenticated } = useAuth();
  
  // If user is authenticated, redirect based on role
  if (isAuthenticated && user) {
    switch(user.role) {
      case 'admin':
        return <Navigate to="/admin" replace />;
      case 'seller':
        return <Navigate to="/seller" replace />;
      default:
        return <Navigate to="/" replace />;
    }
  }
  
  // If not authenticated or no user, just go to home
  return <Navigate to="/" replace />;
};

export default Index;
