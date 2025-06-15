
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Home from './Home';

const Index = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  
  console.log('Index page render:', { isLoading, isAuthenticated, userRole: user?.role });

  // Show loading while checking auth state
  if (isLoading) {
    console.log('Index: isLoading is true, showing loading screen.');
    return <div>Loading...</div>;
  }
  
  // If user is authenticated, redirect based on role
  if (isAuthenticated && user) {
    console.log(`Index: Authenticated. User role is ${user.role}. Evaluating redirect.`);
    switch(user.role) {
      case 'admin':
        console.log('Index: Redirecting to /admin');
        return <Navigate to="/admin" replace />;
      case 'seller':
        console.log('Index: Redirecting to /seller');
        return <Navigate to="/seller" replace />;
      default:
        // For 'buyer' or other roles, show the home page.
        console.log(`Index: User role is '${user.role}'. Showing Home page.`);
        return <Home />;
    }
  }
  
  // If not authenticated, show the home page
  console.log('Index: Not authenticated. Showing Home page.');
  return <Home />;
};

export default Index;
