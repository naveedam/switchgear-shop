import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Search, ShoppingCart, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface CartWithDetails {
  id: string;
  buyer_id: string;
  created_at: string;
  updated_at: string;
  companies?: {
    name: string;
    email: string;
  };
  cart_items?: Array<{
    id: string;
    quantity: number;
    products: {
      name: string;
      price: number;
      sku?: string;
    };
  }>;
}

const AdminCarts: React.FC = () => {
  const [carts, setCarts] = useState<CartWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadCarts();
  }, []);

  const loadCarts = async () => {
    try {
      const { data, error } = await supabase
        .from('shopping_carts')
        .select(`
          *,
          companies!shopping_carts_buyer_id_fkey (name, email),
          cart_items (
            id,
            quantity,
            products (name, price, sku)
          )
        `)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      
      // Filter out empty carts
      const nonEmptyCarts = (data || []).filter(cart => cart.cart_items && cart.cart_items.length > 0);
      setCarts(nonEmptyCarts);
    } catch (error) {
      console.error('Error loading carts:', error);
      toast({
        title: 'Error',
        description: 'Failed to load carts',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const clearCart = async (cartId: string) => {
    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('cart_id', cartId);

      if (error) throw error;
      
      await loadCarts();
      toast({
        title: 'Success',
        description: 'Cart cleared successfully'
      });
    } catch (error) {
      console.error('Error clearing cart:', error);
      toast({
        title: 'Error',
        description: 'Failed to clear cart',
        variant: 'destructive'
      });
    }
  };

  const calculateCartTotal = (cartItems: any[]) => {
    return cartItems.reduce((total, item) => total + (item.products.price * item.quantity), 0);
  };

  const filteredCarts = carts.filter(cart => {
    const matchesSearch = cart.companies?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cart.companies?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cart.id.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  if (loading) {
    return <div className="p-6">Loading carts...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Shopping Carts</h1>
          <p className="text-gray-600">View and manage user shopping carts</p>
        </div>
        <Button onClick={loadCarts}>Refresh</Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Search carts..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-blue-600" />
              <span className="text-sm text-gray-600">Active Carts</span>
            </div>
            <p className="text-2xl font-bold mt-1">{filteredCarts.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Total Items</span>
            </div>
            <p className="text-2xl font-bold mt-1">
              {filteredCarts.reduce((total, cart) => 
                total + (cart.cart_items?.reduce((sum, item) => sum + item.quantity, 0) || 0), 0
              )}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Total Value</span>
            </div>
            <p className="text-2xl font-bold mt-1">
              ₹{filteredCarts.reduce((total, cart) => 
                total + calculateCartTotal(cart.cart_items || []), 0
              ).toFixed(2)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Carts List */}
      <div className="space-y-4">
        {filteredCarts.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-gray-500">
              No active carts found
            </CardContent>
          </Card>
        ) : (
          filteredCarts.map((cart) => (
            <Card key={cart.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">
                      {cart.companies?.name || 'Unknown User'}
                    </CardTitle>
                    <p className="text-sm text-gray-600">
                      {cart.companies?.email}
                    </p>
                    <p className="text-sm text-gray-500">
                      Last updated: {new Date(cart.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => clearCart(cart.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Clear Cart
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Cart Items */}
                <div>
                  <h4 className="font-semibold mb-2">
                    Items ({cart.cart_items?.length || 0})
                  </h4>
                  {cart.cart_items?.map((item) => (
                    <div key={item.id} className="flex justify-between items-center py-1">
                      <div className="flex-1">
                        <span className="text-sm font-medium">
                          {item.products.name}
                        </span>
                        {item.products.sku && (
                          <span className="text-xs text-gray-500 ml-2">
                            SKU: {item.products.sku}
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="text-sm">
                          {item.quantity} × ₹{item.products.price}
                        </span>
                        <div className="text-sm font-medium">
                          ₹{(item.products.price * item.quantity).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ))}
                  <Separator className="my-2" />
                  <div className="flex justify-between items-center font-bold">
                    <span>Cart Total</span>
                    <span>₹{calculateCartTotal(cart.cart_items || []).toFixed(2)}</span>
                  </div>
                </div>

                {/* Cart Age */}
                <div className="text-sm text-gray-500">
                  Cart created: {new Date(cart.created_at).toLocaleDateString()}
                  {' • '}
                  {Math.ceil((Date.now() - new Date(cart.updated_at).getTime()) / (1000 * 60 * 60 * 24))} days ago
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminCarts;