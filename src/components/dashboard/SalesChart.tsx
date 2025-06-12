
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface SalesData {
  date: string;
  revenue: number;
  orders: number;
}

interface SalesChartProps {
  data: SalesData[];
  title?: string;
}

const SalesChart: React.FC<SalesChartProps> = ({ data, title = "Sales Overview" }) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{
                top: 10,
                right: 30,
                left: 0,
                bottom: 0,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis 
                yAxisId="left"
                orientation="left" 
                tickFormatter={formatCurrency}
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                tickFormatter={(value) => `${value} orders`}
              />
              <Tooltip 
                formatter={(value, name) => {
                  if (name === 'revenue') {
                    return [formatCurrency(value as number), 'Revenue'];
                  }
                  return [`${value} orders`, 'Orders'];
                }}
              />
              <Area 
                type="monotone" 
                dataKey="revenue" 
                yAxisId="left"
                stroke="#4f70f8" 
                fill="#4f70f8" 
                fillOpacity={0.3} 
              />
              <Area 
                type="monotone" 
                dataKey="orders" 
                yAxisId="right"
                stroke="#5d738a" 
                fill="#5d738a"
                fillOpacity={0.3} 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default SalesChart;
