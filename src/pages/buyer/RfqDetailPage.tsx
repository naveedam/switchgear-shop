import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { FileText, Package, Users, CheckCircle, Clock, ArrowRight, ShoppingCart, Award, TrendingDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Container } from '@/components/ui/container';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/contexts/AuthContext';
import { useRfqService } from '@/hooks/useRfqService';
import { RFQ, RFQItem, SellerQuote, SellerQuoteItem } from '@/types/rfq';
import { useToast } from '@/hooks/use-toast';
import Currency from '@/components/ui/currency';

interface QuoteSelection {
  quoteItemId: string;
  quoteId: string;
  sellerId: string;
  rfqItemId: string;
  price: number;
}

const RfqDetailPage = () => {
  const { rfqId } = useParams<{ rfqId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getRfqWithDetails, acceptQuoteItems, isLoading } = useRfqService();
  const { toast } = useToast();

  const [rfq, setRfq] = useState<RFQ | null>(null);
  const [items, setItems] = useState<RFQItem[]>([]);
  const [quotes, setQuotes] = useState<SellerQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [selections, setSelections] = useState<QuoteSelection[]>([]);

  useEffect(() => {
    const loadData = async () => {
      if (!rfqId) return;
      const result = await getRfqWithDetails(rfqId);
      if (result) {
        setRfq(result.rfq);
        setItems(result.items);
        setQuotes(result.quotes);
      }
      setLoading(false);
    };
    loadData();
  }, [rfqId, getRfqWithDetails]);

  const toggleSelection = (quoteItem: SellerQuoteItem, quote: SellerQuote) => {
    setSelections(prev => {
      const existing = prev.find(s => s.rfqItemId === quoteItem.rfq_item_id);
      if (existing?.quoteItemId === quoteItem.id) {
        return prev.filter(s => s.rfqItemId !== quoteItem.rfq_item_id);
      }
      return [
        ...prev.filter(s => s.rfqItemId !== quoteItem.rfq_item_id),
        {
          quoteItemId: quoteItem.id,
          quoteId: quote.id,
          sellerId: quote.seller_id,
          rfqItemId: quoteItem.rfq_item_id,
          price: quoteItem.total_price,
        },
      ];
    });
  };

  const isSelected = (quoteItemId: string) => selections.some(s => s.quoteItemId === quoteItemId);

  // Find best price per RFQ item
  const bestPricePerItem = new Map<string, { quoteItemId: string; price: number }>();
  for (const quote of quotes) {
    for (const qi of quote.items || []) {
      if (!qi.is_available) continue;
      const current = bestPricePerItem.get(qi.rfq_item_id);
      if (!current || qi.unit_price < current.price) {
        bestPricePerItem.set(qi.rfq_item_id, { quoteItemId: qi.id, price: qi.unit_price });
      }
    }
  }

  // Find longest lead time per RFQ item
  const worstLeadPerItem = new Map<string, number>();
  for (const quote of quotes) {
    for (const qi of quote.items || []) {
      if (!qi.lead_time_days) continue;
      const current = worstLeadPerItem.get(qi.rfq_item_id) || 0;
      if (qi.lead_time_days > current) {
        worstLeadPerItem.set(qi.rfq_item_id, qi.lead_time_days);
      }
    }
  }

  const handleCreateOrder = async () => {
    if (!user?.id || !rfqId || selections.length === 0) return;
    const orderId = await acceptQuoteItems(rfqId, user.id, selections);
    if (orderId) {
      navigate(`/orders`);
    }
  };

  const totalSelected = selections.reduce((sum, s) => sum + s.price, 0);
  const sellerCount = new Set(selections.map(s => s.sellerId)).size;

  // Per-seller subtotals
  const sellerSubtotals = new Map<string, { name: string; total: number; count: number }>();
  for (const sel of selections) {
    const quote = quotes.find(q => q.id === sel.quoteId);
    const existing = sellerSubtotals.get(sel.sellerId) || {
      name: quote?.seller?.name || 'Unknown',
      total: 0,
      count: 0,
    };
    existing.total += sel.price;
    existing.count += 1;
    sellerSubtotals.set(sel.sellerId, existing);
  }

  if (loading) {
    return (
      <Container className="py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </Container>
    );
  }

  if (!rfq) {
    return (
      <Container className="py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">RFQ not found</p>
          </CardContent>
        </Card>
      </Container>
    );
  }

  return (
    <Container className="py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold">{rfq.rfq_number}</h1>
              <Badge variant={rfq.status === 'converted' ? 'default' : 'secondary'}>
                {rfq.status.replace('_', ' ')}
              </Badge>
            </div>
            <p className="text-lg text-muted-foreground">{rfq.title}</p>
            <p className="text-sm text-muted-foreground mt-1">
              Created {format(new Date(rfq.created_at), 'dd MMM yyyy')}
              {rfq.expires_at && ` • Expires ${format(new Date(rfq.expires_at), 'dd MMM yyyy')}`}
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate('/buyer/rfqs')}>
            Back to RFQs
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Package className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{rfq.total_items}</p>
                  <p className="text-sm text-muted-foreground">Total Items</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Users className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{quotes.length}</p>
                  <p className="text-sm text-muted-foreground">Quotes Received</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{selections.length}</p>
                  <p className="text-sm text-muted-foreground">Items Selected</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Clock className="h-8 w-8 text-orange-600" />
                <div>
                  <p className="text-2xl font-bold">{rfq.validity_days}d</p>
                  <p className="text-sm text-muted-foreground">Validity</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-4">
          <div className="lg:col-span-3">
            <Tabs defaultValue="comparison">
              <TabsList>
                <TabsTrigger value="comparison">Quote Comparison</TabsTrigger>
                <TabsTrigger value="items">RFQ Items</TabsTrigger>
              </TabsList>

              <TabsContent value="comparison" className="mt-6">
                {quotes.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium mb-2">Waiting for Quotes</h3>
                      <p className="text-muted-foreground">
                        Sellers have been notified. Quotes will appear here.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Quote Comparison</CardTitle>
                      <CardDescription className="text-xs">
                        Select the best offer per item. Best price highlighted.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="overflow-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-muted/50">
                              <TableHead className="sticky left-0 bg-muted/50 text-xs font-semibold w-[180px]">Component</TableHead>
                              <TableHead className="text-xs font-semibold w-[50px]">Qty</TableHead>
                              {quotes.map(quote => (
                                <TableHead key={quote.id} className="min-w-[180px] text-xs">
                                  <div className="space-y-0.5">
                                    <p className="font-semibold text-foreground">{quote.seller?.name}</p>
                                    <p className="text-[10px] text-muted-foreground font-normal">{quote.quote_number}</p>
                                  </div>
                                </TableHead>
                              ))}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {items.map(item => {
                              const bestPrice = bestPricePerItem.get(item.id);
                              const worstLead = worstLeadPerItem.get(item.id);

                              return (
                                <TableRow key={item.id} className="hover:bg-muted/30">
                                  <TableCell className="sticky left-0 bg-card text-xs font-medium w-[180px]">
                                    <p className="truncate leading-tight">{item.description}</p>
                                    {item.preferred_brand && (
                                      <p className="text-[10px] text-muted-foreground mt-0.5">Brand: {item.preferred_brand}</p>
                                    )}
                                  </TableCell>
                                  <TableCell className="text-xs">{item.quantity}</TableCell>
                                  {quotes.map(quote => {
                                    const quoteItem = quote.items?.find(qi => qi.rfq_item_id === item.id);
                                    if (!quoteItem) {
                                      return (
                                        <TableCell key={quote.id} className="text-xs text-muted-foreground italic">
                                          —
                                        </TableCell>
                                      );
                                    }

                                    const isBestPrice = bestPrice?.quoteItemId === quoteItem.id;
                                    const isWorstLead = worstLead && quoteItem.lead_time_days === worstLead && worstLead > 0;

                                    return (
                                      <TableCell key={quote.id} className="p-1.5">
                                        <div
                                          className={`p-2 rounded border cursor-pointer transition-all ${
                                            isSelected(quoteItem.id)
                                              ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                                              : isBestPrice
                                                ? 'border-primary/40 bg-primary/5'
                                                : 'border-transparent hover:border-border'
                                          }`}
                                          onClick={() => toggleSelection(quoteItem, quote)}
                                        >
                                          <div className="flex items-center justify-between gap-2">
                                            <div className="space-y-0.5">
                                              <div className="flex items-center gap-1.5">
                                                <span className="text-sm font-bold text-foreground">
                                                  <Currency value={quoteItem.unit_price} />
                                                </span>
                                                {isBestPrice && (
                                                  <Badge variant="default" className="text-[9px] h-3.5 px-1">
                                                    <Award className="h-2 w-2 mr-0.5" />Best
                                                  </Badge>
                                                )}
                                              </div>
                                              <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                                                <span>Total: <Currency value={quoteItem.total_price} /></span>
                                                {quoteItem.lead_time_days != null && (
                                                  <span className={isWorstLead ? 'text-destructive font-medium' : ''}>
                                                    {quoteItem.lead_time_days}d
                                                  </span>
                                                )}
                                              </div>
                                              {quoteItem.brand && (
                                                <p className="text-[10px] text-muted-foreground">
                                                  {quoteItem.brand}{quoteItem.model_number && ` / ${quoteItem.model_number}`}
                                                </p>
                                              )}
                                            </div>
                                            <Checkbox checked={isSelected(quoteItem.id)} className="h-3.5 w-3.5" />
                                          </div>
                                        </div>
                                      </TableCell>
                                    );
                                  })}
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="items" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>RFQ Items</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>#</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Preferred Brand</TableHead>
                          <TableHead>Specs</TableHead>
                          <TableHead>Target Price</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {items.map(item => (
                          <TableRow key={item.id}>
                            <TableCell>{item.line_number}</TableCell>
                            <TableCell className="font-medium">{item.description}</TableCell>
                            <TableCell>{item.quantity} {item.unit}</TableCell>
                            <TableCell>{item.preferred_brand || '-'}</TableCell>
                            <TableCell>{item.rating_specs || '-'}</TableCell>
                            <TableCell>
                              {item.target_price ? <Currency value={item.target_price} /> : '-'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Order Summary Sidebar */}
          <div>
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Items Selected</span>
                  <span className="font-medium">{selections.length} / {items.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sellers</span>
                  <span className="font-medium">{sellerCount}</span>
                </div>

                {/* Per-seller subtotals */}
                {sellerCount > 0 && (
                  <div className="space-y-2 pt-2 border-t">
                    {Array.from(sellerSubtotals.entries()).map(([id, data]) => (
                      <div key={id} className="flex justify-between text-sm">
                        <span className="text-muted-foreground truncate max-w-[120px]">{data.name}</span>
                        <span><Currency value={data.total} /> <span className="text-xs text-muted-foreground">({data.count} items)</span></span>
                      </div>
                    ))}
                  </div>
                )}

                <hr />
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total</span>
                  <Currency value={totalSelected} />
                </div>

                {sellerCount > 1 && (
                  <div className="p-3 bg-muted/50 rounded-lg text-sm">
                    <p className="font-medium">Multi-Seller Order</p>
                    <p className="text-muted-foreground">
                      This order will be fulfilled by {sellerCount} sellers with separate invoices.
                    </p>
                  </div>
                )}

                <Button
                  className="w-full"
                  size="lg"
                  disabled={selections.length === 0 || isLoading || rfq.status === 'converted'}
                  onClick={handleCreateOrder}
                >
                  {isLoading ? 'Creating Order...' : 'Create Order'}
                  <ShoppingCart className="ml-2 h-4 w-4" />
                </Button>

                {rfq.status === 'converted' && (
                  <p className="text-sm text-center text-muted-foreground">
                    This RFQ has already been converted to an order
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Container>
  );
};

export default RfqDetailPage;
