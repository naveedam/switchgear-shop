import { useCallback, useEffect, useState } from "react";
import { BadgeCheck, ExternalLink, MessageCircle, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";

interface PendingAuth {
  id: string;
  status: string;
  document_url: string | null;
  valid_until: string | null;
  created_at: string;
  seller: { id: string; name: string | null } | null;
  brand: { name: string } | null;
}
interface GstRow { id: string; name: string | null; legal_name: string | null; gstin: string | null; gst_verified: boolean }
interface OutboxRow { id: number; template: string; status: string; attempts: number; last_error: string | null; created_at: string }

const GSTIN_RE = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

function BrandAuthQueue() {
  const { user } = useAuth();
  const [rows, setRows] = useState<PendingAuth[]>([]);
  const load = useCallback(() => {
    supabase.from("seller_brand_authorizations")
      .select("id, seller_id, status, document_url, valid_until, created_at, brand:brands(name)")
      .eq("status", "pending").order("created_at")
      .then(async ({ data }) => {
        const list = (data as unknown as (Omit<PendingAuth, "seller"> & { seller_id: string })[]) ?? [];
        const ids = [...new Set(list.map((r) => r.seller_id))];
        const { data: cos } = ids.length
          ? await supabase.from("companies").select("id, name").in("id", ids)
          : { data: [] as { id: string; name: string | null }[] };
        const names = new Map((cos ?? []).map((c) => [c.id, c]));
        setRows(list.map((r) => ({ ...r, seller: names.get(r.seller_id) ?? { id: r.seller_id, name: null } })));
      });
  }, []);
  useEffect(load, [load]);

  const open = async (path: string | null) => {
    if (!path) return;
    const { data, error } = await supabase.storage.from("dealer-certificates").createSignedUrl(path, 300);
    if (error || !data) return toast({ title: "Could not open file", description: error?.message, variant: "destructive" });
    window.open(data.signedUrl, "_blank", "noopener");
  };

  const decide = async (id: string, status: "active" | "rejected") => {
    const { error } = await supabase.from("seller_brand_authorizations")
      .update({ status, verified_by: user?.id, verified_at: new Date().toISOString() }).eq("id", id);
    if (error) return toast({ title: "Failed", description: error.message, variant: "destructive" });
    load();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg"><ShieldCheck className="h-5 w-5" /> Dealer certificates</CardTitle>
        <CardDescription>Check the certificate names the seller's legal entity, the brand, and a current date before approving.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader><TableRow><TableHead>Seller</TableHead><TableHead>Brand</TableHead><TableHead>Valid until</TableHead><TableHead>Certificate</TableHead><TableHead /></TableRow></TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell>{r.seller?.name}</TableCell>
                <TableCell>{r.brand?.name}</TableCell>
                <TableCell>{r.valid_until ?? "—"}</TableCell>
                <TableCell>
                  <Button size="sm" variant="link" className="px-0" onClick={() => open(r.document_url)}>
                    View <ExternalLink className="ml-1 h-3 w-3" />
                  </Button>
                </TableCell>
                <TableCell className="text-right space-x-2 whitespace-nowrap">
                  <Button size="sm" variant="outline" onClick={() => decide(r.id, "rejected")}>Reject</Button>
                  <Button size="sm" onClick={() => decide(r.id, "active")}>Approve</Button>
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-6">Nothing to review</TableCell></TableRow>}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function GstQueue() {
  const [rows, setRows] = useState<GstRow[]>([]);
  const load = useCallback(() => {
    supabase.from("companies").select("id, name, legal_name, gstin, gst_verified")
      .eq("gst_verified", false).not("gstin", "is", null).or("is_vendor.eq.true,role.eq.seller").limit(200)
      .then(({ data }) => setRows((data as GstRow[]) ?? []));
  }, []);
  useEffect(load, [load]);

  const verify = async (id: string) => {
    const { error } = await supabase.from("companies")
      .update({ gst_verified: true, gst_verified_at: new Date().toISOString() }).eq("id", id);
    if (error) return toast({ title: "Failed", description: error.message, variant: "destructive" });
    load();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg"><BadgeCheck className="h-5 w-5" /> GSTIN verification</CardTitle>
        <CardDescription>
          Search each GSTIN on the GST portal and check it is Active and the legal name matches before verifying.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader><TableRow><TableHead>Seller</TableHead><TableHead>Legal name</TableHead><TableHead>GSTIN</TableHead><TableHead /></TableRow></TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell>{r.name}</TableCell>
                <TableCell>{r.legal_name ?? "—"}</TableCell>
                <TableCell className="font-mono">
                  {r.gstin}{" "}
                  {r.gstin && !GSTIN_RE.test(r.gstin) && <Badge variant="destructive" className="ml-1">Invalid format</Badge>}
                </TableCell>
                <TableCell className="text-right space-x-2 whitespace-nowrap">
                  <Button size="sm" variant="link" asChild>
                    <a href="https://services.gst.gov.in/services/searchtp" target="_blank" rel="noopener noreferrer">
                      GST portal <ExternalLink className="ml-1 h-3 w-3" />
                    </a>
                  </Button>
                  <Button size="sm" onClick={() => verify(r.id)} disabled={!r.gstin || !GSTIN_RE.test(r.gstin)}>Mark verified</Button>
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-6">All sellers with a GSTIN are verified</TableCell></TableRow>}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function Outbox() {
  const [rows, setRows] = useState<OutboxRow[]>([]);
  useEffect(() => {
    supabase.from("notification_outbox").select("id, template, status, attempts, last_error, created_at")
      .order("id", { ascending: false }).limit(100)
      .then(({ data }) => setRows((data as OutboxRow[]) ?? []));
  }, []);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg"><MessageCircle className="h-5 w-5" /> WhatsApp log</CardTitle>
        <CardDescription>Last 100 notifications. Failed sends retry up to 3 times.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader><TableRow><TableHead>When</TableHead><TableHead>Template</TableHead><TableHead>Status</TableHead><TableHead>Error</TableHead></TableRow></TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="whitespace-nowrap">{new Date(r.created_at).toLocaleString("en-IN")}</TableCell>
                <TableCell className="font-mono text-xs">{r.template}</TableCell>
                <TableCell><Badge variant={r.status === "failed" ? "destructive" : r.status === "sent" ? "default" : "outline"}>{r.status}</Badge></TableCell>
                <TableCell className="max-w-xs truncate text-xs text-muted-foreground" title={r.last_error ?? ""}>{r.last_error}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export default function AdminTrust() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Seller trust</h1>
        <p className="text-muted-foreground">Verify GSTINs and dealer certificates. Approved sellers get badges on every listing.</p>
      </div>
      <Tabs defaultValue="dealers">
        <TabsList>
          <TabsTrigger value="dealers">Dealer certificates</TabsTrigger>
          <TabsTrigger value="gst">GSTIN</TabsTrigger>
          <TabsTrigger value="wa">WhatsApp log</TabsTrigger>
        </TabsList>
        <TabsContent value="dealers"><BrandAuthQueue /></TabsContent>
        <TabsContent value="gst"><GstQueue /></TabsContent>
        <TabsContent value="wa"><Outbox /></TabsContent>
      </Tabs>
    </div>
  );
}
