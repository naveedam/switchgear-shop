import React from 'react';
import { Link } from 'react-router-dom';
import { Container } from '@/components/ui/container';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Zap, 
  Shield, 
  Settings, 
  ArrowRight, 
  CheckCircle2, 
  Package,
  FileText,
  Wrench
} from 'lucide-react';

const productCategories = [
  {
    title: 'Circuit Protection',
    description: 'MCCBs, MCBs, and RCCBs for reliable circuit protection',
    products: [
      { name: 'MCCBs', href: '/products?subcategory=mccb', badge: 'Essential' },
      { name: 'MCBs', href: '/products?subcategory=mcb' },
      { name: 'RCCBs', href: '/products?subcategory=rccb-rcbo' },
      { name: 'ACBs', href: '/products?subcategory=acb' },
    ],
    icon: Shield,
  },
  {
    title: 'Motor Control',
    description: 'Contactors, starters, and relays for motor control circuits',
    products: [
      { name: 'Contactors', href: '/products?subcategory=contactors', badge: 'Popular' },
      { name: 'Overload Relays', href: '/products?subcategory=overload-relays' },
      { name: 'Motor Starters', href: '/products?subcategory=motor-starters' },
      { name: 'Control Relays', href: '/products?subcategory=control-relays' },
    ],
    icon: Settings,
  },
  {
    title: 'Distribution & Enclosures',
    description: 'Panel boards, busbars, and enclosure accessories',
    products: [
      { name: 'Distribution Boards', href: '/products?subcategory=distribution-boards' },
      { name: 'Busbars', href: '/products?subcategory=busbars' },
      { name: 'Terminal Blocks', href: '/products?subcategory=terminal-blocks' },
      { name: 'Panel Accessories', href: '/products?subcategory=panel-accessories' },
    ],
    icon: Package,
  },
  {
    title: 'Measurement & Indication',
    description: 'Meters, indicators, and monitoring devices',
    products: [
      { name: 'Multifunction Meters', href: '/products?subcategory=multifunction-meters' },
      { name: 'Ammeters & Voltmeters', href: '/products?subcategory=panel-instruments' },
      { name: 'CTs & PTs', href: '/products?subcategory=cts-pts' },
      { name: 'Pilot Lamps', href: '/products?subcategory=indicators' },
    ],
    icon: Zap,
  },
];

const solutionGuides = [
  {
    title: 'LT Panel Design Guide',
    description: 'Complete guide for designing low-tension electrical panels compliant with IS standards.',
    topics: ['Single Line Diagram', 'Component Selection', 'Busbar Sizing', 'Protection Coordination'],
  },
  {
    title: 'MCC Panel Configuration',
    description: 'Motor Control Center panel design with proper starter selection and interlocking.',
    topics: ['DOL vs Star-Delta', 'Cable Sizing', 'Thermal Protection', 'VFD Integration'],
  },
  {
    title: 'APFC Panel Setup',
    description: 'Automatic Power Factor Correction panel design for industrial loads.',
    topics: ['Capacitor Bank Sizing', 'Detuned Reactors', 'Controller Selection', 'Harmonic Analysis'],
  },
];

const benefits = [
  'IS/IEC compliant products from verified manufacturers',
  'Complete BOM support with technical specifications',
  'Bulk pricing for panel builders and OEMs',
  'Fast dispatch from Bangalore-based sellers',
  'GST-compliant invoicing from individual sellers',
];

const PanelBuildingPage: React.FC = () => {
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
              Panel Building Solutions
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              Complete range of switchgear, protection devices, and panel accessories 
              for LT panels, MCC panels, APFC panels, and control panels. Source directly 
              from verified manufacturers and distributors.
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
                  Get Bulk Quote
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
              Essential Components for Panel Building
            </h2>
            <p className="text-muted-foreground max-w-2xl">
              Curated selection of switchgear and accessories from leading brands 
              like Schneider, ABB, Siemens, L&T, and Havells.
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

      {/* Solution Guides */}
      <section className="py-16 bg-muted/50">
        <Container>
          <div className="mb-12">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium text-primary uppercase tracking-wider">
                Technical Resources
              </span>
            </div>
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Panel Design Guides
            </h2>
            <p className="text-muted-foreground max-w-2xl">
              Technical guides and best practices for designing compliant electrical panels.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {solutionGuides.map((guide) => (
              <Card key={guide.title}>
                <CardHeader>
                  <CardTitle className="text-lg">{guide.title}</CardTitle>
                  <CardDescription>{guide.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {guide.topics.map((topic) => (
                      <li key={topic} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                        {topic}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      {/* Why Choose Us */}
      <section className="py-16">
        <Container>
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-6">
                Why Panel Builders Choose SwitchgearShop
              </h2>
              <ul className="space-y-4">
                {benefits.map((benefit) => (
                  <li key={benefit} className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-gradient-to-br from-primary/5 to-secondary/10 rounded-2xl p-8">
              <div className="flex items-center gap-3 mb-4">
                <Wrench className="h-8 w-8 text-primary" />
                <h3 className="text-xl font-semibold text-foreground">Need Custom BOM?</h3>
              </div>
              <p className="text-muted-foreground mb-6">
                Share your panel specifications or single-line diagram and get a 
                complete bill of materials with competitive pricing from multiple sellers.
              </p>
              <Button asChild>
                <Link to="/contact">
                  Request BOM Quote
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
              Start Building Your Panel Today
            </h2>
            <p className="text-primary-foreground/80 mb-8">
              Browse our complete catalog of switchgear and panel accessories. 
              Get instant quotes from verified sellers across India.
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

export default PanelBuildingPage;
