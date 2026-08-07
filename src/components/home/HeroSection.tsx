import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ArrowRight, ShieldCheck, FileText, Lock } from 'lucide-react';

const QUICK_SEARCHES = [
  { label: 'ABB MCB', query: 'ABB MCB', category: 'low_voltage_switchgear' },
  { label: 'Havells MCCB', query: 'Havells MCCB', category: 'low_voltage_switchgear' },
  { label: 'Schneider contactor', query: 'Schneider contactor', category: 'starters_and_switches' },
  { label: 'L&T overload relay', query: 'overload relay', category: 'starters_and_switches' },
  { label: 'RR Kabel 4mm', query: 'RR Kabel 4', category: 'wires_and_cables' },
  { label: 'Siemens VFD', query: 'Siemens VFD', category: 'industrial_automation_vfd' },
];

interface HeroSectionProps {
  stats: { products: number; brands: number; categories: number };
}

const HeroSection: React.FC<HeroSectionProps> = ({ stats }) => {
  const navigate = useNavigate();
  const [query, setQuery] = React.useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) navigate(`/products?search=${encodeURIComponent(query.trim())}`);
  };

  return (
    <section className="border-b border-border bg-background">
      <div className="max-w-6xl mx-auto px-6 py-10 grid lg:grid-cols-2 gap-10 items-center">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 border border-green-200 rounded-full text-xs text-green-700 font-medium mb-5 dark:bg-green-950 dark:border-green-800 dark:text-green-400">
            <ShieldCheck className="h-3.5 w-3.5" />
            GST-compliant · verified sellers · escrow payments
          </div>
          <h1 className="text-3xl font-semibold text-foreground leading-snug tracking-tight mb-3">
            The procurement platform<br />for panel builders and OEMs
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed mb-6 max-w-md">
            Search {stats.products.toLocaleString()} products across {stats.brands} brands.
            Get GST invoices, compare quotes, and manage BOMs — built for purchase engineers.
          </p>
          <div className="flex gap-3 mb-7">
            <Link
              to="/products"
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <Search className="h-3.5 w-3.5" />
              Browse products
            </Link>
            <Link
              to="/buyer/bom/upload"
              className="inline-flex items-center gap-2 px-4 py-2 border border-border rounded-md text-sm text-foreground hover:bg-secondary transition-colors"
            >
              Upload BOM
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="flex gap-5">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5 text-green-600" />
              BIS / IEC certified stock
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <FileText className="h-3.5 w-3.5 text-green-600" />
              CGST/SGST invoices
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Lock className="h-3.5 w-3.5 text-green-600" />
              Escrow-protected
            </div>
          </div>
        </div>
        <div>
          <form onSubmit={handleSearch} className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder='Search by model, brand, or spec — e.g. "Siemens 3RT2 18A"'
              className="w-full h-11 pl-10 pr-4 border border-border rounded-md text-sm bg-background focus:outline-none focus:ring-1 focus:ring-primary text-foreground placeholder:text-muted-foreground"
            />
          </form>
          <div className="flex flex-wrap gap-1.5 mb-5">
            {QUICK_SEARCHES.map(q => (
              <button
                key={q.label}
                onClick={() => navigate(`/categories/${q.category}?search=${encodeURIComponent(q.query)}`)}
                className="px-2.5 py-1 bg-secondary border border-border rounded-full text-xs text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors"
              >
                {q.label}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { num: stats.products.toLocaleString(), label: 'products' },
              { num: stats.brands, label: 'brands' },
              { num: stats.categories, label: 'categories' },
            ].map(s => (
              <div key={s.label} className="bg-secondary border border-border rounded-lg p-3 text-center">
                <div className="text-xl font-semibold text-foreground">{s.num}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
