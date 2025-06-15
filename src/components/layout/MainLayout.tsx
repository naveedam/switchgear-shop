import React from 'react';
import NavBar from './NavBar';
import Footer from './Footer';
import { Toaster } from '@/components/ui/toaster';
import { useAuth } from '@/contexts/AuthContext';
import SellerSidebar from './SellerSidebar';
import AdminSidebar from './AdminSidebar';
import CartButton from '../cart/CartButton';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { user } = useAuth();
  
  const renderSidebar = () => {
    if (!user) return null;
    
    if (user.role === 'seller') {
      return <SellerSidebar />;
    } else if (user.role === 'admin') {
      return <AdminSidebar />;
    }
    
    return null;
  };
  
  const sidebar = renderSidebar();
  
  return (
    <div className="flex flex-col min-h-screen">
      <NavBar 
        rightContent={<CartButton />}
      />
      <div className="flex flex-1">
        {sidebar && (
          <div className="hidden md:block w-64 bg-white border-r border-gray-200">
            {sidebar}
          </div>
        )}
        <main className="flex-1">
          {children}
        </main>
      </div>
      <Footer />
      <Toaster />
    </div>
  );
};

export default MainLayout;
