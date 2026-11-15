import React from 'react';
import { brandPath } from '@/lib/slug';
import { Link } from 'react-router-dom';

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
  <section className="border-b border-border bg-secondary">
    <div className="container-wide py-10 sm:py-12">
      <div className="flex items-end justify-between gap-4 mb-5">
        <h2 className="text-2xl sm:text-3xl">Shop by brand</h2>
        <Link to="/brands" className="text-sm font-medium text-primary hover:underline shrink-0">
          All brands
        </Link>
      </div>
      <div className="flex flex-wrap gap-2">
        {BRANDS.map(brand => (
          <Link
            key={brand.id}
            to={brandPath(brand.name)}
            className="inline-flex items-center gap-2 h-10 px-4 bg-background border border-border rounded-md text-sm font-medium text-foreground hover:border-primary transition-colors"
          >
            {brand.name}
            {counts[brand.id] > 0 && (
              <span className="text-xs font-normal text-muted-foreground tabular">{counts[brand.id].toLocaleString('en-IN')}</span>
            )}
          </Link>
        ))}
      </div>
    </div>
  </section>
);

export default BrandsRailSection;
