import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { fetchTrades, FALLBACK_TRADES, submitServiceProvider } from '@/services/servicesService';

const LANGUAGES = ['Kannada', 'Hindi', 'English', 'Tamil', 'Telugu', 'Urdu'];

interface Props { source?: string; onSubmitted: () => void; }

const ProviderForm: React.FC<Props> = ({ source = 'web', onSubmitted }) => {
  const { data: trades = FALLBACK_TRADES } = useQuery({ queryKey: ['service-trades'], queryFn: fetchTrades, staleTime: 600_000 });
  const [f, setF] = useState({
    name: '', phone: '', skills: '', experienceYears: '', area: 'Peenya', dayRate: '',
    availability: 'anytime', ownsTools: false, website: '',
  });
  const [selTrades, setSelTrades] = useState<string[]>([]);
  const [langs, setLangs] = useState<string[]>(['Kannada']);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setF(p => ({ ...p, [k]: e.target.value }));
  const toggle = (list: string[], v: string, setter: (l: string[]) => void) =>
    setter(list.includes(v) ? list.filter(x => x !== v) : [...list, v]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (f.website) return;
    if (!selTrades.length) return setError('Select at least one trade');
    setBusy(true);
    try {
      await submitServiceProvider({
        name: f.name, phone: f.phone, trades: selTrades, skills: f.skills,
        experienceYears: f.experienceYears ? parseInt(f.experienceYears) : null, area: f.area,
        languages: langs, ownsTools: f.ownsTools, dayRateInr: f.dayRate ? parseInt(f.dayRate) : null,
        availability: f.availability, source,
      });
      onSubmitted();
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
          <Label htmlFor="pname">Full name *</Label>
          <Input id="pname" required className="h-11" value={f.name} onChange={set('name')} autoComplete="name" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pphone">Mobile (WhatsApp) *</Label>
          <Input id="pphone" type="tel" required inputMode="tel" className="h-11" value={f.phone} onChange={set('phone')} autoComplete="tel" placeholder="98xxxxxx12" />
        </div>
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Your trade(s) *</legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {trades.filter(t => t.slug !== 'other').map(t => (
            <label key={t.slug} className="flex items-center gap-3 rounded-md border border-border px-3 py-2.5 cursor-pointer hover:bg-secondary/50">
              <Checkbox checked={selTrades.includes(t.slug)} onCheckedChange={() => toggle(selTrades, t.slug, setSelTrades)} />
              <span className="text-sm">{t.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="space-y-1.5">
        <Label htmlFor="skills">Skills and past work</Label>
        <Textarea id="skills" rows={3} value={f.skills} onChange={set('skills')}
          placeholder="e.g. MIG and TIG on MS and SS, 6 years in fabrication shops, can read drawings" />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="exp">Years of experience</Label>
          <Input id="exp" type="number" min={0} max={50} inputMode="numeric" className="h-11" value={f.experienceYears} onChange={set('experienceYears')} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="rate">Expected day rate (₹)</Label>
          <Input id="rate" type="number" min={100} max={20000} inputMode="numeric" className="h-11" value={f.dayRate} onChange={set('dayRate')} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="avail">Availability</Label>
          <Select value={f.availability} onValueChange={v => setF(p => ({ ...p, availability: v }))}>
            <SelectTrigger id="avail" className="h-11"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="anytime">Any day</SelectItem>
              <SelectItem value="weekdays">Weekdays</SelectItem>
              <SelectItem value="weekends">Weekends</SelectItem>
              <SelectItem value="evenings">Evenings</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="parea">Where you can work</Label>
          <Input id="parea" className="h-11" value={f.area} onChange={set('area')} />
        </div>
        <label className="flex items-center gap-3 rounded-md border border-border px-3 py-2.5 cursor-pointer self-end h-11">
          <Checkbox checked={f.ownsTools} onCheckedChange={v => setF(p => ({ ...p, ownsTools: v === true }))} />
          <span className="text-sm">I have my own tools</span>
        </label>
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Languages</legend>
        <div className="flex flex-wrap gap-2">
          {LANGUAGES.map(l => (
            <button type="button" key={l} onClick={() => toggle(langs, l, setLangs)}
              className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${langs.includes(l) ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-secondary/50'}`}
              aria-pressed={langs.includes(l)}>{l}</button>
          ))}
        </div>
      </fieldset>

      <input tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" name="website" value={f.website} onChange={set('website')} />
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <Button type="submit" size="lg" disabled={busy} className="w-full sm:w-auto">{busy ? 'Submitting…' : 'Submit my profile'}</Button>
    </form>
  );
};

export default ProviderForm;
