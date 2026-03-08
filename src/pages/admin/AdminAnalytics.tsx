import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  BarChart3, TrendingUp, Users, Clock, Package, RefreshCw,
  ArrowUpRight, ArrowDownRight, Trophy, DollarSign, Activity,
  PieChart, Zap, Target,
} from 'lucide-react';
import {
  useProcurementAnalytics,
  RfqAnalytics,
  SellerPerformance,
  PriceIntelligence,
  ComponentDemand,
  ResponseTimeDistribution,
} from '@/hooks/useProcurementAnalytics';

const periodOptions = [
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'Last 90 days' },
  { value: '180', label: 'Last 6 months' },
  { value: '365', label: 'Last 12 months' },
];

const AdminAnalytics: React.FC = () => {
  const { isLoading, loadAllAnalytics } = useProcurementAnalytics();
  const [period, setPeriod] = useState('90');

  const [rfq, setRfq] = useState<RfqAnalytics | null>(null);
  const [sellers, setSellers] = useState<SellerPerformance[]>([]);
  const [prices, setPrices] = useState<PriceIntelligence[]>([]);
  const [demand, setDemand] = useState<ComponentDemand[]>([]);
  const [responseTime, setResponseTime] = useState<ResponseTimeDistribution | null>(null);

  const loadData = async () => {
    const from = new Date();
    from.setDate(from.getDate() - parseInt(period));
    const result = await loadAllAnalytics(from.toISOString(), new Date().toISOString());
    setRfq(result.rfq);
    setSellers(result.sellers);
    setPrices(result.prices);
    setDemand(result.demand);
    setResponseTime(result.responseTime);
  };

  useEffect(() => {
    loadData();
  }, [period]);

  const formatCurrency = (val: number | null) =>
    val != null ? `₹${val.toLocaleString('en-IN', { maximumFractionDigits: 0 })}` : '-';

  const formatHours = (val: number | null) => {
    if (val == null) return '-';
    if (val < 1) return `${Math.round(val * 60)}m`;
    if (val < 24) return `${val.toFixed(1)}h`;
    return `${(val / 24).toFixed(1)}d`;
  };

  // Response time chart data for simple bar visualization
  const responseTimeBars = responseTime ? [
    { label: '<1h', value: responseTime.under_1h, color: 'bg-green-500' },
    { label: '1-4h', value: responseTime.under_4h, color: 'bg-emerald-500' },
    { label: '4-24h', value: responseTime.under_24h, color: 'bg-yellow-500' },
    { label: '1-3d', value: responseTime.under_72h, color: 'bg-orange-500' },
    { label: '>3d', value: responseTime.over_72h, color: 'bg-red-500' },
    { label: 'None', value: responseTime.no_response, color: 'bg-muted' },
  ] : [];

  const maxBarValue = Math.max(...responseTimeBars.map(b => b.value), 1);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Procurement Intelligence</h1>
          <p className="text-muted-foreground mt-1">
            RFQ analytics, price intelligence, and seller performance
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {periodOptions.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={loadData} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* ===== KPI Cards ===== */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total RFQs</p>
                <p className="text-3xl font-bold text-foreground">{rfq?.total_rfqs ?? 0}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
            </div>
            <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="outline" className="text-xs">{rfq?.open_rfqs ?? 0} open</Badge>
              <Badge variant="outline" className="text-xs">{rfq?.quoted_rfqs ?? 0} quoted</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Conversion Rate</p>
                <p className="text-3xl font-bold text-foreground">{rfq?.conversion_rate ?? 0}%</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {rfq?.converted_rfqs ?? 0} of {rfq?.total_rfqs ?? 0} RFQs converted to orders
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Response Time</p>
                <p className="text-3xl font-bold text-foreground">{formatHours(responseTime?.avg_hours ?? null)}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Median: {formatHours(responseTime?.median_hours ?? null)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Sellers</p>
                <p className="text-3xl font-bold text-foreground">{sellers.filter(s => s.quotes_submitted > 0).length}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {sellers.length} total invited sellers
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ===== Row 2: Response Time + Component Demand ===== */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Response Time Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Activity className="h-5 w-5 text-primary" />
              Response Time Distribution
            </CardTitle>
            <CardDescription>How quickly sellers respond to RFQ invitations</CardDescription>
          </CardHeader>
          <CardContent>
            {responseTimeBars.length > 0 ? (
              <div className="space-y-3">
                {responseTimeBars.map(bar => (
                  <div key={bar.label} className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-12 text-right">{bar.label}</span>
                    <div className="flex-1 h-7 bg-muted/50 rounded overflow-hidden relative">
                      <div
                        className={`h-full ${bar.color} rounded transition-all duration-500`}
                        style={{ width: `${Math.max((bar.value / maxBarValue) * 100, 2)}%` }}
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-medium text-foreground">
                        {bar.value}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">No response data yet</p>
            )}
          </CardContent>
        </Card>

        {/* Component Demand */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Package className="h-5 w-5 text-primary" />
              Component Demand by Category
            </CardTitle>
            <CardDescription>Most requested product categories from RFQs</CardDescription>
          </CardHeader>
          <CardContent>
            {demand.length > 0 ? (
              <div className="space-y-3">
                {demand.map((item, i) => (
                  <div key={item.category} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-foreground capitalize">
                        {item.category.replace(/-/g, ' ')}
                      </span>
                      <span className="text-muted-foreground">
                        {item.component_count} items · {item.unique_rfqs} RFQs
                      </span>
                    </div>
                    <Progress value={item.quoted_pct} className="h-2" />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Qty: {item.total_quantity.toLocaleString()}</span>
                      <span>{item.quoted_pct}% quoted</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">No demand data yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ===== Price Intelligence ===== */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <DollarSign className="h-5 w-5 text-primary" />
            Price Intelligence
          </CardTitle>
          <CardDescription>
            Price ranges and variance across sellers for frequently requested components
          </CardDescription>
        </CardHeader>
        <CardContent>
          {prices.length > 0 ? (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Component</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Requests</TableHead>
                    <TableHead className="text-right">Quotes</TableHead>
                    <TableHead className="text-right">Min Price</TableHead>
                    <TableHead className="text-right">Avg Price</TableHead>
                    <TableHead className="text-right">Max Price</TableHead>
                    <TableHead className="text-right">Variance</TableHead>
                    <TableHead className="text-right">Avg Lead Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {prices.map((item, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium max-w-[250px] truncate">{item.description}</TableCell>
                      <TableCell>
                        {item.category ? (
                          <Badge variant="outline" className="text-xs capitalize">
                            {item.category.replace(/-/g, ' ')}
                          </Badge>
                        ) : '-'}
                      </TableCell>
                      <TableCell className="text-right">{item.times_requested}</TableCell>
                      <TableCell className="text-right">{item.quotes_received}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{formatCurrency(item.min_price)}</TableCell>
                      <TableCell className="text-right font-mono text-sm font-medium">{formatCurrency(item.avg_price)}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{formatCurrency(item.max_price)}</TableCell>
                      <TableCell className="text-right">
                        {item.price_variance_pct > 0 ? (
                          <Badge
                            variant="outline"
                            className={`text-xs ${item.price_variance_pct > 30 ? 'border-red-300 text-red-700' : item.price_variance_pct > 15 ? 'border-yellow-300 text-yellow-700' : 'border-green-300 text-green-700'}`}
                          >
                            ±{item.price_variance_pct}%
                          </Badge>
                        ) : '-'}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {item.avg_lead_time_days != null ? `${item.avg_lead_time_days}d` : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">No price data available yet. Prices will appear after sellers submit quotes.</p>
          )}
        </CardContent>
      </Card>

      {/* ===== Seller Performance Leaderboard ===== */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Trophy className="h-5 w-5 text-primary" />
            Seller Performance Leaderboard
          </CardTitle>
          <CardDescription>
            Response rates, average response times, and win rates for invited sellers
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sellers.length > 0 ? (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8">#</TableHead>
                    <TableHead>Seller</TableHead>
                    <TableHead className="text-right">Invitations</TableHead>
                    <TableHead className="text-right">Quotes</TableHead>
                    <TableHead className="text-right">Response Rate</TableHead>
                    <TableHead className="text-right">Avg Response</TableHead>
                    <TableHead className="text-right">Wins</TableHead>
                    <TableHead className="text-right">Win Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sellers.map((seller, i) => (
                    <TableRow key={seller.seller_id}>
                      <TableCell className="font-mono text-xs text-muted-foreground">{i + 1}</TableCell>
                      <TableCell className="font-medium">{seller.seller_name}</TableCell>
                      <TableCell className="text-right">{seller.invitations_received}</TableCell>
                      <TableCell className="text-right">{seller.quotes_submitted}</TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant="outline"
                          className={`text-xs ${seller.response_rate >= 70 ? 'border-green-300 text-green-700' : seller.response_rate >= 40 ? 'border-yellow-300 text-yellow-700' : 'border-red-300 text-red-700'}`}
                        >
                          {seller.response_rate}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {formatHours(seller.avg_response_hours)}
                      </TableCell>
                      <TableCell className="text-right font-medium">{seller.quotes_won}</TableCell>
                      <TableCell className="text-right">
                        {seller.win_rate > 0 ? (
                          <span className="text-sm font-medium text-green-700">{seller.win_rate}%</span>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">No seller activity data yet</p>
          )}
        </CardContent>
      </Card>

      {/* Future extensibility note */}
      <Card className="bg-muted/30 border-dashed">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Zap className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="font-semibold text-foreground">Coming Soon: Advanced Analytics</p>
              <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                <li>• <strong>Price Benchmarking</strong> — compare seller prices against market averages per component</li>
                <li>• <strong>Supplier Scoring</strong> — composite score based on response time, win rate, and delivery performance</li>
                <li>• <strong>Procurement Forecasting</strong> — predict component demand based on historical BOM patterns</li>
                <li>• <strong>Buyer Insights</strong> — procurement history, preferred sellers, and frequently used components</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAnalytics;
