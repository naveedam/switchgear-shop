import { BrowserRouter as Router, Routes, Route, Outlet, Navigate } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import Home from './pages/Home';
import NotFound from './pages/NotFound';
import AdminDashboard from './pages/AdminDashboard';
import AdminProducts from './pages/admin/AdminProducts';
import AdminCategories from './pages/admin/AdminCategories';
import AdminSubcategories from './pages/admin/AdminSubcategories';
import AdminSellers from './pages/admin/AdminSellers';
import AdminSettings from './pages/admin/AdminSettings';
import EditProduct from './pages/admin/EditProduct';
import EditCategory from './pages/admin/EditCategory';
import SellerDashboard from './pages/SellerDashboard';
import ProductListingPage from './pages/ProductListingPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import AllCategories from './pages/AllCategories';

import { Toaster } from './components/ui/toaster';
import './App.css';
import { useAuth } from './contexts/AuthContext';

// Protected route component
const ProtectedRoute = ({ 
  children, 
  requiredRole 
}: { 
  children: JSX.Element, 
  requiredRole?: 'admin' | 'seller' | 'buyer' 
}) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  
  console.log("ProtectedRoute - isAuthenticated:", isAuthenticated, "user:", user, "requiredRole:", requiredRole);
  
  if (isLoading) {
    return <div>Loading...</div>;
  }
  
  if (!isAuthenticated) {
    console.log("User not authenticated, redirecting to login");
    return <Navigate to="/login" replace />;
  }
  
  if (requiredRole && user?.role !== requiredRole) {
    console.log("User role mismatch, redirecting to home");
    return <Navigate to="/" replace />;
  }
  
  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<MainLayout><Outlet /></MainLayout>}>
          <Route index element={<Home />} />
          <Route path="categories" element={<AllCategories />} />
          <Route path="categories/:categorySlug" element={<ProductListingPage />} />
        </Route>
        
        {/* Auth routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        
        {/* Admin routes - protected */}
        <Route 
          path="admin" 
          element={
            <ProtectedRoute requiredRole="admin">
              <MainLayout><Outlet /></MainLayout>
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="products/:id" element={<EditProduct />} />
          <Route path="categories" element={<AdminCategories />} />
          <Route path="categories/:id" element={<EditCategory />} />
          <Route path="subcategories" element={<AdminSubcategories />} />
          <Route path="sellers" element={<AdminSellers />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>
        
        {/* Seller routes - protected */}
        <Route 
          path="seller" 
          element={
            <ProtectedRoute requiredRole="seller">
              <MainLayout><Outlet /></MainLayout>
            </ProtectedRoute>
          }
        >
          <Route index element={<SellerDashboard />} />
        </Route>
        
        {/* Catch all */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster />
    </Router>
  );
}

export default App;
