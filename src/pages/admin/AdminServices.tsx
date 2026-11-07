import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import RequestForm from '@/components/services/RequestForm';
import ProviderForm from '@/components/services/ProviderForm';
import {
  FALLBACK_TRADES, ServiceAssignment, ServiceProvider, ServiceRequest, adminListAssignments,
  adminListProviders, adminListRequests, adminOfferJob, adminUpdate, waLink,
} from '@/services/servicesService';

const tradeLabel = (slug: string) => FALLBACK_TRADES.find(t => t.slug === slug)?.label ?? slug;
const REQUEST_STATUSES = ['new', 'matching', 'confirmed', 'in_progress', 'completed', 'cancelled'];
const PROVIDER_STATUSES = ['pending', 'verified', 'active', 'paused', 'rejected'];
const ASSIGN_STATUSES = ['offered', 'accepted', 'declined', 'confirmed', 'completed', 'no_show', 'cancelled'];

const statusTone: Record<string, string> = {
  new: 'bg-blue-100 text-blue-800', matching: 'bg-yellow-100 text-yellow-800', confirmed: 'bg-green-100 text-green-800',
  in_progress: 'bg-purple-100 text-purple-800', completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-muted text-muted-foreground', pending: 'bg-yellow-100 text-yellow-800',
  verified: 'bg-green-100 text-green-800', active: 'bg-green-100 text-green-800', paused: 'bg-muted text-muted-foreground',
  rejected: 'bg-red-100 text-red-800', offered: 'bg-yellow-100 text-yellow-800', accepted: 'bg-blue-100 text-blue-800',
  declined: 'bg-red-100 text-red-800', no_show: 'bg-red-100 text-red-800',
};

const StatusSelect: React.FC<{ value: string; options: string[]; onChange: (v: string) => void }> = ({ value, options, onChange }) => (
  <Select value={value} onValueChange={onChange}>
    <SelectTrigger className="h-8 w-36"><SelectValue /></SelectTrigger>
    <SelectContent>{options.map(o => <SelectItem key={o} value={o}>{o.replace('_', ' ')}</SelectItem>)}</SelectContent>
  </Select>
);

// ---------- Request detail: match providers & manage assignments ----------
const RequestDetail: React.FC<{ request: ServiceRequest; providers: ServiceProvider[]; onChanged: () => void }> = ({ request, providers, onChanged }) => {
  const [assignments, setAssignments] = useState<ServiceAssignment[]>([]);
  const [notes, setNotes] = useState(request.admin_notes ?? '');

  const load = useCallback(async () => {
    try { setAssignments(await adminListAssignments(request.id)); } catch (e: any) { toast({ title: 'Failed to load', description: e.message, variant: 'destructive' }); }
  }, [request.id]);
  useEffect(() => { load(); }, [load]);

  const assignedIds = new Set(assignments.map(a => a.provider_id));
  const candidates = useMemo(() => providers
    .filter(p => ['verified', 'active'].includes(p.status) && p.trades.includes(request.trade) && !assignedIds.has(p.id))
    .sort((a, b) => (b.rating_avg ?? 0) - (a.rating_avg ?? 0) || b.jobs_completed - a.jobs_completed),
  [providers, request.trade, assignments]);

  const offerMessage = (p: ServiceProvider) =>
    `Hi ${p.full_name}, this is SwitchgearShop. We have a ${tradeLabel(request.trade)} job in ${request.area}.\n\n` +
    `Work: ${request.scope}\nWhen: ${request.start_date ?? request.urgency.replace('_', ' ')}${request.duration_days ? `, ~${request.duration_days} day(s)` : ''}\n\n` +
    `Are you available? Please reply with your rate.`;

  const offer = async (p: ServiceProvider) => {
    try {
      await adminOfferJob(request.id, p.id, p.day_rate_inr);
      if (request.status === 'new') await adminUpdate('service_requests', request.id, { status: 'matching' });
      window.open(waLink(p.phone, offerMessage(p)), '_blank', 'noopener');
      await load(); onChanged();
    } catch (e: any) { toast({ title: 'Could not offer job', description: e.message, variant: 'destructive' }); }
  };

  const patchAssignment = async (a: ServiceAssignment, patch: Record<string, unknown>) => {
    try {
      await adminUpdate('service_assignments', a.id, patch);
      if (patch.status === 'completed') await adminUpdate('service_assignments', a.id, { completed_at: new Date().toISOString() });
      await load(); onChanged();
    } catch (e: any) { toast({ title: 'Update failed', description: e.message, variant: 'destructive' }); }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-2 text-sm sm:grid-cols-2">
        <p><span className="text-muted-foreground">Requester: </span>{request.requester_name}{request.requester_company ? `, ${request.requester_company}` : ''}</p>
        <p><span className="text-muted-foreground">Phone: </span>
          <a className="text-primary underline" target="_blank" rel="noopener noreferrer" href={waLink(request.requester_phone, `Hi ${request.requester_name}, this is SwitchgearShop about your ${tradeLabel(request.trade)} request ${request.request_number}.`)}>{request.requester_phone}</a></p>
        <p><span className="text-muted-foreground">Trade: </span>{tradeLabel(request.trade)} x {request.headcount}</p>
        <p><span className="text-muted-foreground">When: </span>{request.start_date ?? request.urgency.replace('_', ' ')}{request.duration_days ? `, ${request.duration_days} day(s)` : ''}</p>
        <p className="sm:col-span-2"><span className="text-muted-foreground">Where: </span>{request.area}{request.address ? `, ${request.address}` : ''}</p>
        {request.budget_note && <p className="sm:col-span-2"><span className="text-muted-foreground">Budget: </span>{request.budget_note}</p>}
        <p className="sm:col-span-2 whitespace-pre-wrap rounded-md bg-secondary/50 p-3">{request.scope}</p>
      </div>

      <div>
        <h3 className="font-medium mb-2">Assigned and offered</h3>
        {assignments.length === 0 ? <p className="text-sm text-muted-foreground">No one offered yet.</p> : (
          <div className="space-y-3">
            {assignments.map(a => (
              <div key={a.id} className="rounded-md border border-border p-3 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium">{a.provider?.full_name}</span>
                  <StatusSelect value={a.status} options={ASSIGN_STATUSES} onChange={v => patchAssignment(a, { status: v })} />
                </div>
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <Input className="h-8 w-28" type="number" placeholder="Rate ₹" defaultValue={a.agreed_rate_inr ?? ''}
                    onBlur={e => e.target.value !== String(a.agreed_rate_inr ?? '') && patchAssignment(a, { agreed_rate_inr: e.target.value ? Number(e.target.value) : null })} />
                  <Select value={a.rate_unit} onValueChange={v => patchAssignment(a, { rate_unit: v })}>
                    <SelectTrigger className="h-8 w-24"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="hour">per hour</SelectItem><SelectItem value="day">per day</SelectItem><SelectItem value="job">per job</SelectItem></SelectContent>
                  </Select>
                  <Input className="h-8 w-28" type="number" placeholder="Our fee ₹" defaultValue={a.platform_fee_inr ?? ''}
                    onBlur={e => e.target.value !== String(a.platform_fee_inr ?? '') && patchAssignment(a, { platform_fee_inr: e.target.value ? Number(e.target.value) : null })} />
                  {a.status === 'completed' && (
                    <Select value={String(a.buyer_rating ?? '')} onValueChange={v => patchAssignment(a, { buyer_rating: Number(v) })}>
                      <SelectTrigger className="h-8 w-28"><SelectValue placeholder="Rating" /></SelectTrigger>
                      <SelectContent>{[5, 4, 3, 2, 1].map(n => <SelectItem key={n} value={String(n)}>{n} star{n > 1 ? 's' : ''}</SelectItem>)}</SelectContent>
                    </Select>
                  )}
                  {a.provider && <a className="text-primary underline" target="_blank" rel="noopener noreferrer" href={waLink(a.provider.phone, `Hi ${a.provider.full_name}, update on the ${tradeLabel(request.trade)} job (${request.request_number}).`)}>WhatsApp</a>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h3 className="font-medium mb-2">Matching providers ({candidates.length})</h3>
        {candidates.length === 0 ? <p className="text-sm text-muted-foreground">No verified {tradeLabel(request.trade)} available. Verify more providers in the Providers tab.</p> : (
          <div className="space-y-2">
            {candidates.map(p => (
              <div key={p.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border p-3">
                <div className="text-sm">
                  <div className="font-medium">{p.full_name}</div>
                  <div className="text-muted-foreground">
                    {p.experience_years ? `${p.experience_years} yrs` : 'experience n/a'} · {p.day_rate_inr ? `₹${p.day_rate_inr}/day` : 'rate n/a'}
                    {p.rating_avg ? ` · ${p.rating_avg}★` : ''} · {p.jobs_completed} jobs
                  </div>
                </div>
                <Button size="sm" onClick={() => offer(p)}>Offer via WhatsApp</Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <h3 className="font-medium">Internal notes</h3>
        <Textarea rows={3} value={notes} onChange={e => setNotes(e.target.value)} />
        <Button size="sm" variant="outline" onClick={async () => { await adminUpdate('service_requests', request.id, { admin_notes: notes }); toast({ title: 'Saved' }); onChanged(); }}>Save notes</Button>
      </div>
    </div>
  );
};

// ---------- Page ----------
const AdminServices: React.FC = () => {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [providers, setProviders] = useState<ServiceProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [reqFilter, setReqFilter] = useState('open');
  const [provFilter, setProvFilter] = useState('all');
  const [selected, setSelected] = useState<ServiceRequest | null>(null);
  const [addReq, setAddReq] = useState(false);
  const [addProv, setAddProv] = useState(false);
  const [selProv, setSelProv] = useState<ServiceProvider | null>(null);

  const load = useCallback(async () => {
    try {
      const [r, p] = await Promise.all([adminListRequests(), adminListProviders()]);
      setRequests(r); setProviders(p);
      setSelected(prev => prev ? r.find(x => x.id === prev.id) ?? null : null);
    } catch (e: any) { toast({ title: 'Failed to load services', description: e.message, variant: 'destructive' }); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const shownRequests = requests.filter(r => reqFilter === 'all' ? true : reqFilter === 'open' ? !['completed', 'cancelled'].includes(r.status) : r.status === reqFilter);
  const shownProviders = providers.filter(p => provFilter === 'all' || p.status === provFilter);
  const counts = { open: requests.filter(r => !['completed', 'cancelled'].includes(r.status)).length, pending: providers.filter(p => p.status === 'pending').length, verified: providers.filter(p => ['verified', 'active'].includes(p.status)).length };

  const setReqStatus = async (r: ServiceRequest, status: string) => { await adminUpdate('service_requests', r.id, { status }); load(); };
  const setProvStatus = async (p: ServiceProvider, status: string) => {
    await adminUpdate('service_providers', p.id, { status, id_verified: ['verified', 'active'].includes(status) ? true : p.id_verified });
    load();
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Services</h1>
        <p className="text-sm text-muted-foreground">{counts.open} open requests · {counts.pending} providers awaiting verification · {counts.verified} verified providers</p>
      </div>

      <Tabs defaultValue="requests">
        <TabsList>
          <TabsTrigger value="requests">Requests</TabsTrigger>
          <TabsTrigger value="providers">Providers</TabsTrigger>
        </TabsList>

        <TabsContent value="requests" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Select value={reqFilter} onValueChange={setReqFilter}>
              <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="open">Open</SelectItem><SelectItem value="all">All</SelectItem>
                {REQUEST_STATUSES.map(s => <SelectItem key={s} value={s}>{s.replace('_', ' ')}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button onClick={() => setAddReq(true)}>Log a request</Button>
          </div>
          <Table>
            <TableHeader><TableRow><TableHead>Ref</TableHead><TableHead>Trade</TableHead><TableHead>Requester</TableHead><TableHead>When</TableHead><TableHead>Status</TableHead><TableHead /></TableRow></TableHeader>
            <TableBody>
              {loading ? <TableRow><TableCell colSpan={6}>Loading…</TableCell></TableRow> :
                shownRequests.length === 0 ? <TableRow><TableCell colSpan={6} className="text-muted-foreground">No requests.</TableCell></TableRow> :
                shownRequests.map(r => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono text-xs">{r.request_number}<div className="text-muted-foreground">{format(new Date(r.created_at), 'd MMM')}</div></TableCell>
                    <TableCell>{tradeLabel(r.trade)}{r.headcount > 1 ? ` x${r.headcount}` : ''}</TableCell>
                    <TableCell>{r.requester_name}<div className="text-xs text-muted-foreground">{r.requester_company}</div></TableCell>
                    <TableCell className="text-sm">{r.urgency === 'today' ? <Badge className="bg-red-100 text-red-800">urgent</Badge> : r.urgency.replace('_', ' ')}</TableCell>
                    <TableCell><StatusSelect value={r.status} options={REQUEST_STATUSES} onChange={v => setReqStatus(r, v)} /></TableCell>
                    <TableCell><Button size="sm" variant="outline" onClick={() => setSelected(r)}>Open</Button></TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="providers" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Select value={provFilter} onValueChange={setProvFilter}>
              <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="all">All</SelectItem>{PROVIDER_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
            <Button onClick={() => setAddProv(true)}>Add a provider</Button>
          </div>
          <Table>
            <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Trades</TableHead><TableHead>Rate</TableHead><TableHead>Jobs</TableHead><TableHead>Status</TableHead><TableHead /></TableRow></TableHeader>
            <TableBody>
              {shownProviders.length === 0 ? <TableRow><TableCell colSpan={6} className="text-muted-foreground">No providers.</TableCell></TableRow> :
                shownProviders.map(p => (
                  <TableRow key={p.id}>
                    <TableCell>{p.full_name}<div className="text-xs text-muted-foreground">{p.phone}</div></TableCell>
                    <TableCell className="text-sm">{p.trades.map(tradeLabel).join(', ')}</TableCell>
                    <TableCell>{p.day_rate_inr ? `₹${p.day_rate_inr}` : '-'}</TableCell>
                    <TableCell>{p.jobs_completed}{p.rating_avg ? ` · ${p.rating_avg}★` : ''}</TableCell>
                    <TableCell><StatusSelect value={p.status} options={PROVIDER_STATUSES} onChange={v => setProvStatus(p, v)} /></TableCell>
                    <TableCell className="space-x-2 whitespace-nowrap">
                      <Button size="sm" variant="outline" asChild><a target="_blank" rel="noopener noreferrer" href={waLink(p.phone, `Hi ${p.full_name}, this is SwitchgearShop. We are verifying your profile.`)}>WhatsApp</a></Button>
                      <Button size="sm" variant="ghost" onClick={() => setSelProv(p)}>Details</Button>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TabsContent>
      </Tabs>

      <Dialog open={!!selected} onOpenChange={o => !o && setSelected(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{selected?.request_number} · {selected && tradeLabel(selected.trade)}</DialogTitle></DialogHeader>
          {selected && <RequestDetail request={selected} providers={providers} onChanged={load} />}
        </DialogContent>
      </Dialog>

      <Dialog open={!!selProv} onOpenChange={o => !o && setSelProv(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{selProv?.full_name}</DialogTitle></DialogHeader>
          {selProv && (
            <div className="space-y-3 text-sm">
              <p><span className="text-muted-foreground">Skills: </span>{selProv.skills || 'n/a'}</p>
              <p><span className="text-muted-foreground">Experience: </span>{selProv.experience_years ?? 'n/a'} yrs · <span className="text-muted-foreground">Own tools: </span>{selProv.owns_tools ? 'yes' : 'no'}</p>
              <p><span className="text-muted-foreground">Languages: </span>{selProv.languages.join(', ') || 'n/a'} · <span className="text-muted-foreground">Availability: </span>{selProv.availability ?? 'n/a'}</p>
              <Textarea rows={3} defaultValue={selProv.admin_notes ?? ''} placeholder="Internal notes (verification call, references…)" id="prov-notes" />
              <Button size="sm" onClick={async () => { await adminUpdate('service_providers', selProv.id, { admin_notes: (document.getElementById('prov-notes') as HTMLTextAreaElement).value }); toast({ title: 'Saved' }); load(); }}>Save notes</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={addReq} onOpenChange={setAddReq}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Log a request (e.g. from WhatsApp)</DialogTitle></DialogHeader>
          <RequestForm source="admin" onSubmitted={n => { toast({ title: `Logged ${n}` }); setAddReq(false); load(); }} />
        </DialogContent>
      </Dialog>

      <Dialog open={addProv} onOpenChange={setAddProv}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Add a provider</DialogTitle></DialogHeader>
          <ProviderForm source="admin" onSubmitted={() => { toast({ title: 'Provider added as pending' }); setAddProv(false); load(); }} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminServices;
