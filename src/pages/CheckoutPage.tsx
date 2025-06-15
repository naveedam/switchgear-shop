
import React, { useState } from 'react';
import { useCart } from '@/contexts/CartContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

// Minimal checkout for demo -- can be extended with address, payment, etc.
const CheckoutPage: React.FC = () => {
  const { items, clearCart } = useCart();
  const [processing, setProcessing] = useState(false);
  const navigate = useNavigate();

  const total = items.reduce((t, i) => t + i.unitPrice * i.quantity, 0);

  const handleCheckout = async () => {
    setProcessing(true);
    // Here you would normally create an order in Supabase
    setTimeout(async () => {
      await clearCart();
      setProcessing(false);
      alert('Order placed! (not yet persisted)');
      navigate("/");
    }, 1200);
  };

  if (items.length === 0) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center text-gray-500">
        Your cart is empty.
        <Button className="mt-4" onClick={() => navigate("/")}>Back to Shop</Button>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto py-12 px-4">
      <h2 className="text-xl font-bold mb-4">Review Your Order</h2>
      <div className="space-y-2 mb-4">
        {items.map(item => (
          <div key={item.id} className="flex justify-between">
            <span>
              {item.productName} x {item.quantity}
            </span>
            <span>₹{(item.unitPrice * item.quantity).toFixed(2)}</span>
          </div>
        ))}
      </div>
      <div className="flex justify-between text-lg font-semibold mb-6">
        <span>Total</span>
        <span>₹{total.toFixed(2)}</span>
      </div>
      <Button className="w-full" disabled={processing} onClick={handleCheckout}>
        {processing ? "Processing..." : "Place Order"}
      </Button>
    </div>
  );
};

export default CheckoutPage;
