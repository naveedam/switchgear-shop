
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Order, OrderStatus } from '@/types/order';
import { formatDistanceToNow } from 'date-fns';

interface RecentOrdersTableProps {
  orders: Order[];
}

const getStatusColor = (status: OrderStatus) => {
  switch (status) {
    case 'pending_payment':
      return 'bg-yellow-100 text-yellow-800';
    case 'processing':
      return 'bg-blue-100 text-blue-800';
    case 'shipped':
      return 'bg-purple-100 text-purple-800';
    case 'delivered':
      return 'bg-green-100 text-green-800';
    case 'canceled':
      return 'bg-red-100 text-red-800';
    case 'refunded':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const formatStatus = (status: OrderStatus) => {
  return status.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
};

const RecentOrdersTable: React.FC<RecentOrdersTableProps> = ({ orders }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Orders</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="font-medium">#{order.id.slice(0, 8)}</TableCell>
                <TableCell>{order.buyerName}</TableCell>
                <TableCell>{formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })}</TableCell>
                <TableCell>{formatCurrency(order.totalAmount)}</TableCell>
                <TableCell>
                  <Badge className={getStatusColor(order.status)}>
                    {formatStatus(order.status)}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default RecentOrdersTable;
