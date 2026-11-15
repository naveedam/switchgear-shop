import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { PanelLeft } from 'lucide-react';
import NavBar from './NavBar';
import Footer from './Footer';
import { Toaster } from '@/components/ui/toaster';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useAuth } from '@/contexts/AuthContext';
import SellerSidebar from './SellerSidebar';
import AdminSidebar from './AdminSidebar';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  // Close the phone menu after navigating.
  useEffect(() => setMenuOpen(false), [location.pathname]);

  const role = user?.role;
  const sidebar = role === 'seller' ? <SellerSidebar /> : role === 'admin' ? <AdminSidebar /> : null;
  const menuLabel = role === 'seller' ? 'Seller menu' : 'Admin menu';

  return (
    <div className="flex flex-col min-h-screen">
      <NavBar />

      {sidebar && (
        <div className="md:hidden sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <button
                type="button"
                className="flex w-full items-center gap-2 px-4 h-11 text-sm font-medium text-foreground"
              >
                <PanelLeft className="h-4 w-4" aria-hidden="true" />
                {menuLabel}
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[85vw] max-w-xs p-0 overflow-y-auto">
              <SheetHeader className="sr-only"><SheetTitle>{menuLabel}</SheetTitle></SheetHeader>
              {sidebar}
            </SheetContent>
          </Sheet>
        </div>
      )}

      <div className="flex flex-1 min-w-0">
        {sidebar && (
          <aside className="hidden md:block w-64 shrink-0 bg-background border-r border-border">
            <div className="sticky top-0 max-h-screen overflow-y-auto">{sidebar}</div>
          </aside>
        )}
        {/* min-w-0 lets wide tables scroll inside the page instead of widening it */}
        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>
      <Footer />
      <Toaster />
    </div>
  );
};

export default MainLayout;
