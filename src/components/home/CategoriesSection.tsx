import React from 'react';
import { Link } from 'react-router-dom';
import { Zap, Settings, Cable, Gauge, Cpu, Package } from 'lucide-react';

interface CategoryStat {
  slug: string;
  name: string;
  count: number;
  description: string;
  icon: React.ReactNode;
}

const CATEGORIES: Omit<CategoryStat, 'count'>[] = [
  {
    slug: 'low_voltage_switchgear',
    name: 'Low voltage switchgear',
    description: 'MCB, MCCB, RCCB, switch disconnectors',
    icon: <Zap className="h-5 w-5" />,
  },
  {
    slug: 'starters_and_switches',
    name: 'Starters and switches',
    description: 'Contactors, motor starters, overload relays',
    icon: <Settings className="h-5 w-5" />,
  },
  {
    slug: 'wires_and_cables',
    name: 'Wires and cables',
    description: 'RR Kabel, Finolex, Polycab, KEI',
    icon: <Cable className="h-5 w-5" />,
  },
  {
    slug: 'testing_and_measuring_instruments',
    name: 'Meters and instruments',
    description: 'Energy meters, multifunction meters',
    icon: <Gauge className="h-5 w-5" />,
  },
  {
    slug: 'industrial_automation_vfd',
    name: 'Industrial automation',
    description: 'VFDs, drives, automation components',
    icon: <Cpu className="h-5 w-5" />,
  },
  {
    slug: 'capacitors_and_reactors',
    name: 'Capacitors and reactors',
    description: 'Power factor correction, APFC panels',
    icon: <Zap className="h-5 w-5" />,
  },
  {
    slug: 'switches_and_sockets',
    name: 'Switches and sockets',
    description: 'Modular switches, industrial sockets',
    icon: <Package className="h-5 w-5" />,
  },
  {
    slug: 'relays',
    name: 'Relays',
    description: 'Control relays, protection relays',
    icon: <Settings className="h-5 w-5" />,
  },
];

interface CategoriesSectionProps {
  counts: Record<string, number>;
}

const CategoriesSection: React.FC<CategoriesSectionProps> = ({ counts }) => (
  <section className="border-b border-border">
    <div className="container-wide py-10 sm:py-12">
      <div className="flex items-end justify-between gap-4 mb-5">
        <h2 className="text-2xl sm:text-3xl">Shop by category</h2>
        <Link to="/categories" className="text-sm font-medium text-primary hover:underline shrink-0">
          All categories
        </Link>
      </div>

      <ul className="grid grid-cols-1 min-[480px]:grid-cols-2 lg:grid-cols-4 border-t border-l border-border">
        {CATEGORIES.map(cat => (
          <li key={cat.slug} className="border-b border-r border-border">
            <Link
              to={`/categories/${cat.slug}`}
              className="flex h-full items-start gap-3 p-4 sm:p-5 hover:bg-secondary transition-colors"
            >
              <span className="mt-0.5 w-9 h-9 rounded-md bg-primary text-primary-foreground flex items-center justify-center shrink-0" aria-hidden="true">
                {cat.icon}
              </span>
              <span className="min-w-0">
                <span className="block font-medium text-foreground leading-snug">{cat.name}</span>
                <span className="block text-sm text-muted-foreground leading-snug mt-0.5">{cat.description}</span>
                {counts[cat.slug] > 0 && (
                  <span className="block text-xs text-muted-foreground mt-2 tabular">
                    {counts[cat.slug].toLocaleString('en-IN')} products
                  </span>
                )}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  </section>
);

export default CategoriesSection;
