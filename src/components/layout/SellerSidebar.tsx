
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingBag, 
  FileText,
  Wallet,
  MessageSquare,
  BarChart, 
  Settings, 
  HelpCircle
} from 'lucide-react';

const menuItems = [
  {
    name: 'Dashboard',
    href: '/seller/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: 'Products',
    href: '/seller/products',
    icon: Package,
  },
  {
    name: 'Orders',
    href: '/seller/orders',
    icon: ShoppingBag,
  },
  {
    name: 'Invoices',
    href: '/seller/invoices',
    icon: FileText,
  },
  {
    name: 'Settlements',
    href: '/seller/settlements',
    icon: Wallet,
  },
  {
    name: 'RFQs',
    href: '/seller/rfqs',
    icon: MessageSquare,
  },
  {
    name: 'Analytics',
    href: '/seller/analytics',
    icon: BarChart,
  },
  {
    name: 'Settings',
    href: '/seller/settings',
    icon: Settings,
  },
  {
    name: 'Help',
    href: '/support',
    icon: HelpCircle,
  },
];

const SellerSidebar: React.FC = () => {
  const { pathname } = useLocation();
  
  return (
    <div className="h-full py-8 px-4">
      <div className="mb-8">
        <h2 className="text-lg font-bold text-gray-900">Seller Dashboard</h2>
        <p className="text-sm text-gray-500">Manage your products and sales</p>
      </div>
      
      <nav className="space-y-1">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "flex items-center px-3 py-2 text-sm font-medium rounded-md",
                isActive
                  ? "bg-brand-50 text-brand-700"
                  : "text-gray-700 hover:bg-gray-100"
              )}
            >
              <item.icon 
                className={cn(
                  "mr-3 h-5 w-5",
                  isActive ? "text-brand-500" : "text-gray-400"
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

export default SellerSidebar;
