import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, Copy, Download, Mail, RefreshCw } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

interface Prospect {
  id: string;
  name: string;
  role: string;
  company: string;
  industry: string;
  email: string;
  phone: string;
  city: string;
  source: string;
  spend: string;
  notes: string;
  status: string;
  score: number;
  created_at: string;
}

const TEMPLATES: Record<string, { subject: string; body: string }> = {
  epc: {
    subject: "Faster switchgear sourcing for your projects — SwitchgearShop.in",
    body: `Hi [Name],

I noticed [Company] is working on significant construction projects in Bangalore. Sourcing LV switchgear — MCBs, MCCBs, contactors — across multiple brands and distributors can eat up a lot of procurement time.

We built SwitchgearShop.in specifically for this — 1,000+ products from ABB, Schneider, Havells, L&T, Siemens and 7 other brands, with a BOM upload feature that lets your team extract components from project drawings and generate RFQs automatically.

Payment goes through escrow so your capital is protected until delivery milestones are met.

Would you be open to a quick 15-minute call this week?

Warm regards,
Naveed Ahmed
Founder, SwitchgearShop.in`
  },
  mfg: {
    subject: "Streamline your electrical component procurement — SwitchgearShop.in",
    body: `Hi [Name],

Managing recurring procurement of switchgear for your plant — contactors, MCCBs, overload relays — often means juggling multiple distributors and inconsistent pricing.

SwitchgearShop.in consolidates this: 1,000+ products from 12 brands, transparent pricing, and escrow-protected payments. Upload your standard BOM and get instant matched quotes from verified sellers.

We are onboarding our first batch of Bangalore manufacturing companies with priority access. Happy to set up your team with a demo.

Best,
Naveed Ahmed
SwitchgearShop.in`
  },
  panel: {
    subject: "Source ABB, Schneider, Havells panel components in one place",
    body: `Hi [Name],

Panel builders spend a disproportionate amount of time sourcing components across brands for each job. We built SwitchgearShop.in to fix that.

Upload your panel BOM, our AI extracts the components, and you get matched to verified sellers with stock. 1,000+ products from ABB, Schneider, Havells, L&T, Hager, Legrand and more.

Would love to show you how the BOM-to-RFQ workflow works.

Regards,
Naveed Ahmed
SwitchgearShop.in`
  },
  fm: {
    subject: "One platform for all your facility switchgear needs",
    body: `Hi [Name],

Facilities teams dealing with AMC and maintenance procurement know the pain — multiple brands, multiple distributors, no price transparency.

SwitchgearShop.in gives your team a single platform for MCBs, RCCBs, contactors and distribution board components across 12 brands. Verified sellers, escrow payments, GST invoices from each seller.

Happy to give you a quick walkthrough.

Best,
Naveed Ahmed
SwitchgearShop.in`
  }
};

const SPEND_LABELS: Record<string, string> = {
  low: "Under ₹50K", med: "₹50K–₹5L", high: "₹5L–₹25L", very_high: "Above ₹25L"
};

const SAMPLE_PROSPECTS = [
  { name: "Suresh Babu", role: "Purchase Engineer", company: "Brigade Group", industry: "Real Estate / Developers", email: "", phone: "", city: "Bangalore", source: "LinkedIn", spend: "high", notes: "Procurement for residential towers, uses Havells and Legrand" },
  { name: "Kiran Reddy", role: "Sr. Procurement Manager", company: "Prestige Constructions", industry: "EPC / Construction", email: "", phone: "", city: "Bangalore", source: "LinkedIn", spend: "very_high", notes: "Large commercial projects, buys ABB and Schneider in bulk" },
  { name: "Mohammed Farooq", role: "Electrical Engineer", company: "Voltas Limited", industry: "Facilities Management", email: "", phone: "", city: "Bangalore", source: "IndiaMART", spend: "med", notes: "HVAC and electrical maintenance contracts" },
  { name: "Anand Krishnamurthy", role: "Panel Builder", company: "AK Electricals", industry: "Panel Builder", email: "", phone: "", city: "Bangalore", source: "Referral", spend: "med", notes: "Builds MCC and PCC panels, sources from Chamrajpet market" },
  { name: "Priya Nair", role: "Purchase Manager", company: "Manyata Tech Park", industry: "Data Center / IT Parks", email: "", phone: "", city: "Bangalore", source: "LinkedIn", spend: "high", notes: "Facility maintenance procurement, prefers vendor consolidation" },
  { name: "Deepak Yadav", role: "Procurement Head", company: "Sobha Limited", industry: "Real Estate / Developers", email: "", phone: "", city: "Bangalore", source: "LinkedIn", spend: "very_high", notes: "Luxury residential projects, quality focused" },
];

function calcScore(p: Partial<Prospect>): number {
  let s = 0;
  if (["EPC / Construction", "Panel Builder", "Manufacturing"].includes(p.industry || "")) s += 3;
  if (["Data Center / IT Parks", "Facilities Management"].includes(p.industry || "")) s += 2;
  if (p.spend === "very_high") s += 3;
  else if (p.spend === "high") s += 2;
  else if (p.spend === "med") s += 1;
  if (p.email) s += 1;
  if (p.phone) s += 1;
  return s;
}

function getPriority(score: number) {
  if (score >= 5) return { label: "High", variant: "default" as const };
  if (score >= 3) return { label: "Medium", variant: "secondary" as const };
  return { label: "Low", variant: "outline" as const };
}

function getTemplateKey(industry: string): string {
  if (industry === "Panel Builder") return "panel";
  if (industry === "EPC / Construction") return "epc";
  if (["Facilities Management", "Data Center / IT Parks"].includes(industry)) return "fm";
  return "mfg";
}

const AdminBuyerOutreach: React.FC = () => {
  const { user } = useAuth();
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<"add" | "list" | "templates">("add");
  const [filterIndustry, setFilterIndustry] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [emailVisible, setEmailVisible] = useState<Record<string, boolean>>({});
  const [form, setForm] = useState({
    name: "", role: "", company: "", industry: "",
    email: "", phone: "", city: "Bangalore",
    source: "LinkedIn", spend: "med", notes: ""
  });

  useEffect(() => { fetchProspects(); }, []);

  const fetchProspects = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("prospects")
        .select("*")
        .order("score", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      setProspects(data || []);
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "Failed to load prospects", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const addProspect = async () => {
    if (!form.name || !form.company) {
      toast({ title: "Required", description: "Name and company are required", variant: "destructive" });
      return;
    }
    try {
      setSaving(true);
      const score = calcScore(form);
      const { data, error } = await supabase
        .from("prospects")
        .insert([{ ...form, score, status: "new", created_by: user?.id }])
        .select()
        .single();
      if (error) throw error;
      setProspects(prev => [data, ...prev]);
      setForm({ name: "", role: "", company: "", industry: "", email: "", phone: "", city: "Bangalore", source: "LinkedIn", spend: "med", notes: "" });
      setTab("list");
      toast({ title: "Prospect added", description: `${data.name} from ${data.company} saved.` });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const loadSamples = async () => {
    try {
      setSaving(true);
      const rows = SAMPLE_PROSPECTS.map(s => ({ ...s, score: calcScore(s), status: "new", created_by: user?.id }));
      const { data, error } = await supabase.from("prospects").insert(rows).select();
      if (error) throw error;
      setProspects(prev => [...(data || []), ...prev]);
      setTab("list");
      toast({ title: "Sample leads loaded", description: `${data?.length} Bangalore prospects added.` });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("prospects").update({ status }).eq("id", id);
    if (!error) setProspects(prev => prev.map(p => p.id === id ? { ...p, status } : p));
  };

  const deleteProspect = async (id: string) => {
    const { error } = await supabase.from("prospects").delete().eq("id", id);
    if (!error) {
      setProspects(prev => prev.filter(p => p.id !== id));
      toast({ title: "Deleted" });
    }
  };

  const generateEmail = (p: Prospect): string => {
    const key = getTemplateKey(p.industry);
    return TEMPLATES[key].body
      .replace("[Name]", p.name.split(" ")[0])
      .replace("[Company]", p.company);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard" });
  };

  const exportCSV = () => {
    const headers = ["Name","Role","Company","Industry","Email","Phone","City","Source","Spend","Status","Score","Notes","Created"];
    const rows = prospects.map(p => [p.name,p.role,p.company,p.industry,p.email,p.phone,p.city,p.source,p.spend,p.status,p.score,p.notes,p.created_at].map(v => `"${v||""}"`).join(","));
    const csv = [headers.join(","), ...rows].join("\n");
    const a = document.createElement("a");
    a.href = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
    a.download = "switchgearshop_prospects.csv";
    a.click();
  };

  const filtered = prospects
    .filter(p => (!filterIndustry || p.industry === filterIndustry) && (!filterStatus || p.status === filterStatus));

  const stats = {
    total: prospects.length,
    high: prospects.filter(p => p.score >= 5).length,
    emailed: prospects.filter(p => p.status === "emailed").length,
    replied: prospects.filter(p => p.status === "replied").length,
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">Buyer Outreach</h1>
          <p className="text-sm text-muted-foreground">CRM for purchase engineers and procurement managers in Bangalore.</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchProspects}>
          <RefreshCw className="h-4 w-4 mr-1" /> Refresh
        </Button>
      </div>

      <div className="flex gap-2 mb-6 border-b">
        {(["add","list","templates"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm capitalize border-b-2 transition-colors ${tab === t ? "border-primary font-medium" : "border-transparent text-muted-foreground"}`}>
            {t === "add" ? "Add prospect" : t === "list" ? `Prospects (${prospects.length})` : "Email templates"}
          </button>
        ))}
      </div>

      {tab === "add" && (
        <Card>
          <CardHeader><CardTitle className="text-base">New prospect</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-xs text-muted-foreground mb-1 block">Contact name *</label>
                <Input value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))} placeholder="Rajesh Kumar" /></div>
              <div><label className="text-xs text-muted-foreground mb-1 block">Designation</label>
                <Input value={form.role} onChange={e => setForm(p => ({...p, role: e.target.value}))} placeholder="Purchase Engineer" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-xs text-muted-foreground mb-1 block">Company *</label>
                <Input value={form.company} onChange={e => setForm(p => ({...p, company: e.target.value}))} placeholder="Shapoorji Pallonji" /></div>
              <div><label className="text-xs text-muted-foreground mb-1 block">Industry</label>
                <select className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                  value={form.industry} onChange={e => setForm(p => ({...p, industry: e.target.value}))}>
                  <option value="">Select industry</option>
                  {["EPC / Construction","Manufacturing","Data Center / IT Parks","Real Estate / Developers","Facilities Management","Electrical Contractor","Panel Builder","Government / PSU","Hospitality","Healthcare"].map(i => <option key={i}>{i}</option>)}
                </select></div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div><label className="text-xs text-muted-foreground mb-1 block">Email</label>
                <Input value={form.email} onChange={e => setForm(p => ({...p, email: e.target.value}))} placeholder="rajesh@company.com" /></div>
              <div><label className="text-xs text-muted-foreground mb-1 block">Phone</label>
                <Input value={form.phone} onChange={e => setForm(p => ({...p, phone: e.target.value}))} placeholder="+91 98xxxxxxxx" /></div>
              <div><label className="text-xs text-muted-foreground mb-1 block">City</label>
                <Input value={form.city} onChange={e => setForm(p => ({...p, city: e.target.value}))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-xs text-muted-foreground mb-1 block">Source</label>
                <select className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                  value={form.source} onChange={e => setForm(p => ({...p, source: e.target.value}))}>
                  {["LinkedIn","IndiaMART","Referral","Cold outreach","Conference","Trade directory","Chamrajpet market visit"].map(s => <option key={s}>{s}</option>)}
                </select></div>
              <div><label className="text-xs text-muted-foreground mb-1 block">Est. monthly spend</label>
                <select className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                  value={form.spend} onChange={e => setForm(p => ({...p, spend: e.target.value}))}>
                  <option value="low">Under ₹50,000</option>
                  <option value="med">₹50K – ₹5L</option>
                  <option value="high">₹5L – ₹25L</option>
                  <option value="very_high">Above ₹25L</option>
                </select></div>
            </div>
            <div><label className="text-xs text-muted-foreground mb-1 block">Notes</label>
              <Input value={form.notes} onChange={e => setForm(p => ({...p, notes: e.target.value}))} placeholder="Brands used, pain points, project type..." /></div>
            <div className="flex gap-3 pt-2">
              <Button onClick={addProspect} disabled={saving}>
                {saving ? "Saving..." : "Save prospect"}
              </Button>
              <Button variant="outline" onClick={loadSamples} disabled={saving}>
                Load sample Bangalore leads
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {tab === "list" && (
        <div>
          <div className="grid grid-cols-4 gap-4 mb-6">
            {[["Total", stats.total], ["High priority", stats.high], ["Emailed", stats.emailed], ["Replied", stats.replied]].map(([label, val]) => (
              <div key={label as string} className="bg-muted/50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold">{val}</div>
                <div className="text-xs text-muted-foreground mt-1">{label}</div>
              </div>
            ))}
          </div>

          <div className="flex gap-3 mb-4">
            <select className="h-9 px-3 rounded-md border border-input bg-background text-sm flex-1"
              value={filterIndustry} onChange={e => setFilterIndustry(e.target.value)}>
              <option value="">All industries</option>
              {["EPC / Construction","Manufacturing","Data Center / IT Parks","Real Estate / Developers","Facilities Management","Electrical Contractor","Panel Builder"].map(i => <option key={i}>{i}</option>)}
            </select>
            <select className="h-9 px-3 rounded-md border border-input bg-background text-sm flex-1"
              value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="">All statuses</option>
              <option value="new">New</option>
              <option value="emailed">Emailed</option>
              <option value="replied">Replied</option>
              <option value="qualified">Qualified</option>
              <option value="disqualified">Disqualified</option>
            </select>
            <Button variant="outline" size="sm" onClick={exportCSV}>
              <Download className="h-4 w-4 mr-1" /> CSV
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Loading prospects...</div>
          ) : filtered.length === 0 ? (
            <p className="text-muted-foreground text-sm py-8 text-center">No prospects yet. Add some in the "Add prospect" tab.</p>
          ) : (
            <div className="space-y-3">
              {filtered.map(prospect => {
                const prio = getPriority(prospect.score);
                const emailShown = emailVisible[prospect.id];
                const emailText = generateEmail(prospect);
                const tmplKey = getTemplateKey(prospect.industry);
                return (
                  <Card key={prospect.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <span className="font-medium text-sm">{prospect.name}</span>
                          {prospect.role && <span className="text-muted-foreground text-sm"> · {prospect.role}</span>}
                          <div className="text-xs text-muted-foreground mt-0.5">{prospect.company} · {prospect.city} · {prospect.industry}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={prio.variant}>{prio.label}</Badge>
                          <span className="text-xs text-muted-foreground">Score: {prospect.score}</span>
                          <button onClick={() => deleteProspect(prospect.id)} className="text-muted-foreground hover:text-destructive ml-1">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 mb-3">
                        <Badge variant="outline">{SPEND_LABELS[prospect.spend]}</Badge>
                        <Badge variant="secondary">{prospect.source}</Badge>
                        {prospect.email && <span className="text-xs text-muted-foreground self-center">{prospect.email}</span>}
                        {prospect.phone && <span className="text-xs text-muted-foreground self-center">{prospect.phone}</span>}
                      </div>

                      {prospect.notes && <p className="text-xs text-muted-foreground mb-3">{prospect.notes}</p>}

                      <div className="flex gap-2 flex-wrap">
                        <select className="h-8 px-2 rounded-md border border-input bg-background text-xs"
                          value={prospect.status} onChange={e => updateStatus(prospect.id, e.target.value)}>
                          <option value="new">New</option>
                          <option value="emailed">Emailed</option>
                          <option value="replied">Replied</option>
                          <option value="qualified">Qualified</option>
                          <option value="disqualified">Disqualified</option>
                        </select>
                        <Button variant="outline" size="sm" className="h-8 text-xs"
                          onClick={() => setEmailVisible(prev => ({ ...prev, [prospect.id]: !prev[prospect.id] }))}>
                          <Mail className="h-3 w-3 mr-1" />{emailShown ? "Hide" : "Generate email"}
                        </Button>
                      </div>

                      {emailShown && (
                        <div className="mt-3">
                          <div className="text-xs text-muted-foreground mb-1">Subject: {TEMPLATES[tmplKey].subject}</div>
                          <div className="bg-muted/50 rounded-md p-3 text-xs whitespace-pre-wrap font-mono leading-relaxed">{emailText}</div>
                          <Button variant="outline" size="sm" className="mt-2 h-7 text-xs" onClick={() => copyToClipboard(emailText)}>
                            <Copy className="h-3 w-3 mr-1" /> Copy email
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {tab === "templates" && (
        <div className="space-y-4">
          {Object.entries(TEMPLATES).map(([key, tmpl]) => (
            <Card key={key}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">
                    {key === "epc" ? "EPC / Construction" : key === "mfg" ? "Manufacturing" : key === "panel" ? "Panel Builder" : "Facilities Management"}
                  </CardTitle>
                  <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => copyToClipboard(tmpl.body)}>
                    <Copy className="h-3 w-3 mr-1" /> Copy
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">Subject: {tmpl.subject}</p>
              </CardHeader>
              <CardContent>
                <div className="bg-muted/50 rounded-md p-3 text-xs whitespace-pre-wrap font-mono leading-relaxed">{tmpl.body}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminBuyerOutreach;
