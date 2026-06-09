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
import AdminEscrow from './pages/admin/AdminEscrow';
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
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import AllCategories from './pages/AllCategories';
import BrandsPage from './pages/BrandsPage';
import AdminOrders from './pages/admin/AdminOrders';
import AdminRfqs from './pages/admin/AdminRfqs';
import AdminUsers from './pages/admin/AdminUsers';
import AdminAnalytics from './pages/admin/AdminAnalytics';
import AdminPermissions from './pages/admin/AdminPermissions';
import AdminReports from './pages/admin/AdminReports';
import CheckoutPage from './pages/CheckoutPage';
import SellerProducts from './pages/SellerProducts';
import SellerOrders from './pages/SellerOrders';
import SellerInvoices from './pages/SellerInvoices';
import SellerSettlements from './pages/seller/SellerSettlements';
import SellerInventory from './pages/seller/SellerInventory';
import AdminProductRequests from './pages/admin/AdminProductRequests';
import ProfilePage from './pages/ProfilePage';
import OrdersPage from './pages/OrdersPage';
import SellersPage from './pages/SellersPage';
import OrderSuccessPage from './pages/OrderSuccessPage';
import ContactPage from './pages/ContactPage';
import PanelBuildingPage from './pages/applications/PanelBuildingPage';
import PowerDistributionPage from './pages/applications/PowerDistributionPage';
import MotorControlCentersPage from './pages/applications/MotorControlCentersPage';
import EnergyManagementPage from './pages/applications/EnergyManagementPage';
import IndustrialAutomationPage from './pages/applications/IndustrialAutomationPage';
import AllApplicationsPage from './pages/applications/AllApplicationsPage';
import BomUploadPage from './pages/buyer/BomUploadPage';
import BuyerRfqsPage from './pages/buyer/BuyerRfqsPage';
import RfqCreatePage from './pages/buyer/RfqCreatePage';
import RfqDetailPage from './pages/buyer/RfqDetailPage';
import ProjectsPage from './pages/buyer/ProjectsPage';
import ProjectDetailPage from './pages/buyer/ProjectDetailPage';
import SellerRfqsPage from './pages/seller/SellerRfqsPage';
import SellerQuotePage from './pages/seller/SellerQuotePage';



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
            <Route path="products" element={<ProductListingPage />} />
            <Route path="brands" element={<BrandsPage />} />
            <Route path="products/:productSlug" element={<ProductDetailPage />} />
            
            {/* Application pages */}
            <Route path="applications" element={<AllApplicationsPage />} />
            <Route path="applications/panel-building" element={<PanelBuildingPage />} />
            <Route path="applications/power-distribution" element={<PowerDistributionPage />} />
            <Route path="applications/motor-control-centers" element={<MotorControlCentersPage />} />
            <Route path="applications/energy-management" element={<EnergyManagementPage />} />
            <Route path="applications/industrial-automation" element={<IndustrialAutomationPage />} />
            
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
             <Route path="buyer/bom/upload" element={
               <ProtectedRoute>
                 <BomUploadPage />
               </ProtectedRoute>
             } />
             <Route path="buyer/boms" element={
               <ProtectedRoute>
                 <BuyerRfqsPage />
               </ProtectedRoute>
             } />
             <Route path="buyer/rfqs" element={
               <ProtectedRoute>
                 <BuyerRfqsPage />
               </ProtectedRoute>
             } />
             <Route path="buyer/rfq/create/:bomId" element={
               <ProtectedRoute>
                 <RfqCreatePage />
               </ProtectedRoute>
             } />
             <Route path="buyer/rfqs/:rfqId" element={
               <ProtectedRoute>
                 <RfqDetailPage />
               </ProtectedRoute>
             } />
             <Route path="buyer/projects" element={
               <ProtectedRoute>
                 <ProjectsPage />
               </ProtectedRoute>
             } />
             <Route path="buyer/projects/:projectId" element={
               <ProtectedRoute>
                 <ProjectDetailPage />
               </ProtectedRoute>
             } />
          </Route>
          
          {/* Auth routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          
          {/* Cart and checkout routes */}
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/order-success" element={<OrderSuccessPage />} />
          <Route path="/seed-catalog-2" element={
            <ProtectedRoute requiredRole="admin">
              <div />
            </ProtectedRoute>
          } />
          <Route path="/seed-catalog-3" element={
            <ProtectedRoute requiredRole="admin">
              <SeedCatalog3 />
            </ProtectedRoute>
          } />
          

          
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
            <Route path="rfqs" element={<AdminRfqs />} />
            <Route path="escrow" element={<AdminEscrow />} />
            <Route path="carts" element={<AdminCarts />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="users/:id" element={<EditUser />} />
            <Route path="sellers" element={<AdminSellers />} />
            <Route path="sellers/:id" element={<EditSeller />} />
            <Route path="product-requests" element={<AdminProductRequests />} />
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
            <Route path="inventory" element={<SellerInventory />} />
            <Route path="orders" element={<SellerOrders />} />
            <Route path="invoices" element={<SellerInvoices />} />
            <Route path="settlements" element={<SellerSettlements />} />
            <Route path="rfqs" element={<SellerRfqsPage />} />
            <Route path="rfq/:rfqId/quote" element={<SellerQuotePage />} />
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
