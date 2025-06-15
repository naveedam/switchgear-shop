
import React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, FileEdit } from "lucide-react";

const mockProducts = [
  {
    id: "1",
    name: "Schneider MCB 1 Pole 32A",
    sku: "SCH-32A-1P",
    price: 450,
    status: "Published",
    stock: 25,
  },
  {
    id: "2",
    name: "Siemens MCCB 100A 3P",
    sku: "SIM-100A-3P",
    price: 1450,
    status: "Published",
    stock: 10,
  }
];

const SellerProducts: React.FC = () => {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold">My Products</h1>
        <Button>
          <Plus className="h-4 w-4 mr-1" /> Add Product
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {mockProducts.map((product) => (
          <Card key={product.id} className="p-4 flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <span className="font-semibold">{product.name}</span>
              <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">{product.status}</span>
            </div>
            <div className="text-sm text-gray-500">SKU: {product.sku}</div>
            <div className="text-sm">Price: ₹{product.price}</div>
            <div className="text-sm">Stock: {product.stock}</div>
            <div className="mt-2">
              <Button size="sm" variant="outline">
                <FileEdit className="h-4 w-4 mr-1" /> Edit
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default SellerProducts;
