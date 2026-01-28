import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Menu as MenuIcon, X } from 'lucide-react';
import AuthModal from '../auth/AuthModal';
import NavCartButton from "./NavCartButton";
import NavUserMenu from "./NavUserMenu";
import NavProductsMenu from "./NavProductsMenu";
import { useAuth } from '@/contexts/AuthContext';
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '@/components/ui/sheet';

const NavBar: React.FC = () => {
  const { logout } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const handleLogout = () => {
    logout();
  };

  return (
    <>
      <header className="bg-background/95 backdrop-blur-sm border-b border-border sticky top-0 z-50">
        <div className="container-wide">
          <nav className="flex items-center justify-between h-16 md:h-18">
            {/* Logo */}
            <div className="flex-shrink-0">
              <Link to="/" className="flex items-center">
                <span className="text-xl font-bold text-primary">
                  SwitchgearShop
                </span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-1">
              <NavProductsMenu />
            </div>

            {/* Search Bar - Desktop */}
            <div className="hidden md:flex items-center flex-1 max-w-lg mx-8">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by brand, model, or rating (e.g. Schneider 160A MCCB)"
                  className="pl-10 h-10 bg-secondary/50 border-border focus:bg-background transition-colors text-sm"
                />
              </div>
            </div>

            {/* User Menu and Cart - Desktop */}
            <div className="hidden md:flex items-center space-x-2">
              <NavCartButton />
              <NavUserMenu
                onSignIn={() => setIsAuthModalOpen(true)}
                onLogout={handleLogout}
              />
            </div>

            {/* Mobile Menu */}
            <div className="flex md:hidden items-center space-x-2">
              <NavCartButton />
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MenuIcon className="h-6 w-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-80 p-0">
                  <div className="flex flex-col h-full">
                    <div className="p-4 border-b border-border">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search by brand, model, or rating..."
                          className="pl-10 text-sm"
                        />
                      </div>
                    </div>
                    <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                      {/* Main Links */}
                      <SheetClose asChild>
                        <Link 
                          to="/products" 
                          className="block px-4 py-3 rounded-lg hover:bg-secondary text-foreground font-medium"
                        >
                          All Products
                        </Link>
                      </SheetClose>
                      <SheetClose asChild>
                        <Link 
                          to="/applications" 
                          className="block px-4 py-3 rounded-lg hover:bg-secondary text-foreground font-medium"
                        >
                          Applications
                        </Link>
                      </SheetClose>
                      <SheetClose asChild>
                        <Link 
                          to="/brands" 
                          className="block px-4 py-3 rounded-lg hover:bg-secondary text-foreground font-medium"
                        >
                          Brands
                        </Link>
                      </SheetClose>
                      <SheetClose asChild>
                        <Link 
                          to="/sellers" 
                          className="block px-4 py-3 rounded-lg hover:bg-secondary text-foreground font-medium"
                        >
                          Sellers
                        </Link>
                      </SheetClose>
                      <SheetClose asChild>
                        <Link 
                          to="/about" 
                          className="block px-4 py-3 rounded-lg hover:bg-secondary text-foreground font-medium"
                        >
                          About
                        </Link>
                      </SheetClose>

                      {/* Quick Access Section */}
                      <div className="pt-4 mt-4 border-t border-border">
                        <span className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          Quick Access
                        </span>
                        <div className="mt-2 space-y-1">
                          <SheetClose asChild>
                            <Link 
                              to="/products?subcategory=mccb" 
                              className="block px-4 py-2.5 rounded-lg hover:bg-secondary text-foreground text-sm"
                            >
                              MCCBs
                            </Link>
                          </SheetClose>
                          <SheetClose asChild>
                            <Link 
                              to="/products?subcategory=contactors" 
                              className="block px-4 py-2.5 rounded-lg hover:bg-secondary text-foreground text-sm"
                            >
                              Contactors
                            </Link>
                          </SheetClose>
                          <SheetClose asChild>
                            <Link 
                              to="/products?subcategory=control-relays" 
                              className="block px-4 py-2.5 rounded-lg hover:bg-secondary text-foreground text-sm"
                            >
                              Control Relays
                            </Link>
                          </SheetClose>
                          <SheetClose asChild>
                            <Link 
                              to="/products?subcategory=energy-meters" 
                              className="block px-4 py-2.5 rounded-lg hover:bg-secondary text-foreground text-sm"
                            >
                              Energy Meters
                            </Link>
                          </SheetClose>
                        </div>
                      </div>

                      {/* Categories Section */}
                      <div className="pt-4 mt-4 border-t border-border">
                        <span className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          Categories
                        </span>
                        <div className="mt-2 space-y-1">
                          <SheetClose asChild>
                            <Link 
                              to="/products?category=low-voltage-switchgear" 
                              className="block px-4 py-2.5 rounded-lg hover:bg-secondary text-foreground text-sm"
                            >
                              Low Voltage Switchgear
                            </Link>
                          </SheetClose>
                          <SheetClose asChild>
                            <Link 
                              to="/products?category=control-motor-protection" 
                              className="block px-4 py-2.5 rounded-lg hover:bg-secondary text-foreground text-sm"
                            >
                              Control & Motor Protection
                            </Link>
                          </SheetClose>
                          <SheetClose asChild>
                            <Link 
                              to="/products?category=measurement-instrumentation" 
                              className="block px-4 py-2.5 rounded-lg hover:bg-secondary text-foreground text-sm"
                            >
                              Measurement & Instrumentation
                            </Link>
                          </SheetClose>
                          <SheetClose asChild>
                            <Link 
                              to="/categories" 
                              className="block px-4 py-2.5 rounded-lg hover:bg-secondary text-primary text-sm font-medium"
                            >
                              View All Categories →
                            </Link>
                          </SheetClose>
                        </div>
                      </div>
                    </nav>
                    <div className="p-4 border-t border-border space-y-2">
                      <Button 
                        onClick={() => setIsAuthModalOpen(true)} 
                        className="w-full"
                      >
                        Sign In
                      </Button>
                      <Button 
                        variant="outline" 
                        className="w-full"
                        asChild
                      >
                        <Link to="/register">Create Account</Link>
                      </Button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </nav>
        </div>
      </header>
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </>
  );
};

export default NavBar;
