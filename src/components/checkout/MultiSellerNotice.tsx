import React from 'react';
import { AlertCircle, Store, FileText } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { GroupedCartBySeller } from '@/types/seller-order';

interface MultiSellerNoticeProps {
  groupedBySeller: GroupedCartBySeller[];
  isMultiSeller: boolean;
}

const MultiSellerNotice: React.FC<MultiSellerNoticeProps> = ({
  groupedBySeller,
  isMultiSeller
}) => {
  if (!isMultiSeller) return null;

  return (
    <Alert className="mb-6 border-warning bg-warning/10">
      <AlertCircle className="h-4 w-4 text-warning" />
      <AlertTitle className="text-warning-foreground">Multiple Sellers</AlertTitle>
      <AlertDescription className="text-warning-foreground/80">
        <p className="mb-3">
          Your order contains products from {groupedBySeller.length} different sellers. 
          Each seller will fulfill their portion separately and issue their own GST tax invoice.
        </p>
        <div className="flex flex-wrap gap-2 mb-3">
          {groupedBySeller.map(group => (
            <Badge 
              key={group.sellerId} 
              variant="outline" 
              className="bg-background border-warning/30"
            >
              <Store className="h-3 w-3 mr-1" />
              {group.sellerName} ({group.items.length} items)
            </Badge>
          ))}
        </div>
        <div className="flex items-center gap-1 text-sm">
          <FileText className="h-3 w-3" />
          <span>GST invoices will be issued by respective sellers.</span>
        </div>
      </AlertDescription>
    </Alert>
  );
};

export default MultiSellerNotice;
