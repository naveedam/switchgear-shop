
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const Index = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  
  console.log("Index page - isAuthenticated:", isAuthenticated, "user:", user);
  
  // Show loading while checking auth state
  if (isLoading) {
    return <div>Loading...</div>;
  }
  
  // If user is authenticated, redirect based on role
  if (isAuthenticated && user) {
    console.log("Redirecting user with role:", user.role);
    switch(user.role) {
      case 'admin':
        return <Navigate to="/admin" replace />;
      case 'seller':
        return <Navigate to="/seller" replace />;
      default:
        return <Navigate to="/" replace />;
    }
  }
  
  // If not authenticated, redirect to home page
  return <Navigate to="/" replace />;
};

export default Index;
