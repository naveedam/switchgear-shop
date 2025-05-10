
import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import Home from './pages/Home';
import NotFound from './pages/NotFound';
import AdminDashboard from './pages/AdminDashboard';
import AdminProducts from './pages/admin/AdminProducts';
import AdminCategories from './pages/admin/AdminCategories';
import AdminSubcategories from './pages/admin/AdminSubcategories';
import AdminSellers from './pages/admin/AdminSellers';
import AdminSettings from './pages/admin/AdminSettings';
import SellerDashboard from './pages/SellerDashboard';
import ProductListingPage from './pages/ProductListingPage';

// For root path handling
import Index from './pages/Index';

import { Toaster } from './components/ui/toaster';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<MainLayout><Outlet /></MainLayout>}>
          <Route index element={<Home />} />
          <Route path="categories/:categorySlug" element={<ProductListingPage />} />
          <Route path="*" element={<NotFound />} />
        </Route>

        {/* Admin routes */}
        <Route path="admin" element={<MainLayout><Outlet /></MainLayout>}>
          <Route index element={<AdminDashboard />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="categories" element={<AdminCategories />} />
          <Route path="subcategories" element={<AdminSubcategories />} />
          <Route path="sellers" element={<AdminSellers />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>
        
        {/* Seller routes */}
        <Route path="seller" element={<MainLayout><Outlet /></MainLayout>}>
          <Route index element={<SellerDashboard />} />
        </Route>
      </Routes>
      <Toaster />
    </Router>
  );
}

export default App;
