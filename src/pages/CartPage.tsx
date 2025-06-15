
import React from 'react';
import { useCart } from '@/contexts/CartContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const CartPage: React.FC = () => {
  const { items, updateQuantity, removeFromCart, clearCart, isFetching } = useCart();
  const navigate = useNavigate();

  const total = items.reduce((t, i) => t + i.unitPrice * i.quantity, 0);

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-4">Shopping Cart</h1>
      {items.length === 0 && (
        <div className="text-gray-500 my-10 text-center">
          Your cart is empty.
          <Button className="mt-4" onClick={() => navigate("/")}>Browse Products</Button>
        </div>
      )}
      {items.length > 0 && (
        <Card className="space-y-4 p-4">
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-2 border-b last:border-none pb-2">
              <img src={item.productImage} alt={item.productName} className="w-16 h-16 object-cover rounded" />
              <div className="flex-1">
                <div className="font-medium">{item.productName}</div>
                {item.variantName && <div className="text-xs text-gray-500">{item.variantName}</div>}
                <div className="text-sm text-gray-700">₹{item.unitPrice.toFixed(2)} x {item.quantity}</div>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" onClick={() => updateQuantity(item.id, item.quantity - 1)} disabled={item.quantity <= 1 || isFetching}>-</Button>
                <span className="px-2">{item.quantity}</span>
                <Button variant="ghost" size="icon" onClick={() => updateQuantity(item.id, item.quantity + 1)} disabled={isFetching}>+</Button>
              </div>
              <Button variant="ghost" size="icon" onClick={() => removeFromCart(item.id)} disabled={isFetching}>
                Remove
              </Button>
            </div>
          ))}
          <div className="flex justify-between py-4 border-t mt-2 text-lg font-semibold">
            <span>Total</span>
            <span>₹{total.toFixed(2)}</span>
          </div>
          <div className="flex justify-between gap-2">
            <Button variant="outline" onClick={clearCart} disabled={isFetching}>Clear Cart</Button>
            <Button onClick={() => navigate("/checkout")} disabled={items.length === 0 || isFetching}>Checkout</Button>
          </div>
        </Card>
      )}
    </div>
  );
};

export default CartPage;
