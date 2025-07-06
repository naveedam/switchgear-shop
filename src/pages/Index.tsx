
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Home from './Home';

const Index = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  
  console.log('Index page render:', { 
    isLoading, 
    isAuthenticated, 
    userRole: user?.role,
    userEmail: user?.email,
    userName: user?.name,
    userObject: user
  });

  // Show loading while checking auth state
  if (isLoading) {
    console.log('Index: isLoading is true, showing loading screen.');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }
  
  // If user is authenticated and has a role, redirect based on role
  if (isAuthenticated && user && user.role) {
    console.log(`Index: Authenticated user ${user.email} with role ${user.role}. Evaluating redirect.`);
    
    // Special handling for admin users
    if (user.role === 'admin') {
      console.log('Index: Admin user detected, redirecting to /admin');
      return <Navigate to="/admin" replace />;
    }
    
    if (user.role === 'seller') {
      console.log('Index: Seller user detected, redirecting to /seller');
      return <Navigate to="/seller" replace />;
    }
    
    // For 'buyer' or other roles, show the home page
    console.log(`Index: User role is '${user.role}'. Showing Home page.`);
    return <Home />;
  }
  
  // If authenticated but no role yet, show loading
  if (isAuthenticated && user && !user.role) {
    console.log('Index: User authenticated but role not loaded yet, showing loading');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading user profile...</p>
        </div>
      </div>
    );
  }
  
  // If not authenticated, show the home page
  console.log('Index: Not authenticated. Showing Home page.');
  return <Home />;
};

export default Index;
