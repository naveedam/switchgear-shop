import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ChevronRight, FileSpreadsheet } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { usePageMeta } from "@/hooks/usePageMeta";
import { brandPath, cleanName, productPath, slugify } from "@/lib/slug";
import NotFound from "./NotFound";

interface Brand { id: string; name: string; description: string | null; website: string | null }
interface Row {
  id: string; name: string; model_number: string | null; price: number | null; category: string | null;
  rated_current: string | null; pole_count: number | null; breaking_capacity: string | null;
  stock_quantity: number | null; lead_time_days: number | null;
}

const titleCase = (s: string) => s.replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()).replace(/\b(And|Of|For)\b/g, (w) => w.toLowerCase());
const inr = (n: number) => `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

/** /brands/:brandSlug and /brands/:brandSlug/:categorySlug: long-tail landing pages ("Schneider MCCB price list"). */
export default function BrandDetailPage() {
  const { brandSlug = "", categorySlug } = useParams();
  const [brand, setBrand] = useState<Brand | null | undefined>(undefined);
  const [rows, setRows] = useState<Row[]>([]);
  const [cats, setCats] = useState<{ slug: string; count: number }[]>([]);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    setBrand(undefined);
    setLoadError(false);
    supabase.from("brands").select("id, name, description, website").then(({ data, error }) => {
      if (error) return setLoadError(true);
      setBrand(((data as Brand[]) ?? []).find((b) => slugify(b.name) === brandSlug) ?? null);
    });
  }, [brandSlug]);

  useEffect(() => {
    if (!brand) return;
    supabase.from("products").select("category").eq("brand_id", brand.id).eq("status", "active").limit(5000)
      .then(({ data }) => {
        const m = new Map<string, number>();
        (data ?? []).forEach((r: { category: string | null }) => {
          if (r.category) m.set(r.category, (m.get(r.category) ?? 0) + 1);
        });
        setCats([...m].map(([c, count]) => ({ slug: c.replace(/_/g, "-"), count })).sort((a, b) => b.count - a.count));
      });
    let q = supabase.from("products")
      .select("id, name, model_number, price, category, rated_current, pole_count, breaking_capacity, stock_quantity, lead_time_days")
      .eq("brand_id", brand.id).eq("status", "active").order("name").limit(200);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (categorySlug) q = q.eq("category", categorySlug.replace(/-/g, "_") as any);
    q.then(({ data }) => setRows((data as unknown as Row[]) ?? []));
  }, [brand, categorySlug]);

  const catName = categorySlug ? titleCase(categorySlug) : "";
  const priced = useMemo(() => rows.filter((r) => Number(r.price) > 0).map((r) => Number(r.price)), [rows]);
  const range = priced.length ? `${inr(Math.min(...priced))} – ${inr(Math.max(...priced))}` : null;

  usePageMeta({
    title: brand
      ? categorySlug
        ? `${brand.name} ${catName} Price List ${new Date().getFullYear()} | SwitchgearShop.in`
        : `${brand.name} Switchgear Price List & Dealers | SwitchgearShop.in`
      : undefined,
    description: brand
      ? `${rows.length}+ ${brand.name} ${categorySlug ? catName.toLowerCase() : "products"}${range ? ` from ${range}` : ""}. Live prices from verified dealers, GST invoice, fast dispatch.`
      : undefined,
    canonical: brand ? `${window.location.origin}${brandPath(brand.name, categorySlug)}` : undefined,
  });

  if (loadError) {
    return (
      <div className="container mx-auto px-4 py-16 text-center space-y-4">
        <p className="text-muted-foreground">Couldn't load this page. Check your connection.</p>
        <Button variant="outline" onClick={() => window.location.reload()}>Try again</Button>
      </div>
    );
  }
  if (brand === null) return <NotFound />;
  if (brand === undefined) {
    return <div className="container mx-auto px-4 py-16 flex justify-center"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" /></div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <nav className="flex items-center gap-1 text-sm text-muted-foreground">
        <Link to="/" className="hover:text-foreground">Home</Link><ChevronRight className="h-3 w-3" />
        <Link to="/brands" className="hover:text-foreground">Brands</Link><ChevronRight className="h-3 w-3" />
        {categorySlug ? (
          <>
            <Link to={brandPath(brand.name)} className="hover:text-foreground">{brand.name}</Link><ChevronRight className="h-3 w-3" />
            <span className="text-foreground">{catName}</span>
          </>
        ) : <span className="text-foreground">{brand.name}</span>}
      </nav>

      <header className="space-y-2">
        <h1 className="text-3xl font-bold">
          {brand.name} {categorySlug ? catName : "switchgear"} price list
        </h1>
        <p className="text-muted-foreground max-w-3xl">
          {brand.description ||
            `Buy genuine ${brand.name} ${categorySlug ? catName.toLowerCase() : "electrical products"} from verified dealers. Live prices, GST invoices and dispatch from local stock.`}
          {range && ` Prices on this page range ${range} (excl. GST).`}
        </p>
        <div className="flex flex-wrap gap-2 pt-2">
          <Button asChild><Link to="/buyer/bom/upload"><FileSpreadsheet className="mr-2 h-4 w-4" /> Upload BOM for instant quote</Link></Button>
        </div>
      </header>

      {!categorySlug && cats.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-3">{brand.name} by category</h2>
          <div className="flex flex-wrap gap-2">
            {cats.map((c) => (
              <Link key={c.slug} to={brandPath(brand.name, c.slug)}>
                <Badge variant="outline" className="px-3 py-1 text-sm hover:bg-muted">
                  {titleCase(c.slug)} <span className="ml-1 text-muted-foreground">({c.count})</span>
                </Badge>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="px-3 py-2">Product</th>
              <th className="px-3 py-2">Model</th>
              <th className="px-3 py-2">Rating</th>
              <th className="px-3 py-2 text-right">Price (excl. GST)</th>
              <th className="px-3 py-2">Availability</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t hover:bg-muted/30">
                <td className="px-3 py-2"><Link className="text-primary hover:underline" to={productPath(r)}>{cleanName(r.name)}</Link></td>
                <td className="px-3 py-2 font-mono text-xs">{r.model_number}</td>
                <td className="px-3 py-2 text-xs">
                  {[r.rated_current, r.pole_count ? `${r.pole_count}P` : null, r.breaking_capacity].filter(Boolean).join(" · ")}
                </td>
                <td className="px-3 py-2 text-right">{Number(r.price) > 0 ? inr(Number(r.price)) : "On request"}</td>
                <td className="px-3 py-2 text-xs">
                  {r.stock_quantity === 0 ? "Out of stock" : r.lead_time_days != null ? `Ships in ${r.lead_time_days <= 1 ? "24h" : `${r.lead_time_days} days`}` : "In stock"}
                </td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={5} className="px-3 py-8 text-center text-muted-foreground">No products listed yet.</td></tr>}
          </tbody>
        </table>
      </section>
    </div>
  );
}
