import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, ArrowLeft, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface RfqRow {
  id: string;
  rfq_number: string;
  title: string;
  status: string;
  source: string | null;
  customer_name: string | null;
  customer_company: string | null;
  customer_phone: string | null;
  customer_email: string | null;
  raw_message: string | null;
  notes: string | null;
  created_at: string;
}

interface ItemRow {
  id: string;
  line_number: number;
  manufacturer: string | null;
  product_family: string | null;
  part_number: string | null;
  description: string;
  quantity: number;
  unit: string;
}

interface QuoteItemRow {
  id: string;
  quote_id: string;
  rfq_item_id: string;
  quoted_part_number: string | null;
  unit_price: number;
  lead_time_days: number | null;
  warranty_months: number | null;
  exact_match: boolean;
  replacement_available: boolean;
  refurbished_available: boolean;
  stock_available: boolean;
  compatibility_type: string | null;
  compatibility_notes: string | null;
  notes: string | null;
  is_available: boolean;
  seller_name?: string;
}

const RfqCompare: React.FC = () => {
  const { rfqId } = useParams<{ rfqId: string }>();
  const { toast } = useToast();
  const [rfq, setRfq] = useState<RfqRow | null>(null);
  const [items, setItems] = useState<ItemRow[]>([]);
  const [quoteItems, setQuoteItems] = useState<QuoteItemRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!rfqId) return;
      setLoading(true);
      const [{ data: rfqData }, { data: itemData }] = await Promise.all([
        supabase.from('rfqs').select('*').eq('id', rfqId).maybeSingle(),
        supabase.from('rfq_items').select('*').eq('rfq_id', rfqId).order('line_number'),
      ]);
      setRfq(rfqData as any);
      setItems((itemData as any) || []);

      // Quotes for this rfq
      const { data: quotes } = await supabase
        .from('seller_quotes')
        .select('id, seller_id, companies:seller_id(name)')
        .eq('rfq_id', rfqId);
      const quoteIds = (quotes || []).map((q: any) => q.id);
      const sellerNameById = new Map<string, string>();
      (quotes || []).forEach((q: any) => sellerNameById.set(q.id, q.companies?.name || 'Unknown seller'));

      if (quoteIds.length > 0) {
        const { data: qItems } = await supabase
          .from('seller_quote_items')
          .select('*')
          .in('quote_id', quoteIds);
        setQuoteItems(((qItems as any) || []).map((qi: any) => ({
          ...qi,
          seller_name: sellerNameById.get(qi.quote_id) || 'Unknown',
        })));
      } else {
        setQuoteItems([]);
      }
      setLoading(false);
    };
    load();
  }, [rfqId]);

  const exportXlsx = () => {
    if (!rfq) return;
    const rows = items.map((it) => ({
      Manufacturer: it.manufacturer || '',
      'Product Family': it.product_family || '',
      'Part Number': it.part_number || '',
      Description: it.description,
      Quantity: it.quantity,
      Unit: it.unit,
      'Unit Price': '',
      'Discount %': '',
      'Net Price': '',
      'GST %': 18,
      'Lead Time': '',
      'Warranty': '',
      'Condition': 'New',
      'Seller Remarks': '',
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'RFQ Items');
    XLSX.writeFile(wb, `${rfq.rfq_number}.xlsx`);
    toast({ title: 'Spreadsheet downloaded' });
  };

  if (loading) {
    return (
      <div className="container mx-auto py-12 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  if (!rfq) return <div className="container mx-auto py-12">RFQ not found</div>;

  const quotesByItem = new Map<string, QuoteItemRow[]>();
  quoteItems.forEach((qi) => {
    if (!quotesByItem.has(qi.rfq_item_id)) quotesByItem.set(qi.rfq_item_id, []);
    quotesByItem.get(qi.rfq_item_id)!.push(qi);
  });

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link to="/admin/rfqs" className="text-sm text-muted-foreground inline-flex items-center mb-2">
            <ArrowLeft className="h-3 w-3 mr-1" />Back to RFQs
          </Link>
          <h1 className="text-2xl font-bold">{rfq.rfq_number}</h1>
          <p className="text-sm text-muted-foreground">{rfq.title}</p>
        </div>
        <Button onClick={exportXlsx}><Download className="h-4 w-4 mr-2" />Export RFQ Sheet</Button>
      </div>

      <Card className="mb-6">
        <CardHeader><CardTitle className="text-base">Customer</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div><div className="text-muted-foreground text-xs">Name</div>{rfq.customer_name || '—'}</div>
          <div><div className="text-muted-foreground text-xs">Company</div>{rfq.customer_company || '—'}</div>
          <div><div className="text-muted-foreground text-xs">Phone</div>{rfq.customer_phone || '—'}</div>
          <div><div className="text-muted-foreground text-xs">Email</div>{rfq.customer_email || '—'}</div>
          <div><div className="text-muted-foreground text-xs">Source</div><Badge variant="secondary">{rfq.source || 'web'}</Badge></div>
          <div><div className="text-muted-foreground text-xs">Status</div><Badge>{rfq.status}</Badge></div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader><CardTitle className="text-base">Line items ({items.length})</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">#</TableHead>
                <TableHead>Manufacturer</TableHead>
                <TableHead>Part Number</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Quotes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((it) => (
                <TableRow key={it.id}>
                  <TableCell>{it.line_number}</TableCell>
                  <TableCell>{it.manufacturer || '—'}</TableCell>
                  <TableCell className="font-mono text-xs">{it.part_number || '—'}</TableCell>
                  <TableCell className="text-sm">{it.description}</TableCell>
                  <TableCell className="text-right">{it.quantity} {it.unit}</TableCell>
                  <TableCell className="text-right">{(quotesByItem.get(it.id) || []).length}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quote comparison</CardTitle>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground">No line items.</p>
          ) : (
            <div className="space-y-6">
              {items.map((it) => {
                const qs = quotesByItem.get(it.id) || [];
                return (
                  <div key={it.id} className="border rounded-md p-4">
                    <div className="flex items-baseline justify-between mb-3">
                      <div>
                        <div className="text-sm font-semibold">
                          #{it.line_number} · {it.manufacturer || '—'} · <span className="font-mono">{it.part_number || '—'}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">{it.description} · Qty: {it.quantity} {it.unit}</div>
                      </div>
                    </div>
                    {qs.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic">No supplier quotes yet.</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Supplier</TableHead>
                              <TableHead>Quoted P/N</TableHead>
                              <TableHead>Compatibility</TableHead>
                              <TableHead className="text-right">Unit Price</TableHead>
                              <TableHead className="text-right">Lead Time</TableHead>
                              <TableHead className="text-right">Warranty</TableHead>
                              <TableHead>Stock</TableHead>
                              <TableHead>Notes</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {qs.sort((a, b) => a.unit_price - b.unit_price).map((q, idx) => (
                              <TableRow key={q.id} className={idx === 0 ? 'bg-green-50' : ''}>
                                <TableCell className="text-sm">{q.seller_name}</TableCell>
                                <TableCell className="font-mono text-xs">{q.quoted_part_number || '—'}</TableCell>
                                <TableCell>
                                  {q.exact_match && <Badge variant="default" className="text-xs">Exact</Badge>}
                                  {!q.exact_match && q.compatibility_type && (
                                    <Badge variant="secondary" className="text-xs">{q.compatibility_type.replace('_', ' ')}</Badge>
                                  )}
                                  {q.refurbished_available && <Badge variant="outline" className="ml-1 text-xs">Refurb</Badge>}
                                </TableCell>
                                <TableCell className="text-right">₹{Number(q.unit_price).toLocaleString('en-IN')}</TableCell>
                                <TableCell className="text-right text-sm">{q.lead_time_days ? `${q.lead_time_days}d` : '—'}</TableCell>
                                <TableCell className="text-right text-sm">{q.warranty_months ? `${q.warranty_months}mo` : '—'}</TableCell>
                                <TableCell>{q.stock_available ? <Badge variant="default" className="text-xs">In stock</Badge> : <span className="text-xs text-muted-foreground">—</span>}</TableCell>
                                <TableCell className="text-xs max-w-xs">{q.compatibility_notes || q.notes || '—'}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RfqCompare;
