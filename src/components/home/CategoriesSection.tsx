import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Zap, Settings, Cable, Gauge, Cpu, Package } from 'lucide-react';

interface CategoryStat {
  slug: string;
  name: string;
  count: number;
  description: string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
}

const CATEGORIES: Omit<CategoryStat, 'count'>[] = [
  {
    slug: 'low_voltage_switchgear',
    name: 'Low voltage switchgear',
    description: 'MCB, MCCB, RCCB, switch disconnectors',
    icon: <Zap className="h-5 w-5" />,
    iconBg: 'bg-blue-50 dark:bg-blue-950',
    iconColor: 'text-blue-600 dark:text-blue-400',
  },
  {
    slug: 'starters_and_switches',
    name: 'Starters and switches',
    description: 'Contactors, motor starters, overload relays',
    icon: <Settings className="h-5 w-5" />,
    iconBg: 'bg-amber-50 dark:bg-amber-950',
    iconColor: 'text-amber-600 dark:text-amber-400',
  },
  {
    slug: 'wires_and_cables',
    name: 'Wires and cables',
    description: 'RR Kabel, Finolex, Polycab, KEI',
    icon: <Cable className="h-5 w-5" />,
    iconBg: 'bg-green-50 dark:bg-green-950',
    iconColor: 'text-green-600 dark:text-green-400',
  },
  {
    slug: 'testing_and_measuring_instruments',
    name: 'Meters and instruments',
    description: 'Energy meters, multifunction meters',
    icon: <Gauge className="h-5 w-5" />,
    iconBg: 'bg-purple-50 dark:bg-purple-950',
    iconColor: 'text-purple-600 dark:text-purple-400',
  },
  {
    slug: 'industrial_automation_vfd',
    name: 'Industrial automation',
    description: 'VFDs, drives, automation components',
    icon: <Cpu className="h-5 w-5" />,
    iconBg: 'bg-pink-50 dark:bg-pink-950',
    iconColor: 'text-pink-600 dark:text-pink-400',
  },
  {
    slug: 'capacitors_and_reactors',
    name: 'Capacitors and reactors',
    description: 'Power factor correction, APFC panels',
    icon: <Zap className="h-5 w-5" />,
    iconBg: 'bg-orange-50 dark:bg-orange-950',
    iconColor: 'text-orange-600 dark:text-orange-400',
  },
  {
    slug: 'switches_and_sockets',
    name: 'Switches and sockets',
    description: 'Modular switches, industrial sockets',
    icon: <Package className="h-5 w-5" />,
    iconBg: 'bg-teal-50 dark:bg-teal-950',
    iconColor: 'text-teal-600 dark:text-teal-400',
  },
  {
    slug: 'relays',
    name: 'Relays',
    description: 'Control relays, protection relays',
    icon: <Settings className="h-5 w-5" />,
    iconBg: 'bg-slate-50 dark:bg-slate-900',
    iconColor: 'text-slate-600 dark:text-slate-400',
  },
];

interface CategoriesSectionProps {
  counts: Record<string, number>;
}

const CategoriesSection: React.FC<CategoriesSectionProps> = ({ counts }) => (
  <section className="border-b border-border bg-background px-6 py-8 max-w-6xl mx-auto">
    <div className="flex items-baseline justify-between mb-5">
      <h2 className="text-base font-semibold text-foreground">Browse by category</h2>
      <Link to="/categories" className="text-xs text-primary flex items-center gap-1 hover:underline">
        View all <ArrowRight className="h-3 w-3" />
      </Link>
    </div>

    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {CATEGORIES.map(cat => (
        <Link
          key={cat.slug}
          to={`/categories/${cat.slug}`}
          className="group border border-border rounded-xl p-4 bg-card hover:border-primary/30 transition-colors"
        >
          <div className={`w-9 h-9 rounded-lg ${cat.iconBg} ${cat.iconColor} flex items-center justify-center mb-3`}>
            {cat.icon}
          </div>
          <div className="text-sm font-medium text-foreground mb-1 leading-snug">{cat.name}</div>
          <div className="text-xs text-muted-foreground mb-2 leading-snug">{cat.description}</div>
          {counts[cat.slug] !== undefined && (
            <div className="text-xs text-muted-foreground">{counts[cat.slug].toLocaleString()} products</div>
          )}
          <div className="text-xs text-primary mt-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            Explore <ArrowRight className="h-3 w-3" />
          </div>
        </Link>
      ))}
    </div>
  </section>
);

export default CategoriesSection;
