import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { fetchTrades, FALLBACK_TRADES, submitServiceRequest } from '@/services/servicesService';

interface Props {
  defaultTrade?: string;
  source?: string;
  onSubmitted: (requestNumber: string) => void;
}

const RequestForm: React.FC<Props> = ({ defaultTrade = '', source = 'web', onSubmitted }) => {
  const { user } = useAuth();
  const { data: trades = FALLBACK_TRADES } = useQuery({ queryKey: ['service-trades'], queryFn: fetchTrades, staleTime: 600_000 });
  const [f, setF] = useState({
    name: user?.name ?? '', company: user?.companyName ?? '', phone: user?.phoneNumber ?? '', email: user?.email ?? '',
    trade: defaultTrade, scope: '', headcount: '1', durationDays: '', area: 'Peenya', address: '',
    startDate: '', urgency: 'this_week', budgetNote: '', website: '', // website = honeypot
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setF(p => ({ ...p, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (f.website) return; // bot
    if (!f.trade) return setError('Select the trade you need');
    setBusy(true);
    try {
      const num = await submitServiceRequest({
        name: f.name, company: f.company, phone: f.phone, email: f.email, trade: f.trade, scope: f.scope,
        headcount: Math.max(1, parseInt(f.headcount) || 1), durationDays: f.durationDays ? Number(f.durationDays) : null,
        area: f.area, address: f.address, startDate: f.startDate || null, urgency: f.urgency,
        budgetNote: f.budgetNote, source,
      });
      onSubmitted(num);
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again or message us on WhatsApp.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="trade">Trade needed *</Label>
          <Select value={f.trade} onValueChange={v => setF(p => ({ ...p, trade: v }))}>
            <SelectTrigger id="trade" className="h-11"><SelectValue placeholder="Choose a trade" /></SelectTrigger>
            <SelectContent>{trades.map(t => <SelectItem key={t.slug} value={t.slug}>{t.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="headcount">How many people</Label>
          <Input id="headcount" type="number" min={1} max={50} inputMode="numeric" className="h-11" value={f.headcount} onChange={set('headcount')} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="scope">What needs to be done *</Label>
        <Textarea id="scope" rows={4} required minLength={10} maxLength={2000} value={f.scope} onChange={set('scope')}
          placeholder="e.g. MIG welding of 12 MS cable trays, 2 mm sheet, on our premises. Drawings available." />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="urgency">When</Label>
          <Select value={f.urgency} onValueChange={v => setF(p => ({ ...p, urgency: v }))}>
            <SelectTrigger id="urgency" className="h-11"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today / urgent</SelectItem>
              <SelectItem value="this_week">This week</SelectItem>
              <SelectItem value="flexible">Flexible</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="startDate">Start date</Label>
          <Input id="startDate" type="date" className="h-11" value={f.startDate} onChange={set('startDate')} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="durationDays">Days needed</Label>
          <Input id="durationDays" type="number" min={0.5} step={0.5} inputMode="decimal" className="h-11" value={f.durationDays} onChange={set('durationDays')} placeholder="e.g. 3" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="area">Area</Label>
          <Input id="area" className="h-11" value={f.area} onChange={set('area')} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="address">Site address / landmark</Label>
          <Input id="address" className="h-11" value={f.address} onChange={set('address')} placeholder="Plot no., stage, nearby landmark" />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="budgetNote">Budget or rate you have in mind (optional)</Label>
        <Input id="budgetNote" className="h-11" value={f.budgetNote} onChange={set('budgetNote')} placeholder="e.g. ₹1,000 per day, or per job" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="name">Your name *</Label>
          <Input id="name" required className="h-11" value={f.name} onChange={set('name')} autoComplete="name" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="company">Company</Label>
          <Input id="company" className="h-11" value={f.company} onChange={set('company')} autoComplete="organization" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="phone">Mobile (WhatsApp) *</Label>
          <Input id="phone" type="tel" required inputMode="tel" className="h-11" value={f.phone} onChange={set('phone')} autoComplete="tel" placeholder="98xxxxxx12" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email (optional)</Label>
          <Input id="email" type="email" className="h-11" value={f.email} onChange={set('email')} autoComplete="email" />
        </div>
      </div>

      {/* honeypot: hidden from people */}
      <input tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" name="website" value={f.website} onChange={set('website')} />

      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <Button type="submit" size="lg" disabled={busy} className="w-full sm:w-auto">{busy ? 'Sending…' : 'Send request'}</Button>
    </form>
  );
};

export default RequestForm;
