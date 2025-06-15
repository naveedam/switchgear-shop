
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, FileEdit } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import AddFromCatalogDialog from "@/components/seller/AddFromCatalogDialog";

interface SellerProduct {
  id: string;
  price: number;
  stock: number;
  status: string;
  catalog_product_id: string;
  catalog_products?: { name: string }; // changed for correct TS + correct join
}

const SellerProducts: React.FC = () => {
  const [products, setProducts] = useState<SellerProduct[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    // Fix join: use "catalog_products(name)"
    supabase
      .from("seller_products")
      .select("id, price, stock, status, catalog_product_id, catalog_products(name)")
      .eq("seller_id", user.id)
      .then(({ data, error }) => {
        setProducts(data || []);
        setLoading(false);
      });
  }, [user, isAdding]);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold">My Products</h1>
        <Button onClick={() => setIsAdding(true)}>
          <Plus className="h-4 w-4 mr-1" /> Add Product
        </Button>
      </div>

      <AddFromCatalogDialog
        open={isAdding}
        onClose={() => setIsAdding(false)}
        onAdded={() => setIsAdding(false)}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          <div>Loading...</div>
        ) : products.length === 0 ? (
          <div className="text-gray-500">No products listed yet. Click &quot;Add Product&quot; to list from catalog.</div>
        ) : (
          products.map((prod) => (
            <Card key={prod.id} className="p-4 flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <span className="font-semibold">{prod.catalog_products?.name ?? "Unknown product"}</span>
                <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">{prod.status}</span>
              </div>
              <div className="text-sm">
                Price: ₹{prod.price}
              </div>
              <div className="text-sm">
                Stock: {prod.stock}
              </div>
              <div className="mt-2">
                <Button size="sm" variant="outline">
                  <FileEdit className="h-4 w-4 mr-1" /> Edit
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default SellerProducts;
