
import React from 'react';
import { useCart } from '@/contexts/CartContext';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';

const CartButton: React.FC = () => {
  const { items } = useCart();
  const navigate = useNavigate();

  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <Button variant="ghost" onClick={() => navigate("/cart")} className="relative">
      <ShoppingCart className="w-6 h-6" />
      {itemCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 rounded-full text-white text-xs w-5 h-5 flex items-center justify-center">
          {itemCount}
        </span>
      )}
    </Button>
  );
};

export default CartButton;
