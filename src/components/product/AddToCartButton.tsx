
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';
import { Product, ProductVariant } from '@/types/product';

interface AddToCartButtonProps {
  product: Product;
  variant?: ProductVariant;
}

const AddToCartButton: React.FC<AddToCartButtonProps> = ({ product, variant }) => {
  const { addToCart, isFetching } = useCart();
  const [added, setAdded] = useState(false);

  const handleAdd = async () => {
    setAdded(false);
    await addToCart({
      productId: product.id,
      productName: product.name,
      productImage: product.featuredImage,
      variantId: variant?.id,
      variantName: variant?.name,
      sku: variant?.sku ?? '',
      quantity: 1,
      unitPrice: (variant ? variant.price : product.variants[0]?.price ?? 0),
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1000);
  };

  return (
    <Button 
      className="w-full"
      onClick={handleAdd}
      disabled={isFetching}
    >
      {added ? "Added!" : "Add to Cart"}
    </Button>
  );
};

export default AddToCartButton;
