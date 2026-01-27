import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import StatCard from '@/components/dashboard/StatCard';
import RecentOrdersTable from '@/components/dashboard/RecentOrdersTable';
import SalesChart from '@/components/dashboard/SalesChart';
import { Package, DollarSign, ShoppingCart, Users, AlertCircle } from 'lucide-react';
import { useSellerStats } from '@/hooks/useSellerStats';
import { Order } from '@/types/order';

const SellerDashboard: React.FC = () => {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const {
    totalProducts,
    totalRevenue,
    totalOrders,
    totalCustomers,
    recentOrders,
    salesData,
    topProducts,
    isLoading,
    error,
  } = useSellerStats(user?.id);

  // Redirect non-sellers
  React.useEffect(() => {
    if (!authLoading && (!isAuthenticated || (user && user.role !== 'seller'))) {
      navigate('/login');
    }
  }, [isAuthenticated, user, navigate, authLoading]);

  if (authLoading || isLoading) {
    return (
      <div className="dashboard-container p-6">
        <div className="mb-8">
          <Skeleton className="h-9 w-48 mb-2" />
          <Skeleton className="h-5 w-64" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-4 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="pt-6">
                <Skeleton className="h-64 w-full" />
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardContent className="pt-6">
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-container p-6">
        <Card className="border-destructive">
          <CardContent className="py-8">
            <div className="text-center text-destructive">
              <AlertCircle className="h-12 w-12 mx-auto mb-4" />
              <p className="text-lg font-medium mb-2">Failed to load dashboard</p>
              <p className="text-muted-foreground">{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Convert recent orders to the format expected by RecentOrdersTable
  const ordersForTable: Order[] = recentOrders.map((order) => ({
    id: order.id,
    buyerId: '',
    buyerName: order.buyerName,
    sellerId: user?.id || '',
    sellerName: user?.name || '',
    items: order.items.map((item, idx) => ({
      id: `${order.id}-${idx}`,
      productId: '',
      productName: item.productName,
      productImage: '',
      sku: '',
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.quantity * item.unitPrice,
    })),
    subtotal: order.totalAmount,
    tax: 0,
    shippingDetails: {
      address: { street: '', city: '', state: '', zipCode: '', country: '' },
      method: '',
      shippingCost: 0,
    },
    paymentDetails: {
      method: 'credit_card',
      status: 'completed',
      amount: order.totalAmount,
      currency: 'INR',
    },
    totalAmount: order.totalAmount,
    status: order.status as Order['status'],
    createdAt: order.createdAt,
    updatedAt: order.createdAt,
  }));

  return (
    <div className="dashboard-container p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Seller Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {user?.name}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Products"
          value={totalProducts.toString()}
          description="Active products in your catalog"
          icon={Package}
        />
        <StatCard
          title="Revenue"
          value={`₹${totalRevenue.toLocaleString('en-IN')}`}
          description="Total sales"
          icon={DollarSign}
          colorClass="text-green-600"
        />
        <StatCard
          title="Orders"
          value={totalOrders.toString()}
          description="Total orders received"
          icon={ShoppingCart}
          colorClass="text-blue-600"
        />
        <StatCard
          title="Customers"
          value={totalCustomers.toString()}
          description="Unique customers"
          icon={Users}
          colorClass="text-purple-600"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          <SalesChart data={salesData} />
        </div>
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Top Products</CardTitle>
            </CardHeader>
            <CardContent>
              {topProducts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No sales data yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {topProducts.map((product) => (
                    <div key={product.id} className="flex items-center">
                      <div className="w-12 h-12 bg-muted rounded-md flex items-center justify-center mr-3 overflow-hidden">
                        {product.image ? (
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Package className="h-6 w-6 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-grow min-w-0">
                        <h4 className="font-medium text-foreground truncate">
                          {product.name}
                        </h4>
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>{product.soldCount} sold</span>
                          <span>₹{product.revenue.toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="mb-8">
        <RecentOrdersTable orders={ordersForTable} />
      </div>
    </div>
  );
};

export default SellerDashboard;
