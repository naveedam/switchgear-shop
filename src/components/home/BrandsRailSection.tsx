import React from 'react';
import { brandPath } from '@/lib/slug';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const BRANDS = [
  { id: '4b442eb3-87ca-4e3f-bb4b-99550c0775cb', name: 'ABB' },
  { id: '8f88abf7-db43-423d-92b3-ffdbdc1c3446', name: 'Havells' },
  { id: '633815cb-b043-42ac-bd72-b803c6bce1b6', name: 'Schneider Electric' },
  { id: 'c6775030-5d53-4e57-9151-a5be09ed1294', name: 'L&T' },
  { id: 'd4e1bb5c-d795-4c59-ad4e-677dffbb6a20', name: 'Legrand' },
  { id: 'f03caea4-145e-4207-89d0-907dc0ede710', name: 'Siemens' },
  { id: '4d33392e-b8fa-4969-adc2-74a29d69abca', name: 'HPL' },
  { id: '6061c3df-0de5-4164-a0a2-26c6557db6c2', name: 'Hager' },
  { id: '4a63e203-8a13-4bc7-bbde-71cb95786b60', name: 'Indo Asian' },
  { id: 'daff8b94-5eb4-4cf2-a9ba-2b73c1dcc659', name: 'RR Kabel' },
  { id: '64003e09-36c4-493f-ad73-c224204a9fb9', name: 'Finolex' },
  { id: '261386b4-bb50-47e3-a3ab-8ec17819ee8c', name: 'Polycab' },
  { id: '74ce8963-db3e-48dd-96d2-ac0c69058dd9', name: 'KEI Cables' },
];

interface BrandsRailSectionProps {
  counts: Record<string, number>;
}

const BrandsRailSection: React.FC<BrandsRailSectionProps> = ({ counts }) => (
  <section className="border-b border-border bg-secondary/30 px-6 py-6 max-w-6xl mx-auto">
    <div className="flex items-baseline justify-between mb-4">
      <h2 className="text-base font-semibold text-foreground">Browse by brand</h2>
      <Link to="/brands" className="text-xs text-primary flex items-center gap-1 hover:underline">
        All 58 brands <ArrowRight className="h-3 w-3" />
      </Link>
    </div>
    <div className="flex flex-wrap gap-2">
      {BRANDS.map(brand => (
        <Link
          key={brand.id}
          to={brandPath(brand.name)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-card border border-border rounded-full text-xs text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors"
        >
          {brand.name}
          {counts[brand.id] !== undefined && (
            <span className="text-muted-foreground/60">{counts[brand.id].toLocaleString()}</span>
          )}
        </Link>
      ))}
    </div>
  </section>
);

export default BrandsRailSection;
