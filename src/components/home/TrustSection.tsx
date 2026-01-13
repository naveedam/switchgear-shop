import React from 'react';

const partners = [
  { name: 'Schneider Electric', logo: 'SE' },
  { name: 'Siemens', logo: 'SIEMENS' },
  { name: 'ABB', logo: 'ABB' },
  { name: 'Legrand', logo: 'LEGRAND' },
  { name: 'Havells', logo: 'HAVELLS' },
  { name: 'L&T', logo: 'L&T' },
];

const TrustSection: React.FC = () => {
  return (
    <section className="py-12 bg-secondary/30 border-y border-border">
      <div className="container-wide">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider whitespace-nowrap">
            Trusted by leading brands
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
            {partners.map((partner) => (
              <div 
                key={partner.name}
                className="text-lg md:text-xl font-bold text-muted-foreground/60 hover:text-muted-foreground transition-colors cursor-default"
                title={partner.name}
              >
                {partner.logo}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default TrustSection;
