
import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const mockOrders = [
  {
    id: "ORD-1001",
    date: "2025-06-12",
    buyer: "Acme Ltd.",
    status: "shipped",
    total: 4500,
  },
  {
    id: "ORD-1002",
    date: "2025-06-11",
    buyer: "Jayanti Corp.",
    status: "delivered",
    total: 11950,
  }
];

const statusColor: Record<string, string> = {
  shipped: "bg-blue-100 text-blue-600",
  delivered: "bg-green-100 text-green-600",
  processing: "bg-yellow-100 text-yellow-700",
  canceled: "bg-red-100 text-red-600"
};

const SellerOrders: React.FC = () => {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-xl font-bold mb-6">My Orders</h1>
      <div className="space-y-4">
        {mockOrders.map((order) => (
          <Card key={order.id} className="p-4 flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <span className="font-semibold">{order.id}</span>
              <Badge className={statusColor[order.status] || ""}>
                {order.status}
              </Badge>
            </div>
            <div className="text-sm text-gray-600">Ordered by: {order.buyer}</div>
            <div className="text-sm">Order Date: {order.date}</div>
            <div className="text-sm font-medium">Total: ₹{order.total}</div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default SellerOrders;
