import { BrowserRouter as Router, Routes, Route, Outlet, Navigate } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import Index from './pages/Index';
import NotFound from './pages/NotFound';
import AdminDashboard from './pages/AdminDashboard';
import AdminProducts from './pages/admin/AdminProducts';
import AdminCategories from './pages/admin/AdminCategories';
import AdminSubcategories from './pages/admin/AdminSubcategories';
import AdminSellers from './pages/admin/AdminSellers';
import AdminSettings from './pages/admin/AdminSettings';
import AdminAIImages from './pages/admin/AdminAIImages';
import AdminAIProducts from './pages/admin/AdminAIProducts';
import AdminAIVendors from './pages/admin/AdminAIVendors';
import AdminCarts from './pages/admin/AdminCarts';
import EditProduct from './pages/admin/EditProduct';
import EditCategory from './pages/admin/EditCategory';
import EditSubcategory from './pages/admin/EditSubcategory';
import EditUser from './pages/admin/EditUser';
import EditSeller from './pages/admin/EditSeller';
import SellerDashboard from './pages/SellerDashboard';
import ProductListingPage from './pages/ProductListingPage';
import ProductDetailPage from './pages/ProductDetailPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import AllCategories from './pages/AllCategories';
import AdminOrders from './pages/admin/AdminOrders';
import AdminUsers from './pages/admin/AdminUsers';
import AdminAnalytics from './pages/admin/AdminAnalytics';
import AdminPermissions from './pages/admin/AdminPermissions';
import AdminReports from './pages/admin/AdminReports';
import CheckoutPage from './pages/CheckoutPage';
import SellerProducts from './pages/SellerProducts';
import SellerOrders from './pages/SellerOrders';
import ProfilePage from './pages/ProfilePage';
import OrdersPage from './pages/OrdersPage';
import SellersPage from './pages/SellersPage';
import OrderSuccessPage from './pages/OrderSuccessPage';
import ContactPage from './pages/ContactPage';

import { Toaster } from './components/ui/toaster';
import './App.css';
import { useAuth } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import CartPage from './pages/CartPage';

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
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
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
    <CartProvider>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<MainLayout><Outlet /></MainLayout>}>
            <Route index element={<Index />} />
            <Route path="sellers" element={<SellersPage />} />
            <Route path="contact" element={<ContactPage />} />
            <Route path="categories" element={<AllCategories />} />
            <Route path="categories/:categorySlug" element={<ProductListingPage />} />
            <Route path="products/:productSlug" element={<ProductDetailPage />} />
            <Route path="profile" element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            } />
            <Route path="orders" element={
              <ProtectedRoute>
                <OrdersPage />
              </ProtectedRoute>
            } />
          </Route>
          
          {/* Auth routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
          {/* Cart and checkout routes */}
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/order-success" element={<OrderSuccessPage />} />
          
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
            <Route path="subcategories/:id" element={<EditSubcategory />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="carts" element={<AdminCarts />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="users/:id" element={<EditUser />} />
            <Route path="sellers" element={<AdminSellers />} />
            <Route path="sellers/:id" element={<EditSeller />} />
            <Route path="analytics" element={<AdminAnalytics />} />
            <Route path="settings" element={<AdminSettings />} />
            <Route path="permissions" element={<AdminPermissions />} />
            <Route path="reports" element={<AdminReports />} />
            <Route path="ai-images" element={<AdminAIImages />} />
            <Route path="ai-products" element={<AdminAIProducts />} />
            <Route path="ai-vendors" element={<AdminAIVendors />} />
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
            <Route path="products" element={<SellerProducts />} />
            <Route path="orders" element={<SellerOrders />} />
          </Route>

          {/* Catch all */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Toaster />
      </Router>
    </CartProvider>
  );
}

export default App;
