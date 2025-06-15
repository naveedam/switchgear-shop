import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Menu as MenuIcon } from 'lucide-react';
import AuthModal from '../auth/AuthModal';
import NavCartButton from "./NavCartButton";
import NavUserMenu from "./NavUserMenu";
import NavProductsMenu from "./NavProductsMenu";

const NavBar: React.FC = () => {
  const { logout } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const handleLogout = () => {
    logout();
    
  };

  return (
    <>
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <nav className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex-shrink-0">
              <Link to="/" className="flex items-center">
                <span className="text-xl font-bold text-brand-700">
                  SwitchgearShop
                </span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-4">
              <NavProductsMenu />
            </div>

            {/* Search Bar */}
            <div className="hidden md:flex items-center w-48">
              <div className="relative w-full">
                <Input
                  placeholder="Search products..."
                  className="pr-8"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0"
                >
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* User Menu and Cart */}
            <div className="hidden md:flex items-center space-x-2">
              <NavCartButton />
              <NavUserMenu
                onSignIn={() => setIsAuthModalOpen(true)}
                onLogout={handleLogout}
              />
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center">
              <Button variant="ghost" size="icon">
                <MenuIcon className="h-6 w-6" />
              </Button>
            </div>
          </nav>
          
        </div>
      </header>
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </>
  );
};

export default NavBar;
