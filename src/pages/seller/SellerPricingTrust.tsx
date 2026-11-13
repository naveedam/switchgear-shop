import { useCallback, useEffect, useMemo, useState } from "react";
import { BadgeCheck, Plus, Search, ShieldCheck, Trash2, Truck, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import WhatsAppSettings from "@/components/trust/WhatsAppSettings";

interface ProductRow {
  id: string;
  name: string;
  model_number: string | null;
  price: number | null;
  lead_time_days: number | null;
  dispatch_city: string | null;
}
interface Tier { id?: string; min_qty: number; unit_price: number }
interface Rate { id: string; buyer_id: string; discount_pct: number; note: string | null; valid_until: string | null; buyer?: { name: string | null } | null }
interface Auth { id: string; brand_id: string; status: string; valid_until: string | null; brand?: { name: string } | null }
interface Brand { id: string; name: string }

const fail = (title: string, e: { message?: string } | null) =>
  toast({ title, description: e?.message, variant: "destructive" });

// ---------------------------------------------------------------- pricing tab
function ProductPricingRow({ p, onSaved }: { p: ProductRow; onSaved: () => void }) {
  const [open, setOpen] = useState(false);
  const [lead, setLead] = useState(p.lead_time_days?.toString() ?? "");
  const [city, setCity] = useState(p.dispatch_city ?? "");
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    supabase.from("product_price_tiers").select("id, min_qty, unit_price").eq("product_id", p.id).order("min_qty")
      .then(({ data }) => setTiers((data as Tier[]) ?? []));
  }, [open, p.id]);

  const save = async () => {
    const base = Number(p.price ?? 0);
    const clean = tiers.filter((t) => t.min_qty && t.unit_price);
    const sorted = [...clean].sort((a, b) => a.min_qty - b.min_qty);
    for (let i = 0; i < sorted.length; i++) {
      const prev = i === 0 ? base : sorted[i - 1].unit_price;
      if (sorted[i].min_qty < 2) return fail("Quantity breaks start at 2 units", null);
      if (sorted[i].unit_price >= prev) return fail("Each break must be cheaper than the one before it", null);
    }
    if (new Set(sorted.map((t) => t.min_qty)).size !== sorted.length) return fail("Duplicate quantity in breaks", null);

    setSaving(true);
    const { error: e1 } = await supabase.from("products").update({
      lead_time_days: lead === "" ? null : Number(lead),
      dispatch_city: city.trim() || null,
    }).eq("id", p.id);
    const { error: e2 } = await supabase.from("product_price_tiers").delete().eq("product_id", p.id);
    const { error: e3 } = sorted.length
      ? await supabase.from("product_price_tiers").insert(
          sorted.map((t) => ({ product_id: p.id, min_qty: t.min_qty, unit_price: t.unit_price })))
      : { error: null };
    setSaving(false);
    const err = e1 || e2 || e3;
    if (err) return fail("Could not save", err);
    toast({ title: "Saved", description: p.name });
    onSaved();
    setOpen(false);
  };

  return (
    <>
      <TableRow>
        <TableCell>
          <div className="font-medium">{p.name}</div>
          <div className="text-xs text-muted-foreground">{p.model_number}</div>
        </TableCell>
        <TableCell className="text-right">₹{Number(p.price ?? 0).toLocaleString("en-IN")}</TableCell>
        <TableCell>{p.lead_time_days != null ? `${p.lead_time_days} d` : <span className="text-muted-foreground">—</span>}</TableCell>
        <TableCell>{p.dispatch_city ?? <span className="text-muted-foreground">—</span>}</TableCell>
        <TableCell className="text-right">
          <Button size="sm" variant={open ? "secondary" : "outline"} onClick={() => setOpen(!open)}>
            {open ? "Close" : "Edit"}
          </Button>
        </TableCell>
      </TableRow>
      {open && (
        <TableRow className="bg-muted/30 hover:bg-muted/30">
          <TableCell colSpan={5}>
            <div className="grid md:grid-cols-[220px_1fr] gap-6 py-2">
              <div className="space-y-3">
                <div>
                  <Label>Dispatch time (days)</Label>
                  <Input type="number" min={0} max={180} value={lead} onChange={(e) => setLead(e.target.value)} placeholder="e.g. 2" />
                </div>
                <div>
                  <Label>Dispatch city</Label>
                  <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. Bengaluru" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Quantity breaks</Label>
                {tiers.map((t, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Input className="w-28" type="number" min={2} placeholder="Min qty" value={t.min_qty || ""}
                      onChange={(e) => setTiers(tiers.map((x, j) => (j === i ? { ...x, min_qty: Number(e.target.value) } : x)))} />
                    <span className="text-sm text-muted-foreground">+ units at ₹</span>
                    <Input className="w-32" type="number" min={1} step="0.01" placeholder="Unit price" value={t.unit_price || ""}
                      onChange={(e) => setTiers(tiers.map((x, j) => (j === i ? { ...x, unit_price: Number(e.target.value) } : x)))} />
                    <Button size="icon" variant="ghost" onClick={() => setTiers(tiers.filter((_, j) => j !== i))}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setTiers([...tiers, { min_qty: 0, unit_price: 0 }])}>
                    <Plus className="mr-1 h-3 w-3" /> Add break
                  </Button>
                  <Button size="sm" onClick={save} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
                </div>
              </div>
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

function PricingTab({ sellerId }: { sellerId: string }) {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [q, setQ] = useState("");
  const load = useCallback(() => {
    supabase.from("products").select("id, name, model_number, price, lead_time_days, dispatch_city")
      .eq("vendor_id", sellerId).order("name").limit(500)
      .then(({ data }) => setProducts((data as ProductRow[]) ?? []));
  }, [sellerId]);
  useEffect(load, [load]);

  const shown = useMemo(() => {
    const s = q.toLowerCase();
    return products.filter((p) => !s || p.name.toLowerCase().includes(s) || p.model_number?.toLowerCase().includes(s));
  }, [products, q]);
  const missingLead = products.filter((p) => p.lead_time_days == null).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg"><Truck className="h-5 w-5" /> Delivery & quantity pricing</CardTitle>
        <CardDescription>
          Buyers filter and compare by dispatch time. Products with a dispatch time win more instant-quote lines.
          {missingLead > 0 && <span className="text-amber-700"> {missingLead} products have no dispatch time yet.</span>}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="relative max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input className="pl-8" placeholder="Search name or model" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead className="text-right">List price</TableHead>
              <TableHead>Dispatch</TableHead>
              <TableHead>From</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {shown.map((p) => <ProductPricingRow key={p.id} p={p} onSaved={load} />)}
            {shown.length === 0 && (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No products</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------- account rates tab
function RatesTab({ sellerId }: { sellerId: string }) {
  const [rates, setRates] = useState<Rate[]>([]);
  const [buyers, setBuyers] = useState<{ id: string; name: string | null }[]>([]);
  const [buyerId, setBuyerId] = useState("");
  const [pct, setPct] = useState("");
  const [note, setNote] = useState("");

  const load = useCallback(() => {
    supabase.from("buyer_seller_rates").select("id, buyer_id, discount_pct, note, valid_until, buyer:companies!buyer_seller_rates_buyer_id_fkey(name)")
      .eq("seller_id", sellerId).then(({ data }) => setRates((data as unknown as Rate[]) ?? []));
  }, [sellerId]);
  useEffect(load, [load]);

  // Buyers you've already sold to: the realistic list for account pricing.
  useEffect(() => {
    supabase.rpc("seller_past_buyers").then(({ data }) => {
      setBuyers(((data as { buyer_id: string; name: string | null }[] | null) ?? []).map((b) => ({ id: b.buyer_id, name: b.name })));
    });
  }, [sellerId]);

  const add = async () => {
    const d = Number(pct);
    if (!buyerId || !(d > 0 && d <= 50)) return fail("Pick a buyer and a discount between 0.5% and 50%", null);
    const { error } = await supabase.from("buyer_seller_rates")
      .upsert({ seller_id: sellerId, buyer_id: buyerId, discount_pct: d, note: note || null }, { onConflict: "seller_id,buyer_id" });
    if (error) return fail("Could not save", error);
    setPct(""); setNote(""); setBuyerId("");
    load();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg"><Users className="h-5 w-5" /> Account rates</CardTitle>
        <CardDescription>
          Give repeat contractors and panel builders a standing discount across your whole catalogue.
          It applies automatically at checkout and in instant quotes, on top of quantity breaks.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-end gap-2">
          <div className="min-w-[220px]">
            <Label>Buyer</Label>
            <Select value={buyerId} onValueChange={setBuyerId}>
              <SelectTrigger><SelectValue placeholder={buyers.length ? "Choose a past buyer" : "No past buyers yet"} /></SelectTrigger>
              <SelectContent>
                {buyers.map((b) => <SelectItem key={b.id} value={b.id}>{b.name || b.id.slice(0, 8)}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="w-28">
            <Label>Discount %</Label>
            <Input type="number" min={0.5} max={50} step="0.5" value={pct} onChange={(e) => setPct(e.target.value)} />
          </div>
          <div className="flex-1 min-w-[160px]">
            <Label>Note (optional)</Label>
            <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Annual rate contract" />
          </div>
          <Button onClick={add}>Save rate</Button>
        </div>
        <Table>
          <TableHeader><TableRow><TableHead>Buyer</TableHead><TableHead>Discount</TableHead><TableHead>Note</TableHead><TableHead /></TableRow></TableHeader>
          <TableBody>
            {rates.map((r) => (
              <TableRow key={r.id}>
                <TableCell>{r.buyer?.name || buyers.find((b) => b.id === r.buyer_id)?.name || r.buyer_id.slice(0, 8)}</TableCell>
                <TableCell>{r.discount_pct}%</TableCell>
                <TableCell className="text-muted-foreground">{r.note}</TableCell>
                <TableCell className="text-right">
                  <Button size="icon" variant="ghost" onClick={async () => {
                    await supabase.from("buyer_seller_rates").delete().eq("id", r.id);
                    load();
                  }}><Trash2 className="h-4 w-4" /></Button>
                </TableCell>
              </TableRow>
            ))}
            {rates.length === 0 && (
              <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-6">No account rates yet</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------- trust tab
function TrustTab({ sellerId }: { sellerId: string }) {
  const [auths, setAuths] = useState<Auth[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [brandId, setBrandId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [validUntil, setValidUntil] = useState("");
  const [busy, setBusy] = useState(false);
  const [gst, setGst] = useState<{ gstin: string | null; gst_verified: boolean } | null>(null);

  const load = useCallback(() => {
    supabase.from("seller_brand_authorizations").select("id, brand_id, status, valid_until, brand:brands(name)")
      .eq("seller_id", sellerId).then(({ data }) => setAuths((data as unknown as Auth[]) ?? []));
    supabase.from("companies").select("gstin, gst_verified").eq("id", sellerId).maybeSingle()
      .then(({ data }) => setGst(data as { gstin: string | null; gst_verified: boolean } | null));
  }, [sellerId]);
  useEffect(load, [load]);
  useEffect(() => {
    supabase.from("brands").select("id, name").order("name").then(({ data }) => setBrands((data as Brand[]) ?? []));
  }, []);

  const submit = async () => {
    if (!brandId || !file) return fail("Choose a brand and attach the dealer certificate", null);
    if (file.size > 10 * 1024 * 1024) return fail("File must be under 10 MB", null);
    setBusy(true);
    const path = `${sellerId}/${brandId}-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const { error: upErr } = await supabase.storage.from("dealer-certificates").upload(path, file);
    if (upErr) { setBusy(false); return fail("Upload failed", upErr); }
    const { error } = await supabase.from("seller_brand_authorizations").upsert({
      seller_id: sellerId, brand_id: brandId, document_url: path, status: "pending",
      valid_until: validUntil || null,
    }, { onConflict: "seller_id,brand_id" });
    setBusy(false);
    if (error) return fail("Could not submit", error);
    toast({ title: "Submitted for verification", description: "Usually reviewed within 1 working day." });
    setBrandId(""); setFile(null); setValidUntil("");
    load();
  };

  const statusBadge = (s: string) =>
    s === "active" ? <Badge className="bg-green-100 text-green-800">Verified</Badge>
    : s === "rejected" ? <Badge variant="destructive">Rejected</Badge>
    : s === "expired" ? <Badge variant="secondary">Expired</Badge>
    : <Badge variant="outline">Under review</Badge>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg"><BadgeCheck className="h-5 w-5" /> GST verification</CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          {gst?.gst_verified
            ? <span className="text-green-700">GSTIN {gst.gstin} is verified. Buyers see a "GST verified" badge on your listings.</span>
            : gst?.gstin
              ? <span>GSTIN {gst.gstin} is awaiting verification by our team.</span>
              : <span className="text-amber-700">Add your GSTIN in your profile to get the "GST verified" badge.</span>}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg"><ShieldCheck className="h-5 w-5" /> Authorised dealer badges</CardTitle>
          <CardDescription>
            Upload your OEM dealership / distributor certificate. Verified brands show an "Authorised dealer" badge on every listing of that brand,
            which is the biggest single trust signal for buyers worried about counterfeit breakers.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-end gap-2">
            <div className="min-w-[200px]">
              <Label>Brand</Label>
              <Select value={brandId} onValueChange={setBrandId}>
                <SelectTrigger><SelectValue placeholder="Choose brand" /></SelectTrigger>
                <SelectContent>{brands.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Certificate (PDF/image)</Label>
              <Input type="file" accept=".pdf,image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            </div>
            <div>
              <Label>Valid until (optional)</Label>
              <Input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />
            </div>
            <Button onClick={submit} disabled={busy}>{busy ? "Uploading…" : "Submit"}</Button>
          </div>
          <Table>
            <TableHeader><TableRow><TableHead>Brand</TableHead><TableHead>Status</TableHead><TableHead>Valid until</TableHead></TableRow></TableHeader>
            <TableBody>
              {auths.map((a) => (
                <TableRow key={a.id}>
                  <TableCell>{a.brand?.name}</TableCell>
                  <TableCell>{statusBadge(a.status)}</TableCell>
                  <TableCell>{a.valid_until ?? "—"}</TableCell>
                </TableRow>
              ))}
              {auths.length === 0 && (
                <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-6">No authorisations submitted</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <WhatsAppSettings audience="seller" />
    </div>
  );
}

export default function SellerPricingTrust() {
  const { user } = useAuth();
  if (!user) return null;
  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Pricing & trust</h1>
        <p className="text-muted-foreground">Win more orders with quantity pricing, fast dispatch and verified badges.</p>
      </div>
      <Tabs defaultValue="pricing">
        <TabsList>
          <TabsTrigger value="pricing">Delivery & pricing</TabsTrigger>
          <TabsTrigger value="rates">Account rates</TabsTrigger>
          <TabsTrigger value="trust">Badges & alerts</TabsTrigger>
        </TabsList>
        <TabsContent value="pricing"><PricingTab sellerId={user.id} /></TabsContent>
        <TabsContent value="rates"><RatesTab sellerId={user.id} /></TabsContent>
        <TabsContent value="trust"><TrustTab sellerId={user.id} /></TabsContent>
      </Tabs>
    </div>
  );
}
