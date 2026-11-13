import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, CheckCircle2, Clock, Loader2, ShoppingCart, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/contexts/CartContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";

export interface InstantQuoteLine {
  bom_item_id: string;
  line_number: number;
  description: string;
  quantity: number;
  product_id: string | null;
  product_name: string | null;
  model_number: string | null;
  seller_id: string | null;
  seller_name: string | null;
  unit_price: number | null;
  line_total: number | null;
  in_stock: boolean | null;
  lead_time_days: number | null;
  dispatch_city: string | null;
  match_type: "exact" | "similar" | "none";
  offers_count: number;
}

const inr = (n: number) => `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

export function deliveryLabel(days: number | null, city: string | null, inStock: boolean | null) {
  if (inStock === false) return "Out of stock";
  if (days == null) return city ? `Ships from ${city}` : "In stock";
  const when = days <= 1 ? "Ships in 24h" : `Ships in ${days} days`;
  return city ? `${when} · ${city}` : when;
}

export default function InstantQuotePanel({ bomId }: { bomId: string }) {
  const navigate = useNavigate();
  const { addManyToCart } = useCart();
  const [lines, setLines] = useState<InstantQuoteLine[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase.rpc("instant_bom_quote", { p_bom_id: bomId });
      if (cancelled) return;
      if (error) setError(error.message);
      else setLines((data ?? []) as InstantQuoteLine[]);
    })();
    return () => {
      cancelled = true;
    };
  }, [bomId]);

  const { buyable, needsRfq, total, slowest } = useMemo(() => {
    const all = lines ?? [];
    const buyable = all.filter((l) => l.match_type === "exact" && l.in_stock && l.unit_price != null);
    const needsRfq = all.filter((l) => !buyable.includes(l));
    const total = buyable.reduce((s, l) => s + Number(l.line_total ?? 0), 0);
    const slowest = buyable.reduce((m, l) => Math.max(m, l.lead_time_days ?? 0), 0);
    return { buyable, needsRfq, total, slowest };
  }, [lines]);

  if (error) {
    return null; // Quote is a bonus; the RFQ path below still works.
  }

  if (!lines) {
    return (
      <Card>
        <CardContent className="py-8 flex items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Pricing your BOM against live seller stock…
        </CardContent>
      </Card>
    );
  }

  const addAll = () => {
    addManyToCart(
      buyable.map((l) => ({
        productId: l.product_id!,
        name: l.product_name ?? l.description,
        price: Number(l.unit_price),
        quantity: Math.max(1, Math.round(Number(l.quantity))),
        featuredImage: "",
      })),
    );
    toast({ title: `${buyable.length} items added to cart`, description: inr(total) });
    navigate("/cart");
  };

  return (
    <Card className="border-primary/40">
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" /> Instant quote
          </CardTitle>
          <CardDescription>
            {buyable.length} of {lines.length} lines can be ordered now at live prices
            {needsRfq.length > 0 && `; ${needsRfq.length} need seller quotes`}.
          </CardDescription>
        </div>
        {buyable.length > 0 && (
          <div className="text-right">
            <div className="text-2xl font-bold">{inr(total)}</div>
            <div className="text-xs text-muted-foreground">
              excl. GST · {slowest <= 1 ? "ships in 24h" : `ships within ${slowest} days`}
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">#</TableHead>
                <TableHead>Your line</TableHead>
                <TableHead>Best offer</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Unit</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Delivery</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lines.map((l) => {
                const ok = buyable.includes(l);
                return (
                  <TableRow key={l.bom_item_id} className={ok ? "" : "text-muted-foreground"}>
                    <TableCell>{l.line_number}</TableCell>
                    <TableCell className="max-w-[220px] truncate" title={l.description}>
                      {l.description}
                    </TableCell>
                    <TableCell>
                      {l.product_name ? (
                        <div>
                          <div className="font-medium text-foreground">{l.product_name}</div>
                          <div className="text-xs">
                            {l.seller_name}
                            {l.offers_count > 1 && ` · best of ${l.offers_count} offers`}
                          </div>
                          {l.match_type === "similar" && (
                            <Badge variant="outline" className="mt-1 text-[10px]">Similar: confirm via RFQ</Badge>
                          )}
                        </div>
                      ) : (
                        <Badge variant="secondary">Needs quote</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">{l.quantity}</TableCell>
                    <TableCell className="text-right">{l.unit_price != null ? inr(Number(l.unit_price)) : "—"}</TableCell>
                    <TableCell className="text-right font-medium">
                      {ok && l.line_total != null ? inr(Number(l.line_total)) : "—"}
                    </TableCell>
                    <TableCell className="text-xs whitespace-nowrap">
                      {l.product_id ? (
                        <span className="inline-flex items-center gap-1">
                          {l.in_stock ? <CheckCircle2 className="h-3 w-3 text-green-600" /> : <Clock className="h-3 w-3" />}
                          {deliveryLabel(l.lead_time_days, l.dispatch_city, l.in_stock)}
                        </span>
                      ) : "—"}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-end">
          {needsRfq.length > 0 && (
            <Button variant="outline" onClick={() => navigate(`/buyer/rfq/create/${bomId}`)}>
              Get quotes for {needsRfq.length === lines.length ? "all lines" : `remaining ${needsRfq.length}`}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
          {buyable.length > 0 && (
            <Button onClick={addAll}>
              <ShoppingCart className="mr-2 h-4 w-4" />
              Add {buyable.length} items to cart · {inr(total)}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
