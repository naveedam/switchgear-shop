import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Tier {
  min_qty: number;
  unit_price: number;
}

const inr = (n: number) => `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

/** Quantity-break table + "your price" for signed-in buyers with an account rate. */
export default function PriceTiers({ productId, listPrice }: { productId: string; listPrice: number }) {
  const { isAuthenticated } = useAuth();
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [yourPrice, setYourPrice] = useState<number | null>(null);

  useEffect(() => {
    supabase
      .from("product_price_tiers")
      .select("min_qty, unit_price")
      .eq("product_id", productId)
      .order("min_qty")
      .then(({ data }) => setTiers((data as Tier[]) ?? []));
  }, [productId]);

  useEffect(() => {
    if (!isAuthenticated) return;
    supabase
      .rpc("unit_price_for", { p_product_id: productId, p_qty: 1 })
      .then(({ data }) => {
        const p = data == null ? null : Number(data);
        setYourPrice(p != null && p < listPrice ? p : null);
      });
  }, [productId, listPrice, isAuthenticated]);

  if (tiers.length === 0 && yourPrice == null && isAuthenticated) return null;

  return (
    <div className="space-y-2">
      {yourPrice != null && (
        <div className="text-sm">
          <span className="font-semibold text-green-700">Your account price: {inr(yourPrice)}</span>
          <span className="ml-2 text-muted-foreground line-through">{inr(listPrice)}</span>
        </div>
      )}
      {tiers.length > 0 && (
        <div className="rounded-lg border text-sm overflow-hidden">
          <div className="grid grid-cols-[1fr_auto_auto] gap-x-6 bg-muted/50 px-3 py-1.5 text-xs font-medium text-muted-foreground">
            <span>Quantity</span>
            <span className="text-right">Unit price</span>
            <span className="text-right">You save</span>
          </div>
          <div className="grid grid-cols-[1fr_auto_auto] gap-x-6 px-3 py-1.5">
            <span>1 – {tiers[0].min_qty - 1}</span>
            <span className="text-right">{inr(listPrice)}</span>
            <span className="text-right text-muted-foreground">—</span>
          </div>
          {tiers.map((t, i) => (
            <div key={t.min_qty} className="grid grid-cols-[1fr_auto_auto] gap-x-6 border-t px-3 py-1.5">
              <span>{tiers[i + 1] ? `${t.min_qty} – ${tiers[i + 1].min_qty - 1}` : `${t.min_qty}+`}</span>
              <span className="text-right font-medium">{inr(Number(t.unit_price))}</span>
              <span className="text-right text-green-700">
                {Math.round((1 - Number(t.unit_price) / listPrice) * 100)}%
              </span>
            </div>
          ))}
        </div>
      )}
      {!isAuthenticated && (
        <p className="text-xs text-muted-foreground">
          <Link to="/login" className="text-primary underline underline-offset-2">Sign in</Link> to see contractor
          and account pricing.
        </p>
      )}
    </div>
  );
}
