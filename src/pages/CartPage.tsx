import React from "react";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useNavigate } from "react-router-dom";
import { useCartWithSellers } from "@/hooks/useCartWithSellers";
import CartBySeller from "@/components/checkout/CartBySeller";
import { ShoppingCart, ArrowRight, Store, Info } from "lucide-react";

const CartPage: React.FC = () => {
  const { removeFromCart, clearCart } = useCart();
  const { groupedBySeller, isMultiSeller, totalAmount, sellerCount, isLoading } = useCartWithSellers();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto py-16 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading cart...</p>
      </div>
    );
  }

  if (groupedBySeller.length === 0) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center">
        <ShoppingCart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold mb-4">Your Cart is Empty</h1>
        <p className="text-muted-foreground mb-6">
          Add some products to your cart to continue shopping.
        </p>
        <Button onClick={() => navigate("/categories")}>
          Browse Products
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <ShoppingCart className="h-6 w-6" />
        Your Cart
      </h1>

      {/* Multi-seller info */}
      {isMultiSeller && (
        <Alert className="mb-6 bg-muted/50">
          <Store className="h-4 w-4" />
          <AlertDescription>
            <strong>Multiple Sellers:</strong> Your cart contains items from {sellerCount} different sellers. 
            Each seller will ship their items separately and issue their own GST invoice.
          </AlertDescription>
        </Alert>
      )}

      {/* Cart items grouped by seller */}
      <CartBySeller groupedBySeller={groupedBySeller} />

      {/* Summary */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">Order Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isMultiSeller && (
            <div className="space-y-2">
              {groupedBySeller.map(group => (
                <div key={group.sellerId} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{group.sellerName}</span>
                  <span>₹{group.subtotal.toLocaleString('en-IN')}</span>
                </div>
              ))}
              <Separator />
            </div>
          )}
          
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold">Cart Total</span>
            <span className="text-2xl font-bold">₹{totalAmount.toLocaleString('en-IN')}</span>
          </div>

          <Alert className="bg-muted/30">
            <Info className="h-4 w-4" />
            <AlertDescription className="text-xs text-muted-foreground">
              Products are fulfilled by verified sellers. GST tax invoices will be issued by respective sellers.
            </AlertDescription>
          </Alert>

          <div className="flex gap-4 pt-2">
            <Button 
              variant="outline" 
              onClick={clearCart}
              className="flex-1"
            >
              Clear Cart
            </Button>
            <Button 
              onClick={() => navigate("/checkout")}
              className="flex-1 gap-2"
              size="lg"
            >
              Checkout
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CartPage;
