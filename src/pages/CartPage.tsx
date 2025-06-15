
import React from "react";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

const CartPage: React.FC = () => {
  const { cart, removeFromCart, clearCart } = useCart();

  const handleCheckout = () => {
    if (cart.length === 0) return;
    toast({ title: "Order placed!", description: "Thank you for your purchase." });
    clearCart();
  };

  if (cart.length === 0) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Your Cart is Empty</h1>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto py-16">
      <h1 className="text-2xl font-bold mb-8">Your Cart</h1>
      <ul className="divide-y divide-gray-200 mb-8">
        {cart.map(item => (
          <li key={item.productId} className="flex items-center justify-between py-4">
            <div className="flex items-center gap-4">
              <img src={item.featuredImage} alt={item.name} className="w-16 h-16 object-cover rounded" />
              <div>
                <div className="font-medium">{item.name}</div>
                <div className="text-xs text-gray-500">Qty: {item.quantity}</div>
                <div className="font-semibold mt-1">₹{item.price.toFixed(2)}</div>
              </div>
            </div>
            <Button size="sm" variant="destructive" onClick={() => removeFromCart(item.productId)}>
              Remove
            </Button>
          </li>
        ))}
      </ul>
      <div className="flex justify-between items-center mb-6">
        <div className="font-bold text-lg">
          Total: ₹{cart.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2)}
        </div>
        <Button onClick={clearCart} variant="outline">
          Clear Cart
        </Button>
      </div>
      <Button size="lg" className="w-full" onClick={handleCheckout}>
        Checkout
      </Button>
    </div>
  );
};

export default CartPage;
