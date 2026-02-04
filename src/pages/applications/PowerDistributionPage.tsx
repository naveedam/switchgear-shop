import React from 'react';
import { Link } from 'react-router-dom';
import { Container } from '@/components/ui/container';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Zap, 
  Shield, 
  Gauge, 
  ArrowRight, 
  CheckCircle2, 
  Cable,
  Building2,
  Factory
} from 'lucide-react';

const productCategories = [
  {
    title: 'Main Distribution',
    description: 'ACBs, MCCBs, and switch disconnectors for main incoming',
    products: [
      { name: 'ACBs', href: '/products?subcategory=acb', badge: 'High Capacity' },
      { name: 'MCCBs 100-800A', href: '/products?subcategory=mccb' },
      { name: 'Switch Disconnectors', href: '/products?subcategory=switch-disconnectors' },
      { name: 'Changeover Switches', href: '/products?subcategory=changeover-switches' },
    ],
    icon: Zap,
  },
  {
    title: 'Sub-Distribution',
    description: 'Distribution boards, MCBs, and busbar systems',
    products: [
      { name: 'Distribution Boards', href: '/products?subcategory=distribution-boards' },
      { name: 'MCBs', href: '/products?subcategory=mcb' },
      { name: 'Busbar Trunking', href: '/products?subcategory=busbar-trunking' },
      { name: 'Cable Trays', href: '/products?subcategory=cable-trays' },
    ],
    icon: Building2,
  },
  {
    title: 'Protection Devices',
    description: 'Earth leakage and surge protection devices',
    products: [
      { name: 'RCCBs', href: '/products?subcategory=rccb-rcbo' },
      { name: 'RCBOs', href: '/products?subcategory=rccb-rcbo' },
      { name: 'Surge Protection', href: '/products?subcategory=surge-protection' },
      { name: 'Isolators', href: '/products?subcategory=isolators' },
    ],
    icon: Shield,
  },
  {
    title: 'Metering & Monitoring',
    description: 'Energy meters and power quality analyzers',
    products: [
      { name: 'Energy Meters', href: '/products?subcategory=energy-meters', badge: 'Smart' },
      { name: 'Multifunction Meters', href: '/products?subcategory=multifunction-meters' },
      { name: 'CTs & PTs', href: '/products?subcategory=cts-pts' },
      { name: 'Power Analyzers', href: '/products?subcategory=power-analyzers' },
    ],
    icon: Gauge,
  },
];

const applications = [
  {
    title: 'Commercial Buildings',
    description: 'Complete power distribution solutions for offices, malls, and commercial complexes.',
    features: ['Main LT Panels', 'Floor DBs', 'Energy Metering', 'Surge Protection'],
    icon: Building2,
  },
  {
    title: 'Industrial Facilities',
    description: 'Heavy-duty distribution systems for manufacturing plants and factories.',
    features: ['HT/LT Switchgear', 'Power Factor Correction', 'Load Management', 'Transformer Protection'],
    icon: Factory,
  },
  {
    title: 'Infrastructure Projects',
    description: 'Distribution infrastructure for metros, airports, and public utilities.',
    features: ['Outdoor Switchgear', 'Ring Main Units', 'Feeder Pillars', 'Street Lighting'],
    icon: Cable,
  },
];

const PowerDistributionPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/10 via-background to-secondary/20 py-16 md:py-24">
        <Container>
          <div className="max-w-3xl">
            <Badge variant="secondary" className="mb-4">
              Application Guide
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Power Distribution Solutions
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              Comprehensive range of switchgear and distribution equipment for 
              commercial, industrial, and infrastructure power systems. From main 
              incoming to final distribution.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button size="lg" asChild>
                <Link to="/products?category=low-voltage-switchgear">
                  Browse Products
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/contact">
                  Get Project Quote
                </Link>
              </Button>
            </div>
          </div>
        </Container>
      </section>

      {/* Product Categories */}
      <section className="py-16">
        <Container>
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Distribution Equipment Categories
            </h2>
            <p className="text-muted-foreground max-w-2xl">
              From ACBs to MCBs, find all components needed for your power distribution network.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {productCategories.map((category) => (
              <Card key={category.title} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-primary/10">
                      <category.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-xl">{category.title}</CardTitle>
                      <CardDescription className="mt-1">
                        {category.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {category.products.map((product) => (
                      <Link
                        key={product.name}
                        to={product.href}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground text-sm hover:bg-secondary/80 transition-colors"
                      >
                        {product.name}
                        {product.badge && (
                          <Badge variant="default" className="text-[10px] px-1.5 py-0">
                            {product.badge}
                          </Badge>
                        )}
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      {/* Application Areas */}
      <section className="py-16 bg-muted/50">
        <Container>
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Application Areas
            </h2>
            <p className="text-muted-foreground max-w-2xl">
              Power distribution solutions tailored for different sectors and requirements.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {applications.map((app) => (
              <Card key={app.title}>
                <CardHeader>
                  <div className="p-3 rounded-lg bg-primary/10 w-fit mb-2">
                    <app.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{app.title}</CardTitle>
                  <CardDescription>{app.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {app.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      {/* Technical Specifications */}
      <section className="py-16">
        <Container>
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-6">
                Voltage Levels Supported
              </h2>
              <div className="space-y-4">
                <div className="p-4 rounded-lg border bg-card">
                  <h3 className="font-semibold text-foreground mb-2">Low Voltage (LV)</h3>
                  <p className="text-sm text-muted-foreground">
                    Up to 1000V AC - MCBs, MCCBs, ACBs, Distribution Boards
                  </p>
                </div>
                <div className="p-4 rounded-lg border bg-card">
                  <h3 className="font-semibold text-foreground mb-2">Medium Voltage (MV)</h3>
                  <p className="text-sm text-muted-foreground">
                    1kV to 36kV - VCBs, Ring Main Units, SF6 Switchgear
                  </p>
                </div>
                <div className="p-4 rounded-lg border bg-card">
                  <h3 className="font-semibold text-foreground mb-2">Extra Low Voltage (ELV)</h3>
                  <p className="text-sm text-muted-foreground">
                    Below 50V AC - Control circuits, Signaling, SELV systems
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-primary/5 to-secondary/10 rounded-2xl p-8">
              <h3 className="text-xl font-semibold text-foreground mb-4">
                Need Help Selecting Components?
              </h3>
              <p className="text-muted-foreground mb-6">
                Our technical team can help you select the right switchgear based on 
                your load requirements, fault levels, and coordination studies.
              </p>
              <Button asChild>
                <Link to="/contact">
                  Talk to an Expert
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </Container>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary text-primary-foreground">
        <Container>
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold mb-4">
              Power Your Projects with Quality Switchgear
            </h2>
            <p className="text-primary-foreground/80 mb-8">
              Access the complete range of power distribution equipment from 
              verified manufacturers. Competitive pricing for EPCs and contractors.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg" variant="secondary" asChild>
                <Link to="/products">
                  Browse All Products
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10" asChild>
                <Link to="/sellers">
                  View Sellers
                </Link>
              </Button>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
};

export default PowerDistributionPage;
