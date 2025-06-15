
import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/contexts/CartContext";

const NavCartButton: React.FC = () => {
  const { cart } = useCart();
  const navigate = useNavigate();
  const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <Button
      variant="ghost"
      className="relative"
      onClick={() => navigate("/cart")}
      aria-label="View cart"
    >
      <ShoppingCart className="h-5 w-5" />
      {totalQuantity > 0 && (
        <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
          {totalQuantity}
        </span>
      )}
    </Button>
  );
};

export default NavCartButton;
