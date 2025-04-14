
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import StatCard from '@/components/dashboard/StatCard';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  DollarSign, 
  Users, 
  ShoppingBag, 
  Store, 
  AlertTriangle, 
  ArrowUpRight, 
  PieChart
} from 'lucide-react';
import SalesChart from '@/components/dashboard/SalesChart';

// Mock data for admin dashboard
const mockSalesData = [
  { date: 'Jan', revenue: 25000, orders: 85 },
  { date: 'Feb', revenue: 32000, orders: 110 },
  { date: 'Mar', revenue: 41000, orders: 135 },
  { date: 'Apr', revenue: 38000, orders: 125 },
  { date: 'May', revenue: 48000, orders: 160 },
  { date: 'Jun', revenue: 52000, orders: 175 },
  { date: 'Jul', revenue: 58000, orders: 195 },
];

const mockSellerPerformance = [
  { id: 1, name: 'ElectroTech Industries', revenue: 18500, products: 45, rating: 4.8 },
  { id: 2, name: 'PowerGrid Solutions', revenue: 12300, products: 32, rating: 4.6 },
  { id: 3, name: 'Circuit Systems Ltd', revenue: 9800, products: 28, rating: 4.7 },
  { id: 4, name: 'VoltMax Industries', revenue: 7500, products: 21, rating: 4.5 },
  { id: 5, name: 'SwitchPro Electronics', revenue: 6200, products: 18, rating: 4.3 },
];

const AdminDashboard: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Check if user is authenticated and is an admin
    if (!isLoading && (!isAuthenticated || (user && user.role !== 'admin'))) {
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
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-industrial-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="dashboard-container">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600">Welcome back, {user?.name}</p>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard 
          title="Total Revenue"
          value="$285,420"
          description="All time marketplace revenue"
          icon={DollarSign}
          colorClass="text-green-600"
          trend={{ value: 18.2, isPositive: true }}
        />
        <StatCard 
          title="Sellers"
          value="24"
          description="Active sellers"
          icon={Store}
          colorClass="text-blue-600"
          trend={{ value: 12.5, isPositive: true }}
        />
        <StatCard 
          title="Buyers"
          value="1,248"
          description="Registered buyers"
          icon={Users}
          colorClass="text-purple-600"
          trend={{ value: 24.3, isPositive: true }}
        />
        <StatCard 
          title="Orders"
          value="586"
          description="Total processed orders"
          icon={ShoppingBag}
          trend={{ value: 15.8, isPositive: true }}
        />
      </div>
      
      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          <SalesChart data={mockSalesData} title="Marketplace Performance" />
        </div>
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Issues Requiring Attention</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center p-3 bg-red-50 rounded-md border border-red-100">
                  <AlertTriangle className="h-5 w-5 text-red-500 mr-3" />
                  <div>
                    <h4 className="font-medium text-gray-900">Payment Failures</h4>
                    <p className="text-sm text-gray-600">5 recent payment failures to investigate</p>
                  </div>
                </div>
                <div className="flex items-center p-3 bg-yellow-50 rounded-md border border-yellow-100">
                  <AlertTriangle className="h-5 w-5 text-yellow-500 mr-3" />
                  <div>
                    <h4 className="font-medium text-gray-900">New Seller Approvals</h4>
                    <p className="text-sm text-gray-600">3 sellers awaiting approval</p>
                  </div>
                </div>
                <div className="flex items-center p-3 bg-blue-50 rounded-md border border-blue-100">
                  <AlertTriangle className="h-5 w-5 text-blue-500 mr-3" />
                  <div>
                    <h4 className="font-medium text-gray-900">Product Reviews</h4>
                    <p className="text-sm text-gray-600">12 reported reviews to moderate</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Top Sellers Table */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Top Performing Sellers</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Seller</TableHead>
                <TableHead>Revenue</TableHead>
                <TableHead>Products</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockSellerPerformance.map((seller) => (
                <TableRow key={seller.id}>
                  <TableCell className="font-medium">{seller.name}</TableCell>
                  <TableCell>${seller.revenue.toLocaleString()}</TableCell>
                  <TableCell>{seller.products}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      {seller.rating}
                      <div className="ml-2 flex">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <svg
                            key={i}
                            className={`w-4 h-4 ${
                              i < Math.floor(seller.rating) ? 'text-yellow-400' : 'text-gray-300'
                            }`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                          </svg>
                        ))}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className="bg-green-100 text-green-800">
                      Active
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center justify-between">
              <span>Category Performance</span>
              <PieChart className="h-5 w-5 text-gray-400" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {['Circuit Breakers', 'Switchboards', 'Distribution Panels', 'Contactors', 'Relays'].map((category, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{category}</span>
                  <div className="flex items-center">
                    <span className="font-medium mr-2">
                      ${(12000 - i * 2000).toLocaleString()}
                    </span>
                    <Badge className="bg-green-100 text-green-800 flex items-center">
                      <ArrowUpRight className="h-3 w-3 mr-1" />
                      {12 - i}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Recent Activities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { action: 'New seller registered', time: '2 hours ago' },
                { action: 'Product approval request', time: '3 hours ago' },
                { action: 'Order #10483 was disputed', time: '5 hours ago' },
                { action: 'New user bulk import completed', time: '6 hours ago' },
                { action: 'System maintenance performed', time: '1 day ago' },
              ].map((activity, i) => (
                <div key={i} className="flex items-start">
                  <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 mr-3" />
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">{activity.action}</h4>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
