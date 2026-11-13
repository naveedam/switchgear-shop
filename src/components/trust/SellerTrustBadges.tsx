import { useEffect, useState } from "react";
import { BadgeCheck, ShieldCheck, Star, Truck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export interface SellerTrust {
  seller_id: string;
  gst_verified: boolean;
  bank_verified: boolean;
  avg_rating: number | null;
  review_count: number;
  on_time_pct: number | null;
  authorised_brands: string[];
}

const cache = new Map<string, Promise<SellerTrust | null>>();

export function fetchSellerTrust(sellerId: string): Promise<SellerTrust | null> {
  if (!cache.has(sellerId)) {
    cache.set(
      sellerId,
      Promise.resolve(
        supabase
          .from("seller_trust")
          .select("*")
          .eq("seller_id", sellerId)
          .maybeSingle(),
      ).then(({ data }) => (data as SellerTrust | null) ?? null),
    );
  }
  return cache.get(sellerId)!;
}

interface Props {
  sellerId: string | null | undefined;
  /** Highlight authorisation for this brand specifically. */
  brandName?: string | null;
  compact?: boolean;
}

export default function SellerTrustBadges({ sellerId, brandName, compact }: Props) {
  const [trust, setTrust] = useState<SellerTrust | null>(null);

  useEffect(() => {
    if (!sellerId) return;
    let alive = true;
    fetchSellerTrust(sellerId).then((t) => alive && setTrust(t));
    return () => {
      alive = false;
    };
  }, [sellerId]);

  if (!trust) return null;

  const authorisedForBrand =
    brandName && trust.authorised_brands.some((b) => b.toLowerCase() === brandName.toLowerCase());

  const chip = "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium";

  return (
    <TooltipProvider delayDuration={150}>
      <div className="flex flex-wrap items-center gap-1.5">
        {authorisedForBrand && (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className={`${chip} border-green-600/30 bg-green-50 text-green-800`}>
                <ShieldCheck className="h-3.5 w-3.5" /> Authorised {brandName} dealer
              </span>
            </TooltipTrigger>
            <TooltipContent>Dealer certificate from {brandName} verified by SwitchgearShop.</TooltipContent>
          </Tooltip>
        )}
        {!authorisedForBrand && !compact && trust.authorised_brands.length > 0 && (
          <span className={`${chip} border-green-600/30 bg-green-50 text-green-800`}>
            <ShieldCheck className="h-3.5 w-3.5" /> Authorised: {trust.authorised_brands.slice(0, 3).join(", ")}
          </span>
        )}
        {trust.gst_verified && (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className={`${chip} border-blue-600/30 bg-blue-50 text-blue-800`}>
                <BadgeCheck className="h-3.5 w-3.5" /> GST verified
              </span>
            </TooltipTrigger>
            <TooltipContent>GSTIN checked against the GST portal. You get a valid tax invoice for ITC.</TooltipContent>
          </Tooltip>
        )}
        {trust.review_count > 0 && trust.avg_rating != null && (
          <span className={`${chip} border-amber-500/30 bg-amber-50 text-amber-800`}>
            <Star className="h-3.5 w-3.5 fill-current" /> {Number(trust.avg_rating).toFixed(1)}
            <span className="font-normal">({trust.review_count})</span>
          </span>
        )}
        {!compact && trust.on_time_pct != null && trust.review_count >= 3 && (
          <span className={`${chip} text-muted-foreground`}>
            <Truck className="h-3.5 w-3.5" /> {trust.on_time_pct}% on time
          </span>
        )}
      </div>
    </TooltipProvider>
  );
}
