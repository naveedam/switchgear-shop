import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet, Navigate } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import Index from './pages/Index';
import NotFound from './pages/NotFound';
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const AdminProducts = lazy(() => import('./pages/admin/AdminProducts'));
const AdminCategories = lazy(() => import('./pages/admin/AdminCategories'));
const AdminSubcategories = lazy(() => import('./pages/admin/AdminSubcategories'));
const AdminSellers = lazy(() => import('./pages/admin/AdminSellers'));
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings'));
const AdminAIImages = lazy(() => import('./pages/admin/AdminAIImages'));
const AdminAIProducts = lazy(() => import('./pages/admin/AdminAIProducts'));
const AdminAIVendors = lazy(() => import('./pages/admin/AdminAIVendors'));
const CatalogIngestion = lazy(() => import('./pages/admin/CatalogIngestion'));
const AdminCarts = lazy(() => import('./pages/admin/AdminCarts'));
const AdminEscrow = lazy(() => import('./pages/admin/AdminEscrow'));
const EditProduct = lazy(() => import('./pages/admin/EditProduct'));
const EditCategory = lazy(() => import('./pages/admin/EditCategory'));
const EditSubcategory = lazy(() => import('./pages/admin/EditSubcategory'));
const EditUser = lazy(() => import('./pages/admin/EditUser'));
const EditSeller = lazy(() => import('./pages/admin/EditSeller'));
const SellerDashboard = lazy(() => import('./pages/SellerDashboard'));
const ProductListingPage = lazy(() => import('./pages/ProductListingPage'));
const ProductDetailPage = lazy(() => import('./pages/ProductDetailPage'));
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/auth/ResetPasswordPage'));
const AllCategories = lazy(() => import('./pages/AllCategories'));
const BrandsPage = lazy(() => import('./pages/BrandsPage'));
const AdminOrders = lazy(() => import('./pages/admin/AdminOrders'));
const AdminRfqs = lazy(() => import('./pages/admin/AdminRfqs'));
const RfqIntake = lazy(() => import('./pages/admin/RfqIntake'));
const RfqCompare = lazy(() => import('./pages/admin/RfqCompare'));
const AdminBuyerOutreach = lazy(() => import('./pages/admin/AdminBuyerOutreach'));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'));
const AdminAnalytics = lazy(() => import('./pages/admin/AdminAnalytics'));
const AdminPermissions = lazy(() => import('./pages/admin/AdminPermissions'));
const AdminReports = lazy(() => import('./pages/admin/AdminReports'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'));
const SellerProducts = lazy(() => import('./pages/SellerProducts'));
const SellerOrders = lazy(() => import('./pages/SellerOrders'));
const SellerInvoices = lazy(() => import('./pages/SellerInvoices'));
const SellerSettlements = lazy(() => import('./pages/seller/SellerSettlements'));
const SellerInventory = lazy(() => import('./pages/seller/SellerInventory'));
const AdminProductRequests = lazy(() => import('./pages/admin/AdminProductRequests'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const OrdersPage = lazy(() => import('./pages/OrdersPage'));
const SellersPage = lazy(() => import('./pages/SellersPage'));
const OrderSuccessPage = lazy(() => import('./pages/OrderSuccessPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const PanelBuildingPage = lazy(() => import('./pages/applications/PanelBuildingPage'));
const PowerDistributionPage = lazy(() => import('./pages/applications/PowerDistributionPage'));
const MotorControlCentersPage = lazy(() => import('./pages/applications/MotorControlCentersPage'));
const EnergyManagementPage = lazy(() => import('./pages/applications/EnergyManagementPage'));
const IndustrialAutomationPage = lazy(() => import('./pages/applications/IndustrialAutomationPage'));
const AllApplicationsPage = lazy(() => import('./pages/applications/AllApplicationsPage'));
const BomUploadPage = lazy(() => import('./pages/buyer/BomUploadPage'));
const BuyerRfqsPage = lazy(() => import('./pages/buyer/BuyerRfqsPage'));
const RfqCreatePage = lazy(() => import('./pages/buyer/RfqCreatePage'));
const RfqDetailPage = lazy(() => import('./pages/buyer/RfqDetailPage'));
const ProjectsPage = lazy(() => import('./pages/buyer/ProjectsPage'));
const ProjectDetailPage = lazy(() => import('./pages/buyer/ProjectDetailPage'));
const SellerRfqsPage = lazy(() => import('./pages/seller/SellerRfqsPage'));
const SellerQuotePage = lazy(() => import('./pages/seller/SellerQuotePage'));
const ServicesPage = lazy(() => import('./pages/services/ServicesPage'));
const ServiceRequestPage = lazy(() => import('./pages/services/ServiceRequestPage'));
const ServiceJoinPage = lazy(() => import('./pages/services/ServiceJoinPage'));
const AdminServices = lazy(() => import('./pages/admin/AdminServices'));
const BrandDetailPage = lazy(() => import('./pages/BrandDetailPage'));
const AdminTrust = lazy(() => import('./pages/admin/AdminTrust'));
const SellerPricingTrust = lazy(() => import('./pages/seller/SellerPricingTrust'));




import { Toaster } from './components/ui/toaster';
import './App.css';
import { useAuth } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
const CartPage = lazy(() => import('./pages/CartPage'));

const PageLoader = () => (
  <div className="min-h-[50vh] flex items-center justify-center">
    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" aria-label="Loading" />
  </div>
);

// Protected route component
const ProtectedRoute = ({ 
  children, 
  requiredRole 
}: { 
  children: JSX.Element, 
  requiredRole?: 'admin' | 'seller' | 'buyer' 
}) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  
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
    return <Navigate to="/login" replace />;
  }
  
  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

function App() {
  return (
    <CartProvider>
      <Router>
        <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<MainLayout><Suspense fallback={<PageLoader />}><Outlet /></Suspense></MainLayout>}>
            <Route index element={<Index />} />
            <Route path="sellers" element={<SellersPage />} />
            <Route path="contact" element={<ContactPage />} />
            <Route path="services" element={<ServicesPage />} />
            <Route path="services/request" element={<ServiceRequestPage />} />
            <Route path="services/join" element={<ServiceJoinPage />} />
            <Route path="categories" element={<AllCategories />} />
            <Route path="categories/:categorySlug" element={<ProductListingPage />} />
            <Route path="products" element={<ProductListingPage />} />
            <Route path="brands" element={<BrandsPage />} />
            <Route path="brands/:brandSlug" element={<BrandDetailPage />} />
            <Route path="brands/:brandSlug/:categorySlug" element={<BrandDetailPage />} />
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
          

          
          {/* Admin routes - protected */}
          <Route 
            path="admin" 
            element={
              <ProtectedRoute requiredRole="admin">
                <MainLayout><Suspense fallback={<PageLoader />}><Outlet /></Suspense></MainLayout>
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
            <Route path="rfq-intake" element={<RfqIntake />} />
            <Route path="services" element={<AdminServices />} />
            <Route path="rfqs/:rfqId" element={<RfqCompare />} />
            <Route path="escrow" element={<AdminEscrow />} />
            <Route path="trust" element={<AdminTrust />} />
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
            <Route path="buyer-outreach" element={<AdminBuyerOutreach />} />
            <Route path="ai-vendors" element={<AdminAIVendors />} />
            <Route path="catalog-ingestion" element={<CatalogIngestion />} />
          </Route>
          
          {/* Seller routes - protected */}
          <Route 
            path="seller" 
            element={
              <ProtectedRoute requiredRole="seller">
                <MainLayout><Suspense fallback={<PageLoader />}><Outlet /></Suspense></MainLayout>
              </ProtectedRoute>
            }
          >
            <Route index element={<SellerDashboard />} />
            <Route path="products" element={<SellerProducts />} />
            <Route path="inventory" element={<SellerInventory />} />
            <Route path="orders" element={<SellerOrders />} />
            <Route path="invoices" element={<SellerInvoices />} />
            <Route path="settlements" element={<SellerSettlements />} />
            <Route path="pricing" element={<SellerPricingTrust />} />
            <Route path="rfqs" element={<SellerRfqsPage />} />
            <Route path="rfq/:rfqId/quote" element={<SellerQuotePage />} />
          </Route>

          {/* Catch all */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        </Suspense>
        <Toaster />
      </Router>
    </CartProvider>
  );
}

export default App;
