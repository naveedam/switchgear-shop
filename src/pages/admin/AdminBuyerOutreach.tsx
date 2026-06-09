import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Copy, Download, Mail } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

interface Lead {
  id: number;
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
  addedAt: string;
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

const SAMPLE_LEADS: Omit<Lead, "id" | "addedAt">[] = [
  { name: "Suresh Babu", role: "Purchase Engineer", company: "Brigade Group", industry: "Real Estate / Developers", email: "", phone: "", city: "Bangalore", source: "LinkedIn", spend: "high", notes: "Procurement for residential towers, uses Havells and Legrand", status: "new" },
  { name: "Kiran Reddy", role: "Sr. Procurement Manager", company: "Prestige Constructions", industry: "EPC / Construction", email: "", phone: "", city: "Bangalore", source: "LinkedIn", spend: "very_high", notes: "Large commercial projects, buys ABB and Schneider in bulk", status: "new" },
  { name: "Mohammed Farooq", role: "Electrical Engineer", company: "Voltas Limited", industry: "Facilities Management", email: "", phone: "", city: "Bangalore", source: "IndiaMART", spend: "med", notes: "HVAC and electrical maintenance contracts", status: "new" },
  { name: "Anand Krishnamurthy", role: "Panel Builder", company: "AK Electricals", industry: "Panel Builder", email: "", phone: "", city: "Bangalore", source: "Referral", spend: "med", notes: "Builds MCC and PCC panels, sources from Chamrajpet market", status: "new" },
  { name: "Priya Nair", role: "Purchase Manager", company: "Manyata Tech Park", industry: "Data Center / IT Parks", email: "", phone: "", city: "Bangalore", source: "LinkedIn", spend: "high", notes: "Facility maintenance procurement, prefers vendor consolidation", status: "new" },
  { name: "Deepak Yadav", role: "Procurement Head", company: "Sobha Limited", industry: "Real Estate / Developers", email: "", phone: "", city: "Bangalore", source: "LinkedIn", spend: "very_high", notes: "Luxury residential projects, quality focused", status: "new" },
];

function scoreLead(lead: Lead): number {
  let s = 0;
  if (["EPC / Construction", "Panel Builder", "Manufacturing"].includes(lead.industry)) s += 3;
  if (["Data Center / IT Parks", "Facilities Management"].includes(lead.industry)) s += 2;
  if (lead.spend === "very_high") s += 3;
  else if (lead.spend === "high") s += 2;
  else if (lead.spend === "med") s += 1;
  if (lead.email) s += 1;
  if (lead.phone) s += 1;
  return s;
}

function getPriority(score: number): { label: string; variant: "default" | "secondary" | "destructive" | "outline" } {
  if (score >= 5) return { label: "High", variant: "default" };
  if (score >= 3) return { label: "Medium", variant: "secondary" };
  return { label: "Low", variant: "outline" };
}

function getTemplateKey(industry: string): string {
  if (industry === "Panel Builder") return "panel";
  if (industry === "EPC / Construction") return "epc";
  if (["Facilities Management", "Data Center / IT Parks"].includes(industry)) return "fm";
  return "mfg";
}

const SPEND_LABELS: Record<string, string> = {
  low: "Under ₹50K", med: "₹50K–₹5L", high: "₹5L–₹25L", very_high: "Above ₹25L"
};

const AdminBuyerOutreach: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [tab, setTab] = useState<"add" | "list" | "templates">("add");
  const [filterIndustry, setFilterIndustry] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [emailVisible, setEmailVisible] = useState<Record<number, boolean>>({});
  const [form, setForm] = useState({
    name: "", role: "", company: "", industry: "",
    email: "", phone: "", city: "Bangalore",
    source: "LinkedIn", spend: "med", notes: ""
  });

  const addLead = () => {
    if (!form.name || !form.company) {
      toast({ title: "Required", description: "Name and company are required", variant: "destructive" });
      return;
    }
    const lead: Lead = { ...form, id: Date.now(), addedAt: new Date().toLocaleDateString("en-IN"), status: "new" };
    setLeads(prev => [...prev, lead]);
    setForm({ name: "", role: "", company: "", industry: "", email: "", phone: "", city: "Bangalore", source: "LinkedIn", spend: "med", notes: "" });
    setTab("list");
    toast({ title: "Lead added", description: `${lead.name} from ${lead.company} added.` });
  };

  const loadSamples = () => {
    const samples = SAMPLE_LEADS.map(s => ({ ...s, id: Date.now() + Math.random(), addedAt: new Date().toLocaleDateString("en-IN") }));
    setLeads(prev => [...prev, ...samples]);
    setTab("list");
    toast({ title: "Sample leads loaded", description: `${samples.length} Bangalore leads added.` });
  };

  const updateStatus = (id: number, status: string) => {
    setLeads(prev => prev.map(l => l.id === id ? { ...l, status } : l));
  };

  const deleteLead = (id: number) => {
    setLeads(prev => prev.filter(l => l.id !== id));
  };

  const toggleEmail = (id: number) => {
    setEmailVisible(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const generateEmail = (lead: Lead): string => {
    const key = getTemplateKey(lead.industry);
    const tmpl = TEMPLATES[key];
    return tmpl.body.replace("[Name]", lead.name.split(" ")[0]).replace("[Company]", lead.company);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard" });
  };

  const exportCSV = () => {
    const headers = ["Name","Role","Company","Industry","Email","Phone","City","Source","Spend","Status","Notes","Added"];
    const rows = leads.map(l => [l.name,l.role,l.company,l.industry,l.email,l.phone,l.city,l.source,l.spend,l.status,l.notes,l.addedAt].map(v => `"${v||""}"`).join(","));
    const csv = [headers.join(","), ...rows].join("\n");
    const a = document.createElement("a");
    a.href = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
    a.download = "switchgearshop_leads.csv";
    a.click();
  };

  const filtered = leads
    .filter(l => (!filterIndustry || l.industry === filterIndustry) && (!filterStatus || l.status === filterStatus))
    .sort((a, b) => scoreLead(b) - scoreLead(a));

  const stats = {
    total: leads.length,
    high: leads.filter(l => scoreLead(l) >= 5).length,
    emailed: leads.filter(l => l.status === "emailed").length,
    replied: leads.filter(l => l.status === "replied").length,
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">Buyer Outreach</h1>
        <p className="text-sm text-muted-foreground">Build your target list of purchase engineers and procurement managers in Bangalore.</p>
      </div>

      <div className="flex gap-2 mb-6 border-b">
        {(["add","list","templates"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm capitalize border-b-2 transition-colors ${tab === t ? "border-primary font-medium" : "border-transparent text-muted-foreground"}`}>
            {t === "add" ? "Add lead" : t === "list" ? `Target list (${leads.length})` : "Email templates"}
          </button>
        ))}
      </div>

      {tab === "add" && (
        <Card>
          <CardHeader><CardTitle className="text-base">New lead</CardTitle></CardHeader>
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
                  {["EPC / Construction","Manufacturing","Data Center / IT Parks","Real Estate / Developers","Facilities Management","Electrical Contractor","Panel Builder","Government / PSU"].map(i => <option key={i}>{i}</option>)}
                </select></div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div><label className="text-xs text-muted-foreground mb-1 block">Email</label>
                <Input value={form.email} onChange={e => setForm(p => ({...p, email: e.target.value}))} placeholder="rajesh@company.com" /></div>
              <div><label className="text-xs text-muted-foreground mb-1 block">Phone</label>
                <Input value={form.phone} onChange={e => setForm(p => ({...p, phone: e.target.value}))} placeholder="+91 98xxxxxxxx" /></div>
              <div><label className="text-xs text-muted-foreground mb-1 block">City</label>
                <Input value={form.city} onChange={e => setForm(p => ({...p, city: e.target.value}))} placeholder="Bangalore" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-xs text-muted-foreground mb-1 block">Source</label>
                <select className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                  value={form.source} onChange={e => setForm(p => ({...p, source: e.target.value}))}>
                  {["LinkedIn","IndiaMART","Referral","Cold outreach","Conference","Trade directory"].map(s => <option key={s}>{s}</option>)}
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
              <Button onClick={addLead}>Add to list</Button>
              <Button variant="outline" onClick={loadSamples}>Load sample Bangalore leads</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {tab === "list" && (
        <div>
          <div className="grid grid-cols-4 gap-4 mb-6">
            {[["Total leads", stats.total], ["High priority", stats.high], ["Emailed", stats.emailed], ["Replied", stats.replied]].map(([label, val]) => (
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
            </select>
            <Button variant="outline" size="sm" onClick={exportCSV}><Download className="h-4 w-4 mr-1" /> Export CSV</Button>
          </div>

          {filtered.length === 0 ? (
            <p className="text-muted-foreground text-sm py-8 text-center">No leads yet. Add some in the "Add lead" tab.</p>
          ) : (
            <div className="space-y-3">
              {filtered.map(lead => {
                const score = scoreLead(lead);
                const prio = getPriority(score);
                const emailShown = emailVisible[lead.id];
                const emailText = generateEmail(lead);
                const tmplKey = getTemplateKey(lead.industry);
                return (
                  <Card key={lead.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <span className="font-medium text-sm">{lead.name}</span>
                          {lead.role && <span className="text-muted-foreground text-sm"> · {lead.role}</span>}
                          <div className="text-xs text-muted-foreground mt-0.5">{lead.company} · {lead.city} · {lead.industry}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={prio.variant}>{prio.label}</Badge>
                          <button onClick={() => deleteLead(lead.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 mb-3">
                        <Badge variant="outline">{SPEND_LABELS[lead.spend]}</Badge>
                        <Badge variant="secondary">{lead.source}</Badge>
                        {lead.email && <span className="text-xs text-muted-foreground self-center">{lead.email}</span>}
                        {lead.phone && <span className="text-xs text-muted-foreground self-center">{lead.phone}</span>}
                      </div>

                      {lead.notes && <p className="text-xs text-muted-foreground mb-3">{lead.notes}</p>}

                      <div className="flex gap-2 flex-wrap">
                        <select className="h-8 px-2 rounded-md border border-input bg-background text-xs"
                          value={lead.status} onChange={e => updateStatus(lead.id, e.target.value)}>
                          <option value="new">New</option>
                          <option value="emailed">Emailed</option>
                          <option value="replied">Replied</option>
                          <option value="qualified">Qualified</option>
                        </select>
                        <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => toggleEmail(lead.id)}>
                          <Mail className="h-3 w-3 mr-1" />{emailShown ? "Hide email" : "Generate email"}
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
                  <CardTitle className="text-sm capitalize">{key === "epc" ? "EPC / Construction" : key === "mfg" ? "Manufacturing" : key === "panel" ? "Panel Builder" : "Facilities Management"}</CardTitle>
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
