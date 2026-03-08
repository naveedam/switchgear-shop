import React from 'react';
import { ShieldCheck, FileText, Lock, BadgeCheck } from 'lucide-react';

const trustPillars = [
  { icon: BadgeCheck, label: 'GST-Verified Sellers' },
  { icon: Lock, label: 'Escrow-Protected Payments' },
  { icon: FileText, label: 'GST-Compliant Invoicing' },
  { icon: ShieldCheck, label: 'BIS & IEC Certified Products' },
];

const brands = [
  { name: 'Schneider Electric', logo: 'SE' },
  { name: 'Siemens', logo: 'SIEMENS' },
  { name: 'ABB', logo: 'ABB' },
  { name: 'Legrand', logo: 'LEGRAND' },
  { name: 'Havells', logo: 'HAVELLS' },
  { name: 'L&T', logo: 'L&T' },
];

const TrustSection: React.FC = () => {
  return (
    <section className="py-10 bg-secondary/30 border-y border-border">
      <div className="container-wide space-y-6">
        {/* Trust Pillars */}
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
          {trustPillars.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <div
                key={pillar.label}
                className="flex items-center gap-2 text-sm text-muted-foreground font-medium"
              >
                <Icon className="h-4 w-4 text-primary" />
                {pillar.label}
              </div>
            );
          })}
        </div>

        {/* Brand Logos */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-4 border-t border-border/50">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider whitespace-nowrap">
            Authorized brands on platform
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
            {brands.map((brand) => (
              <div 
                key={brand.name}
                className="text-lg md:text-xl font-bold text-muted-foreground/60 hover:text-muted-foreground transition-colors cursor-default"
                title={brand.name}
              >
                {brand.logo}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default TrustSection;
