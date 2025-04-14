
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import StatCard from '@/components/dashboard/StatCard';
import RecentOrdersTable from '@/components/dashboard/RecentOrdersTable';
import SalesChart from '@/components/dashboard/SalesChart';
import { Package, DollarSign, ShoppingCart, Users } from 'lucide-react';
import { Order } from '@/types/order';

// Mock data for seller dashboard
const mockSalesData = [
  { date: 'Jan', revenue: 4500, orders: 15 },
  { date: 'Feb', revenue: 6200, orders: 21 },
  { date: 'Mar', revenue: 7800, orders: 28 },
  { date: 'Apr', revenue: 5300, orders: 19 },
  { date: 'May', revenue: 9000, orders: 32 },
  { date: 'Jun', revenue: 10200, orders: 36 },
  { date: 'Jul', revenue: 8700, orders: 29 },
];

const mockRecentOrders: Order[] = Array.from({ length: 5 }, (_, i) => ({
  id: `ORD${10000 + i}`,
  buyerId: `buyer-${i + 1}`,
  buyerName: `Customer ${i + 1}`,
  sellerId: '2', // Seller's ID
  sellerName: 'ElectroTech Industries',
  items: [
    {
      id: `item-${i}-1`,
      productId: `prod-${i + 1}`,
      productName: `Circuit Breaker ${100 + i}`,
      productImage: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&w=100&h=100',
      sku: `CB-${100 + i}`,
      quantity: i + 1,
      unitPrice: 349.99,
      totalPrice: 349.99 * (i + 1),
    }
  ],
  subtotal: 349.99 * (i + 1),
  tax: 0.08 * 349.99 * (i + 1),
  shippingDetails: {
    address: {
      street: '123 Main St',
      city: 'Anytown',
      state: 'CA',
      zipCode: '12345',
      country: 'USA',
    },
    method: 'Standard Shipping',
    shippingCost: 25,
  },
  paymentDetails: {
    method: 'credit_card',
    status: 'completed',
    transactionId: `tx-${i + 1}`,
    amount: 349.99 * (i + 1) + 0.08 * 349.99 * (i + 1) + 25,
    currency: 'USD',
    paidAt: new Date(Date.now() - i * 86400000), // Days ago
  },
  totalAmount: 349.99 * (i + 1) + 0.08 * 349.99 * (i + 1) + 25,
  status: ['delivered', 'shipped', 'processing', 'pending_payment', 'canceled'][i % 5] as any,
  createdAt: new Date(Date.now() - i * 86400000), // Days ago
  updatedAt: new Date(Date.now() - i * 43200000), // Half-days ago
}));

const SellerDashboard: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Check if user is authenticated and is a seller
    if (!isLoading && (!isAuthenticated || (user && user.role !== 'seller'))) {
      navigate('/login');
    }
    
    // Simulate data loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [isAuthenticated, user, navigate, isLoading]);
  
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="dashboard-container">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Seller Dashboard</h1>
        <p className="text-gray-600">Welcome back, {user?.name}</p>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard 
          title="Total Products"
          value="24"
          description="Active products in your catalog"
          icon={Package}
          trend={{ value: 12, isPositive: true }}
        />
        <StatCard 
          title="Revenue"
          value="$12,450"
          description="Total sales this month"
          icon={DollarSign}
          colorClass="text-green-600"
          trend={{ value: 8.2, isPositive: true }}
        />
        <StatCard 
          title="Orders"
          value="38"
          description="Orders this month"
          icon={ShoppingCart}
          colorClass="text-blue-600"
          trend={{ value: 5.3, isPositive: true }}
        />
        <StatCard 
          title="Customers"
          value="142"
          description="Total customers"
          icon={Users}
          colorClass="text-purple-600"
          trend={{ value: 12.5, isPositive: true }}
        />
      </div>
      
      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          <SalesChart data={mockSalesData} />
        </div>
        <div>
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-4">Top Products</h3>
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center">
                    <div className="w-12 h-12 bg-gray-200 rounded-md flex items-center justify-center mr-3">
                      <Package className="h-6 w-6 text-gray-500" />
                    </div>
                    <div className="flex-grow">
                      <h4 className="font-medium text-gray-900">Circuit Breaker {100 + i}</h4>
                      <div className="flex justify-between text-sm text-gray-500">
                        <span>{8 - i} sold</span>
                        <span>${(499.99 - (i * 50)).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Recent Orders */}
      <div className="mb-8">
        <RecentOrdersTable orders={mockRecentOrders} />
      </div>
    </div>
  );
};

export default SellerDashboard;
