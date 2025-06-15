
import React, { useState, useEffect } from "react";
import { Dialog, DialogTitle, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface CatalogProduct {
  id: string;
  name: string;
  description?: string;
}

interface AddFromCatalogDialogProps {
  open: boolean;
  onClose: () => void;
  onAdded: () => void;
}

const AddFromCatalogDialog: React.FC<AddFromCatalogDialogProps> = ({
  open, onClose, onAdded
}) => {
  const [catalogProducts, setCatalogProducts] = useState<CatalogProduct[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<CatalogProduct | null>(null);
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);
  const { user } = useAuth();

  // Load catalog products
  useEffect(() => {
    if (!open) return;
    setLoading(true);
    supabase
      .from("catalog_products")
      .select("id, name, description")
      .ilike("name", `%${search}%`)
      .limit(20)
      .then(({ data, error }) => {
        setCatalogProducts(data || []);
        setLoading(false);
      });
  }, [open, search]);

  const handleAdd = async () => {
    if (!selectedProduct || !price || !stock || !user) return;
    setSubmitLoading(true);
    const { error } = await supabase.from("seller_products").insert({
      seller_id: user.id,
      catalog_product_id: selectedProduct.id,
      price: Number(price),
      stock: Number(stock),
      status: "listed"
    });
    setSubmitLoading(false);
    if (!error) {
      onAdded();
      onClose();
      setSelectedProduct(null);
      setPrice("");
      setStock("");
    } else {
      alert("Error adding product: " + error.message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogTitle>Add Product from Master Catalog</DialogTitle>
      <DialogContent>
        {!selectedProduct && (
          <>
            <Input
              placeholder="Search catalog products..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="mb-2"
            />
            <div className="max-h-64 overflow-y-auto space-y-2">
              {loading ? <div>Loading...</div> :
                catalogProducts.map((prod) => (
                  <div
                    key={prod.id}
                    className="cursor-pointer p-2 border rounded hover:bg-gray-50"
                    onClick={() => setSelectedProduct(prod)}
                  >
                    <div className="font-medium">{prod.name}</div>
                    <div className="text-xs text-gray-500">{prod.description}</div>
                  </div>
                ))
              }
            </div>
          </>
        )}
        {selectedProduct && (
          <div>
            <div className="font-semibold mb-2">{selectedProduct.name}</div>
            <div className="text-xs text-gray-500 mb-4">{selectedProduct.description}</div>
            <Input
              type="number"
              placeholder="Set your price"
              value={price}
              onChange={e=>setPrice(e.target.value)}
              min={0}
              className="mb-3"
            />
            <Input
              type="number"
              placeholder="Stock quantity"
              value={stock}
              onChange={e=>setStock(e.target.value)}
              min={0}
              className="mb-3"
            />
            <Button
              disabled={submitLoading || !price || !stock}
              onClick={handleAdd}
              className="mr-2"
            >
              {submitLoading ? "Adding..." : "Add Product"}
            </Button>
            <Button variant="outline" onClick={() => setSelectedProduct(null)}>
              Back
            </Button>
          </div>
        )}
      </DialogContent>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Close</Button>
      </DialogFooter>
    </Dialog>
  );
};

export default AddFromCatalogDialog;
