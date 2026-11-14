import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Download, ExternalLink, FileJson, Truck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import {
  buildEInvoiceJson,
  buildEwayBillJson,
  downloadJson,
  parseIndianAddress,
  validateForEInvoice,
  validateTransport,
  type InvoiceForGst,
  type Party,
  type Transport,
} from "@/lib/gst/einvoice";

interface Props {
  invoiceId: string | null;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
}

interface Row {
  id: string;
  invoice_number: string;
  created_at: string;
  seller_id: string;
  seller_name: string | null;
  seller_gstin: string | null;
  seller_address: { street?: string; state_code?: string } | null;
  buyer_name: string | null;
  buyer_gstin: string | null;
  buyer_address: { street?: string; state_code?: string } | null;
  place_of_supply: string | null;
  reverse_charge: boolean | null;
  total_amount: number;
  irn: string | null;
  e_way_bill_no: string | null;
  invoice_items: {
    description: string; hsn_code: string | null; quantity: number; unit: string | null; unit_price: number;
    discount: number | null; taxable_value: number; cgst_rate: number | null; sgst_rate: number | null; igst_rate: number | null;
    cgst_amount: number | null; sgst_amount: number | null; igst_amount: number | null;
  }[];
}

const PLATFORM_GSTIN = import.meta.env.VITE_PLATFORM_GSTIN || null;

function toParty(name: string | null, gstin: string | null, addr: Row["seller_address"], legal?: string | null): Party {
  const parsed = parseIndianAddress(addr?.street);
  return {
    gstin: gstin?.toUpperCase() ?? null,
    legalName: legal || name || "",
    tradeName: name,
    addr1: parsed.addr1,
    location: parsed.location,
    pincode: parsed.pincode,
    stateCode: (addr?.state_code || gstin?.slice(0, 2) || "").padStart(2, "0"),
  };
}

function PartyFields({ who, p, onChange }: { who: string; p: Party; onChange: (p: Party) => void }) {
  return (
    <div className="space-y-2">
      <div className="text-sm font-medium">{who}</div>
      <div className="grid grid-cols-2 gap-2">
        <div className="col-span-2">
          <Label className="text-xs">Legal name</Label>
          <Input value={p.legalName} onChange={(e) => onChange({ ...p, legalName: e.target.value })} />
        </div>
        <div className="col-span-2">
          <Label className="text-xs">Address line</Label>
          <Input value={p.addr1} onChange={(e) => onChange({ ...p, addr1: e.target.value })} />
        </div>
        <div>
          <Label className="text-xs">City</Label>
          <Input value={p.location} onChange={(e) => onChange({ ...p, location: e.target.value })} />
        </div>
        <div>
          <Label className="text-xs">PIN code</Label>
          <Input inputMode="numeric" maxLength={6} value={p.pincode}
            onChange={(e) => onChange({ ...p, pincode: e.target.value.replace(/\D/g, "") })} />
        </div>
        <div>
          <Label className="text-xs">GSTIN</Label>
          <Input value={p.gstin ?? ""} onChange={(e) => onChange({ ...p, gstin: e.target.value.toUpperCase() })} />
        </div>
        <div>
          <Label className="text-xs">State code</Label>
          <Input maxLength={2} value={p.stateCode} onChange={(e) => onChange({ ...p, stateCode: e.target.value.replace(/\D/g, "") })} />
        </div>
      </div>
    </div>
  );
}

export default function EInvoiceDialog({ invoiceId, onOpenChange, onSaved }: Props) {
  const [row, setRow] = useState<Row | null>(null);
  const [seller, setSeller] = useState<Party | null>(null);
  const [buyer, setBuyer] = useState<Party | null>(null);
  const [transport, setTransport] = useState<Transport>({ distanceKm: 0, vehicleNo: "", transporterId: "", transporterName: "" });
  const [irn, setIrn] = useState("");
  const [ewb, setEwb] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!invoiceId) return;
    setRow(null);
    (async () => {
      const { data, error } = await supabase.from("invoices").select("*, invoice_items(*)").eq("id", invoiceId).single();
      if (error || !data) {
        toast({ title: "Could not load invoice", description: error?.message, variant: "destructive" });
        return;
      }
      const r = data as unknown as Row;
      const { data: co } = await supabase.from("companies").select("legal_name, email, phone").eq("id", r.seller_id).maybeSingle();
      setRow(r);
      setSeller({ ...toParty(r.seller_name, r.seller_gstin, r.seller_address, co?.legal_name), email: co?.email, phone: co?.phone });
      setBuyer(toParty(r.buyer_name, r.buyer_gstin, r.buyer_address));
      setIrn(r.irn ?? "");
      setEwb(r.e_way_bill_no ?? "");
    })();
  }, [invoiceId]);

  const invoice: InvoiceForGst | null = useMemo(() => {
    if (!row || !seller || !buyer) return null;
    return {
      number: row.invoice_number,
      date: row.created_at,
      seller,
      buyer,
      placeOfSupply: (row.place_of_supply || buyer.stateCode).padStart(2, "0"),
      reverseCharge: Boolean(row.reverse_charge),
      ecomGstin: PLATFORM_GSTIN,
      lines: row.invoice_items.map((it) => ({
        description: it.description,
        hsn: (it.hsn_code ?? "").replace(/\D/g, ""),
        quantity: Number(it.quantity),
        unit: it.unit,
        unitPrice: Number(it.unit_price),
        discount: Number(it.discount ?? 0),
        taxableValue: Number(it.taxable_value),
        gstRate: Number(it.igst_rate || 0) || Number(it.cgst_rate || 0) + Number(it.sgst_rate || 0),
        cgst: Number(it.cgst_amount ?? 0),
        sgst: Number(it.sgst_amount ?? 0),
        igst: Number(it.igst_amount ?? 0),
      })),
    };
  }, [row, seller, buyer]);

  const eiIssues = invoice ? validateForEInvoice(invoice) : [];
  const ewbIssues = invoice ? validateTransport(transport, Number(row?.total_amount ?? 0)).filter((i) => i.field !== "value") : [];
  const ewbOptional = Number(row?.total_amount ?? 0) <= 50000;
  const fileBase = row?.invoice_number.replace(/[^A-Za-z0-9-]/g, "_") ?? "invoice";

  const save = async () => {
    if (!row) return;
    setSaving(true);
    const now = new Date().toISOString();
    const { error } = await supabase.from("invoices").update({
      irn: irn.trim() || null,
      irn_date: irn.trim() && !row.irn ? now : undefined,
      e_way_bill_no: ewb.trim() || null,
      e_way_bill_date: ewb.trim() && !row.e_way_bill_no ? now : undefined,
    }).eq("id", row.id);
    setSaving(false);
    if (error) return toast({ title: "Could not save", description: error.message, variant: "destructive" });
    toast({ title: "Saved", description: "IRN / e-way bill recorded on the invoice." });
    onSaved?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={Boolean(invoiceId)} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><FileJson className="h-5 w-5" /> GST e-invoice & e-way bill</DialogTitle>
          <DialogDescription>
            {row ? `Invoice ${row.invoice_number}` : "Loading…"}. Download the JSON, upload it on the government portal, then record the
            IRN / e-way bill number here.
          </DialogDescription>
        </DialogHeader>

        {invoice && seller && buyer && (
          <Tabs defaultValue="einvoice">
            <TabsList>
              <TabsTrigger value="einvoice">e-Invoice (IRN)</TabsTrigger>
              <TabsTrigger value="ewb">e-Way bill</TabsTrigger>
              <TabsTrigger value="record">Record numbers</TabsTrigger>
            </TabsList>

            <TabsContent value="einvoice" className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Required if your aggregate turnover crosses ₹5 crore in any year since FY 2017-18, for B2B invoices.
              </p>
              <div className="grid md:grid-cols-2 gap-6">
                <PartyFields who="Seller (you)" p={seller} onChange={setSeller} />
                <PartyFields who="Buyer" p={buyer} onChange={setBuyer} />
              </div>
              {eiIssues.length > 0 ? (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <ul className="list-disc pl-4 text-sm">{eiIssues.map((i) => <li key={i.field + i.message}>{i.message}</li>)}</ul>
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert><CheckCircle2 className="h-4 w-4" /><AlertDescription>Ready for upload.</AlertDescription></Alert>
              )}
              <div className="flex flex-wrap gap-2">
                <Button disabled={eiIssues.length > 0}
                  onClick={() => downloadJson(`einvoice-${fileBase}.json`, [buildEInvoiceJson(invoice)])}>
                  <Download className="mr-2 h-4 w-4" /> Download e-invoice JSON
                </Button>
                <Button variant="outline" asChild>
                  <a href="https://einvoice1.gst.gov.in/" target="_blank" rel="noopener noreferrer">
                    Open IRP portal <ExternalLink className="ml-2 h-3 w-3" />
                  </a>
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="ewb" className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {ewbOptional
                  ? "This invoice is ₹50,000 or less, so an e-way bill is usually optional. Check your state's rule."
                  : "Required before goods move: invoice value is over ₹50,000."}
              </p>
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Distance (km)</Label>
                  <Input type="number" min={0} max={4000} value={transport.distanceKm || ""}
                    onChange={(e) => setTransport({ ...transport, distanceKm: Number(e.target.value) })} />
                </div>
                <div>
                  <Label className="text-xs">Vehicle number</Label>
                  <Input placeholder="KA01AB1234" value={transport.vehicleNo ?? ""}
                    onChange={(e) => setTransport({ ...transport, vehicleNo: e.target.value.toUpperCase() })} />
                </div>
                <div>
                  <Label className="text-xs">Transporter ID (optional)</Label>
                  <Input value={transport.transporterId ?? ""}
                    onChange={(e) => setTransport({ ...transport, transporterId: e.target.value.toUpperCase() })} />
                </div>
                <div>
                  <Label className="text-xs">Transporter name (optional)</Label>
                  <Input value={transport.transporterName ?? ""}
                    onChange={(e) => setTransport({ ...transport, transporterName: e.target.value })} />
                </div>
              </div>
              {ewbIssues.length > 0 && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <ul className="list-disc pl-4 text-sm">{ewbIssues.map((i) => <li key={i.field}>{i.message}</li>)}</ul>
                  </AlertDescription>
                </Alert>
              )}
              <div className="flex flex-wrap gap-2">
                <Button disabled={ewbIssues.length > 0 || eiIssues.some((i) => !i.field.startsWith("lines") && i.field !== "number" && !i.field.endsWith("gstin"))}
                  onClick={() => downloadJson(`ewaybill-${fileBase}.json`, buildEwayBillJson(invoice, transport))}>
                  <Truck className="mr-2 h-4 w-4" /> Download e-way bill JSON
                </Button>
                <Button variant="outline" disabled={eiIssues.length > 0 || ewbIssues.length > 0}
                  onClick={() => downloadJson(`einvoice-with-ewb-${fileBase}.json`, [buildEInvoiceJson(invoice, transport)])}>
                  e-Invoice + EWB in one file
                </Button>
                <Button variant="outline" asChild>
                  <a href="https://ewaybillgst.gov.in/" target="_blank" rel="noopener noreferrer">
                    Open e-way bill portal <ExternalLink className="ml-2 h-3 w-3" />
                  </a>
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="record" className="space-y-4">
              <div>
                <Label>IRN (64 characters, from the IRP)</Label>
                <Input className="font-mono text-xs" value={irn} onChange={(e) => setIrn(e.target.value.trim())} />
                {irn && !/^[a-f0-9]{64}$/i.test(irn) && <p className="text-xs text-destructive mt-1">An IRN is 64 hex characters.</p>}
              </div>
              <div>
                <Label>E-way bill number (12 digits)</Label>
                <Input inputMode="numeric" value={ewb} onChange={(e) => setEwb(e.target.value.replace(/\D/g, ""))} />
                {ewb && !/^\d{12}$/.test(ewb) && <p className="text-xs text-destructive mt-1">E-way bill numbers are 12 digits.</p>}
              </div>
              <Separator />
              <Button onClick={save}
                disabled={saving || (Boolean(irn) && !/^[a-f0-9]{64}$/i.test(irn)) || (Boolean(ewb) && !/^\d{12}$/.test(ewb))}>
                {saving ? "Saving…" : "Save to invoice"}
              </Button>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
