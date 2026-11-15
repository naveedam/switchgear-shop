import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, FileSpreadsheet, ShieldCheck, FileText, Lock } from 'lucide-react';

const QUICK_SEARCHES = [
  { label: 'ABB MCB', query: 'ABB MCB', category: 'low_voltage_switchgear' },
  { label: 'Havells MCCB', query: 'Havells MCCB', category: 'low_voltage_switchgear' },
  { label: 'Schneider contactor', query: 'Schneider contactor', category: 'starters_and_switches' },
  { label: 'L&T overload relay', query: 'overload relay', category: 'starters_and_switches' },
  { label: 'RR Kabel 4 sq mm', query: 'RR Kabel 4', category: 'wires_and_cables' },
  { label: 'Siemens VFD', query: 'Siemens VFD', category: 'industrial_automation_vfd' },
];

interface HeroSectionProps {
  stats: { products: number; brands: number; categories: number };
}

/**
 * The search block is styled as an equipment rating plate (dark plate, amber
 * rule, condensed type): the one bold element on the page. Everything else stays quiet.
 */
const HeroSection: React.FC<HeroSectionProps> = ({ stats }) => {
  const navigate = useNavigate();
  const [query, setQuery] = React.useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) navigate(`/products?search=${encodeURIComponent(query.trim())}`);
  };

  const hasStats = stats.products > 0;

  return (
    <section className="border-b border-border bg-background">
      <div className="container-wide py-8 sm:py-12 lg:py-16 grid gap-8 lg:grid-cols-[1fr_minmax(0,34rem)] lg:gap-14 items-center">
        <div className="max-w-xl">
          <h1 className="text-[2rem] leading-[1.1] sm:text-5xl sm:leading-[1.05] font-bold text-foreground">
            Switchgear for panel builders, priced by verified dealers
          </h1>
          <p className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed">
            {hasStats
              ? `${stats.products.toLocaleString('en-IN')} products from ${stats.brands} brands. `
              : ''}
            Upload a BOM and get a priced quote in minutes, with GST invoices and escrow-protected payment.
          </p>

          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <Link
              to="/buyer/bom/upload"
              className="inline-flex items-center justify-center gap-2 h-11 px-5 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Upload a BOM
            </Link>
            <Link
              to="/products"
              className="inline-flex items-center justify-center gap-2 h-11 px-5 border border-input rounded-md text-sm font-medium text-foreground hover:bg-secondary transition-colors"
            >
              Browse products
            </Link>
          </div>

          <ul className="mt-7 grid gap-2 text-sm text-muted-foreground sm:flex sm:flex-wrap sm:gap-x-6">
            <li className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-verified shrink-0" />BIS / IEC certified stock</li>
            <li className="flex items-center gap-2"><FileText className="h-4 w-4 text-verified shrink-0" />GST tax invoice on every order</li>
            <li className="flex items-center gap-2"><Lock className="h-4 w-4 text-verified shrink-0" />Payment held in escrow until dispatch</li>
          </ul>
        </div>

        {/* Rating plate */}
        <div className="rounded-lg bg-primary text-primary-foreground shadow-elevated overflow-hidden">
          <div className="h-1 bg-signal" aria-hidden="true" />
          <div className="p-5 sm:p-7">
            <label htmlFor="hero-search" className="block font-display text-xl sm:text-2xl font-semibold">
              Find a part
            </label>
            <p className="mt-1 text-sm text-primary-foreground/70">Search by model number, brand or rating.</p>
            <form onSubmit={handleSearch} className="mt-4 flex gap-2">
              <div className="relative flex-1 min-w-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <input
                  id="hero-search"
                  type="search"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="e.g. Siemens 3RT2 18A"
                  className="w-full h-12 pl-10 pr-3 rounded-md bg-background text-foreground text-base placeholder:text-muted-foreground border-0 focus:outline-none focus:ring-2 focus:ring-signal"
                />
              </div>
              <button
                type="submit"
                className="h-12 px-4 sm:px-5 rounded-md bg-signal text-primary font-semibold text-sm hover:brightness-95 transition shrink-0"
              >
                Search
              </button>
            </form>

            <div className="mt-4 flex flex-wrap gap-2">
              {QUICK_SEARCHES.map(q => (
                <button
                  key={q.label}
                  type="button"
                  onClick={() => navigate(`/categories/${q.category}?search=${encodeURIComponent(q.query)}`)}
                  className="px-3 py-1.5 rounded-md border border-primary-foreground/20 text-xs text-primary-foreground/85 hover:border-signal hover:text-primary-foreground transition-colors"
                >
                  {q.label}
                </button>
              ))}
            </div>

            {hasStats && (
              <dl className="mt-6 pt-5 border-t border-primary-foreground/15 grid grid-cols-3 gap-4 tabular">
                {[
                  { num: stats.products.toLocaleString('en-IN'), label: 'Products' },
                  { num: stats.brands, label: 'Brands' },
                  { num: stats.categories, label: 'Categories' },
                ].map(s => (
                  <div key={s.label}>
                    <dt className="text-xs text-primary-foreground/60">{s.label}</dt>
                    <dd className="font-display text-2xl font-semibold">{s.num}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
