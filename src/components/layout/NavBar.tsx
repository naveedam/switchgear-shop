
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  NavigationMenu, 
  NavigationMenuContent, 
  NavigationMenuItem, 
  NavigationMenuLink, 
  NavigationMenuList, 
  NavigationMenuTrigger 
} from '@/components/ui/navigation-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { Search, ShoppingCart, Menu as MenuIcon, X, User } from 'lucide-react';
import AuthModal from '../auth/AuthModal';
import { fetchCategories } from '@/services/categoryService';
import { Category } from '@/types/category';
import { cn } from '@/lib/utils';

const NavBar: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const navigate = useNavigate();
  
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await fetchCategories();
        setCategories(data);
      } catch (error) {
        console.error('Failed to load categories:', error);
      }
    };
    
    loadCategories();
  }, []);
  
  const toggleSearch = () => {
    setIsSearchExpanded(!isSearchExpanded);
  };
  
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };
  
  const handleLogout = () => {
    logout();
    navigate('/');
  };
  
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };
  
  const getDashboardLink = () => {
    if (!user) return '/';
    
    switch (user.role) {
      case 'seller':
        return '/seller/dashboard';
      case 'admin':
        return '/admin/dashboard';
      case 'buyer':
      default:
        return '/buyer/dashboard';
    }
  };

  // Group categories into columns for the mega menu
  const categoryColumns = () => {
    const columns = [];
    const itemsPerColumn = 5;
    
    for (let i = 0; i < categories.length; i += itemsPerColumn) {
      columns.push(categories.slice(i, i + itemsPerColumn));
    }
    
    return columns;
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
                  SwitchgearNexus
                </span>
              </Link>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-4">
              <NavigationMenu>
                <NavigationMenuList>
                  <NavigationMenuItem>
                    <NavigationMenuTrigger>Products</NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <div className="grid grid-cols-3 w-[800px] gap-3 p-4">
                        {categoryColumns().map((column, idx) => (
                          <div key={idx} className="flex flex-col space-y-2">
                            {column.map(category => (
                              <Link
                                key={category.id}
                                to={`/categories/${category.slug}`}
                                className="block p-2 hover:bg-gray-100 rounded"
                              >
                                {category.name}
                              </Link>
                            ))}
                          </div>
                        ))}
                      </div>
                    </NavigationMenuContent>
                  </NavigationMenuItem>
                  <NavigationMenuItem>
                    <Link to="/categories" className={cn(
                      "flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
                    )}>
                      All Categories
                    </Link>
                  </NavigationMenuItem>
                  <NavigationMenuItem>
                    <Link to="/sellers" className={cn(
                      "flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
                    )}>
                      Sellers
                    </Link>
                  </NavigationMenuItem>
                  <NavigationMenuItem>
                    <Link to="/about" className={cn(
                      "flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
                    )}>
                      About
                    </Link>
                  </NavigationMenuItem>
                </NavigationMenuList>
              </NavigationMenu>
            </div>
            
            {/* Search Bar */}
            <div className={`hidden md:flex items-center ${isSearchExpanded ? 'w-64' : 'w-48'} transition-all duration-300`}>
              <div className="relative w-full">
                <Input 
                  placeholder="Search products..." 
                  className="pr-8"
                  onFocus={() => setIsSearchExpanded(true)}
                  onBlur={() => setIsSearchExpanded(false)}
                />
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="absolute right-0 top-0"
                  onClick={toggleSearch}
                >
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {/* User Menu */}
            <div className="hidden md:flex items-center space-x-4">
              <Link to="/cart">
                <Button variant="ghost" size="icon">
                  <ShoppingCart className="h-5 w-5" />
                </Button>
              </Link>
              
              {isAuthenticated ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user?.profileImage} alt={user?.name} />
                        <AvatarFallback>{user?.name ? getInitials(user.name) : 'U'}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate(getDashboardLink())}>
                      Dashboard
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/profile')}>
                      Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/orders')}>
                      Orders
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button onClick={() => setIsAuthModalOpen(true)}>
                  Sign In
                </Button>
              )}
            </div>
            
            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center">
              <Button variant="ghost" size="icon" onClick={toggleMobileMenu}>
                {isMobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <MenuIcon className="h-6 w-6" />
                )}
              </Button>
            </div>
          </nav>
          
          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-gray-200">
              <div className="flex items-center mb-4">
                <Input placeholder="Search products..." className="w-full" />
                <Button variant="ghost" size="icon" className="ml-2">
                  <Search className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="space-y-3">
                <div className="font-medium mb-2">Product Categories</div>
                {categories.slice(0, 8).map(category => (
                  <Link 
                    key={category.id}
                    to={`/categories/${category.slug}`} 
                    className="block text-gray-700 hover:text-brand-600"
                    onClick={toggleMobileMenu}
                  >
                    {category.name}
                  </Link>
                ))}
                <Link 
                  to="/categories"
                  className="block text-brand-600 font-medium"
                  onClick={toggleMobileMenu}
                >
                  View All Categories
                </Link>
                
                <div className="pt-4 border-t border-gray-200">
                  <Link 
                    to="/sellers" 
                    className="block text-gray-700 hover:text-brand-600"
                    onClick={toggleMobileMenu}
                  >
                    Sellers
                  </Link>
                  <Link 
                    to="/about" 
                    className="block text-gray-700 hover:text-brand-600"
                    onClick={toggleMobileMenu}
                  >
                    About
                  </Link>
                </div>
                
                <div className="pt-4 border-t border-gray-200">
                  <Link 
                    to="/cart" 
                    className="flex items-center text-gray-700 hover:text-brand-600"
                    onClick={toggleMobileMenu}
                  >
                    <ShoppingCart className="h-5 w-5 mr-2" />
                    Cart
                  </Link>
                </div>
                
                {isAuthenticated ? (
                  <div className="space-y-3 pt-4 border-t border-gray-200">
                    <Link 
                      to={getDashboardLink()} 
                      className="flex items-center text-gray-700 hover:text-brand-600"
                      onClick={toggleMobileMenu}
                    >
                      Dashboard
                    </Link>
                    <Link 
                      to="/profile" 
                      className="flex items-center text-gray-700 hover:text-brand-600"
                      onClick={toggleMobileMenu}
                    >
                      Profile
                    </Link>
                    <Link 
                      to="/orders" 
                      className="flex items-center text-gray-700 hover:text-brand-600"
                      onClick={toggleMobileMenu}
                    >
                      Orders
                    </Link>
                    <button 
                      className="flex items-center text-gray-700 hover:text-brand-600"
                      onClick={() => {
                        handleLogout();
                        toggleMobileMenu();
                      }}
                    >
                      Logout
                    </button>
                  </div>
                ) : (
                  <div className="pt-4 border-t border-gray-200">
                    <Button 
                      onClick={() => {
                        setIsAuthModalOpen(true);
                        toggleMobileMenu();
                      }}
                      className="w-full"
                    >
                      <User className="h-5 w-5 mr-2" />
                      Sign In
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </header>
      
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
      />
    </>
  );
};

export default NavBar;
