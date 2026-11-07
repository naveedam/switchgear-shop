import { supabase } from '@/integrations/supabase/client';

// New tables are not in the generated Supabase types yet.
// After applying the migration, run `npx supabase gen types typescript --project-id hdoefblcoavpzvfiiglm > src/integrations/supabase/types.ts`
// and the `db` casts below can be removed.
const db = supabase as any;

export const SERVICES_WA_NUMBER = '919986058837';

export interface ServiceTrade { slug: string; label: string; description: string | null; sort_order: number; }

export const FALLBACK_TRADES: ServiceTrade[] = [
  { slug: 'welder', label: 'Welder', description: 'MIG / TIG / arc welding, structural and sheet metal', sort_order: 10 },
  { slug: 'turner', label: 'Turner (Lathe)', description: 'Conventional lathe turning, threading, job work', sort_order: 20 },
  { slug: 'fitter', label: 'Fitter', description: 'Mechanical fitting, assembly, alignment, maintenance', sort_order: 30 },
  { slug: 'machinist', label: 'CNC / VMC Operator', description: 'CNC and VMC setting and operation, milling, grinding', sort_order: 40 },
  { slug: 'sheet_metal', label: 'Sheet Metal Fabricator', description: 'Cutting, bending, punching, enclosure and panel fabrication', sort_order: 50 },
  { slug: 'electrician', label: 'Electrician', description: 'Industrial wiring, installation, testing, troubleshooting', sort_order: 60 },
  { slug: 'panel_wireman', label: 'Panel Wireman', description: 'Control and power panel wiring, ferruling, dressing', sort_order: 70 },
  { slug: 'maintenance_tech', label: 'Maintenance Technician', description: 'Breakdown and preventive maintenance of plant equipment', sort_order: 80 },
  { slug: 'draftsman', label: 'Draftsman', description: 'AutoCAD / SolidWorks drawings, panel layouts, GA and BOM', sort_order: 90 },
  { slug: 'other', label: 'Other trade', description: 'Anything else; tell us in the scope', sort_order: 999 },
];

export interface ServiceProvider {
  id: string; created_at: string; full_name: string; phone: string; trades: string[];
  skills: string | null; experience_years: number | null; area: string; languages: string[];
  owns_tools: boolean; day_rate_inr: number | null; availability: string | null;
  id_verified: boolean; status: 'pending' | 'verified' | 'active' | 'paused' | 'rejected';
  jobs_completed: number; rating_avg: number | null; admin_notes: string | null; source: string;
}

export interface ServiceRequest {
  id: string; request_number: string; created_at: string; requester_name: string;
  requester_company: string | null; requester_phone: string; requester_email: string | null;
  trade: string; scope: string; headcount: number; duration_days: number | null; area: string;
  address: string | null; start_date: string | null; urgency: 'today' | 'this_week' | 'flexible';
  budget_note: string | null; status: 'new' | 'matching' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  admin_notes: string | null; source: string;
}

export interface ServiceAssignment {
  id: string; request_id: string; provider_id: string; status: string;
  agreed_rate_inr: number | null; rate_unit: 'hour' | 'day' | 'job'; platform_fee_inr: number | null;
  buyer_rating: number | null; buyer_review: string | null; notes: string | null; created_at: string;
  provider?: Pick<ServiceProvider, 'id' | 'full_name' | 'phone' | 'trades'> | null;
}

export const fetchTrades = async (): Promise<ServiceTrade[]> => {
  const { data, error } = await db.from('service_trades').select('*').order('sort_order');
  if (error || !data?.length) return FALLBACK_TRADES;
  return data;
};

export const fetchTradeSupply = async (): Promise<Record<string, number>> => {
  const { data, error } = await db.rpc('service_trade_supply');
  if (error || !data) return {};
  return Object.fromEntries((data as { trade: string; providers: number }[]).map(r => [r.trade, Number(r.providers)]));
};

export interface RequestInput {
  name: string; company: string; phone: string; email: string; trade: string; scope: string;
  headcount: number; durationDays: number | null; area: string; address: string;
  startDate: string | null; urgency: string; budgetNote: string; source?: string;
}

export const submitServiceRequest = async (i: RequestInput): Promise<string> => {
  const { data, error } = await db.rpc('submit_service_request', {
    p_name: i.name, p_company: i.company, p_phone: i.phone, p_email: i.email, p_trade: i.trade,
    p_scope: i.scope, p_headcount: i.headcount, p_duration_days: i.durationDays, p_area: i.area,
    p_address: i.address, p_start_date: i.startDate, p_urgency: i.urgency, p_budget_note: i.budgetNote,
    p_source: i.source ?? 'web',
  });
  if (error) throw new Error(error.message);
  return data as string;
};

export interface ProviderInput {
  name: string; phone: string; trades: string[]; skills: string; experienceYears: number | null;
  area: string; languages: string[]; ownsTools: boolean; dayRateInr: number | null;
  availability: string; source?: string;
}

export const submitServiceProvider = async (i: ProviderInput): Promise<void> => {
  const { error } = await db.rpc('submit_service_provider', {
    p_name: i.name, p_phone: i.phone, p_trades: i.trades, p_skills: i.skills,
    p_experience_years: i.experienceYears, p_area: i.area, p_languages: i.languages,
    p_owns_tools: i.ownsTools, p_day_rate_inr: i.dayRateInr, p_availability: i.availability,
    p_source: i.source ?? 'web',
  });
  if (error) throw new Error(error.message);
};

// ---- Admin ----
export const adminListRequests = async (): Promise<ServiceRequest[]> => {
  const { data, error } = await db.from('service_requests').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data;
};
export const adminListProviders = async (): Promise<ServiceProvider[]> => {
  const { data, error } = await db.from('service_providers').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data;
};
export const adminUpdate = async (table: 'service_requests' | 'service_providers' | 'service_assignments', id: string, patch: Record<string, unknown>) => {
  const { error } = await db.from(table).update(patch).eq('id', id);
  if (error) throw error;
};
export const adminListAssignments = async (requestId: string): Promise<ServiceAssignment[]> => {
  const { data, error } = await db.from('service_assignments')
    .select('*, provider:service_providers(id, full_name, phone, trades)')
    .eq('request_id', requestId).order('created_at');
  if (error) throw error;
  return data;
};
export const adminOfferJob = async (requestId: string, providerId: string, rate?: number | null) => {
  const { error } = await db.from('service_assignments').insert({
    request_id: requestId, provider_id: providerId, status: 'offered', agreed_rate_inr: rate ?? null,
  });
  if (error) throw error;
};

export const waLink = (phone: string, text: string) =>
  `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`;
