
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Home from './Home';

const Index = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  
  // Show loading while checking auth state
  if (isLoading) {
    return <div>Loading...</div>;
  }
  
  // If user is authenticated, redirect based on role
  if (isAuthenticated && user) {
    switch(user.role) {
      case 'admin':
        return <Navigate to="/admin" replace />;
      case 'seller':
        return <Navigate to="/seller" replace />;
      default:
        // For 'buyer' or other roles, show the home page.
        return <Home />;
    }
  }
  
  // If not authenticated, show the home page
  return <Home />;
};

export default Index;
