import React from 'react';
import { Store, Package } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { GroupedCartBySeller } from '@/types/seller-order';

interface CartBySellerProps {
  groupedBySeller: GroupedCartBySeller[];
  showSellerHeaders?: boolean;
}

const CartBySeller: React.FC<CartBySellerProps> = ({
  groupedBySeller,
  showSellerHeaders = true
}) => {
  return (
    <div className="space-y-4">
      {groupedBySeller.map((group, index) => (
        <Card key={group.sellerId} className="overflow-hidden">
          {showSellerHeaders && (
            <CardHeader className="bg-muted/50 py-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Store className="h-4 w-4 text-muted-foreground" />
                <span>Fulfilled by: {group.sellerName}</span>
                <span className="text-muted-foreground ml-auto">
                  Shipment {index + 1} of {groupedBySeller.length}
                </span>
              </CardTitle>
            </CardHeader>
          )}
          <CardContent className="p-4">
            <ul className="divide-y">
              {group.items.map(item => (
                <li key={item.productId} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
                  <div className="w-14 h-14 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                    {item.featuredImage ? (
                      <img
                        src={item.featuredImage}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex-grow">
                    <p className="font-medium text-sm">{item.name}</p>
                    <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">₹{(item.price * item.quantity).toLocaleString('en-IN')}</p>
                  </div>
                </li>
              ))}
            </ul>
            <Separator className="my-3" />
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Seller Subtotal</span>
              <span className="font-semibold">₹{group.subtotal.toLocaleString('en-IN')}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default CartBySeller;
