
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Users, 
  Store, 
  Settings, 
  Shield, 
  FileText,
  BarChart,
  Box,
  Image,
  Package,
  Building,
  ShoppingCart
} from 'lucide-react';

const menuItems = [
  {
    name: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
  },
  {
    name: 'Products',
    href: '/admin/products',
    icon: ShoppingBag,
  },
  {
    name: 'Orders',
    href: '/admin/orders',
    icon: Box,
  },
  {
    name: 'Carts',
    href: '/admin/carts',
    icon: ShoppingCart,
  },
  {
    name: 'Categories',
    href: '/admin/categories',
    icon: FileText,
  },
  {
    name: 'Subcategories',
    href: '/admin/subcategories',
    icon: FileText,
  },
  {
    name: 'AI Images',
    href: '/admin/ai-images',
    icon: Image,
  },
  {
    name: 'AI Products',
    href: '/admin/ai-products',
    icon: Package,
  },
  {
    name: 'AI Vendors',
    href: '/admin/ai-vendors',
    icon: Building,
  },
  {
    name: 'Users',
    href: '/admin/users',
    icon: Users,
  },
  {
    name: 'Sellers',
    href: '/admin/sellers',
    icon: Store,
  },
  {
    name: 'Analytics',
    href: '/admin/analytics',
    icon: BarChart,
  },
  {
    name: 'Settings',
    href: '/admin/settings',
    icon: Settings,
  },
  {
    name: 'Permissions',
    href: '/admin/permissions',
    icon: Shield,
  },
  {
    name: 'Reports',
    href: '/admin/reports',
    icon: FileText,
  },
];

const AdminSidebar: React.FC = () => {
  const { pathname } = useLocation();
  
  return (
    <div className="h-full py-8 px-4">
      <div className="mb-8">
        <h2 className="text-lg font-bold text-gray-900">Admin Console</h2>
        <p className="text-sm text-gray-500">Manage your marketplace</p>
      </div>
      
      <nav className="space-y-1">
        {menuItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "flex items-center px-3 py-2 text-sm font-medium rounded-md",
                isActive
                  ? "bg-industrial-50 text-industrial-700"
                  : "text-gray-700 hover:bg-gray-100"
              )}
            >
              <item.icon 
                className={cn(
                  "mr-3 h-5 w-5",
                  isActive ? "text-industrial-500" : "text-gray-400"
                )} 
              />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export default AdminSidebar;
