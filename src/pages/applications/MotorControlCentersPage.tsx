import React from 'react';
import { Link } from 'react-router-dom';
import { Container } from '@/components/ui/container';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Cog, 
  Shield, 
  Gauge, 
  ArrowRight, 
  CheckCircle2, 
  Zap,
  Settings,
  Activity
} from 'lucide-react';

const productCategories = [
  {
    title: 'Motor Starters',
    description: 'DOL, Star-Delta, and soft starters for various motor sizes',
    products: [
      { name: 'DOL Starters', href: '/products?subcategory=motor-starters', badge: 'Common' },
      { name: 'Star-Delta Starters', href: '/products?subcategory=motor-starters' },
      { name: 'Soft Starters', href: '/products?subcategory=soft-starters' },
      { name: 'Auto-Transformer Starters', href: '/products?subcategory=motor-starters' },
    ],
    icon: Cog,
  },
  {
    title: 'Contactors & Relays',
    description: 'Power contactors and thermal overload relays',
    products: [
      { name: 'Power Contactors', href: '/products?subcategory=contactors', badge: 'Essential' },
      { name: 'Thermal Overload Relays', href: '/products?subcategory=overload-relays' },
      { name: 'Electronic Overload Relays', href: '/products?subcategory=overload-relays' },
      { name: 'Motor Protection Relays', href: '/products?subcategory=motor-protection-relays' },
    ],
    icon: Settings,
  },
  {
    title: 'Variable Frequency Drives',
    description: 'VFDs for speed control and energy savings',
    products: [
      { name: 'AC Drives', href: '/products?subcategory=vfds', badge: 'Energy Saving' },
      { name: 'Servo Drives', href: '/products?subcategory=servo-drives' },
      { name: 'Drive Accessories', href: '/products?subcategory=drive-accessories' },
      { name: 'Braking Resistors', href: '/products?subcategory=braking-resistors' },
    ],
    icon: Activity,
  },
  {
    title: 'Protection & Monitoring',
    description: 'Motor protection relays and monitoring devices',
    products: [
      { name: 'Motor Protection Relays', href: '/products?subcategory=motor-protection-relays' },
      { name: 'Phase Sequence Relays', href: '/products?subcategory=control-relays' },
      { name: 'Current Monitoring', href: '/products?subcategory=panel-instruments' },
      { name: 'Temperature Sensors', href: '/products?subcategory=sensors' },
    ],
    icon: Shield,
  },
];

const starterTypes = [
  {
    name: 'DOL Starter',
    suitable: 'Up to 7.5 kW',
    components: ['MCCB/Fuse', 'Contactor', 'Overload Relay'],
    advantages: ['Simple design', 'Low cost', 'Easy maintenance'],
  },
  {
    name: 'Star-Delta Starter',
    suitable: '7.5 kW to 75 kW',
    components: ['MCCB', '3 Contactors', 'Timer', 'Overload Relay'],
    advantages: ['Reduced starting current', 'Lower voltage drop', 'Cost effective'],
  },
  {
    name: 'Soft Starter',
    suitable: '15 kW and above',
    components: ['MCCB', 'Soft Starter Unit', 'Bypass Contactor'],
    advantages: ['Smooth acceleration', 'Reduced mechanical stress', 'Programmable'],
  },
  {
    name: 'VFD Starter',
    suitable: 'Any motor size',
    components: ['MCCB', 'Input Reactor', 'VFD', 'Output Reactor'],
    advantages: ['Variable speed', 'Energy savings', 'Process control'],
  },
];

const MotorControlCentersPage: React.FC = () => {
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
              Motor Control Centers
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              Complete MCC solutions with motor starters, contactors, VFDs, and 
              protection relays. From small pumps to large industrial drives.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button size="lg" asChild>
                <Link to="/products?subcategory=contactors">
                  Browse Contactors
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/contact">
                  Get MCC Quote
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
              MCC Components
            </h2>
            <p className="text-muted-foreground max-w-2xl">
              All components required for building intelligent motor control centers.
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

      {/* Starter Selection Guide */}
      <section className="py-16 bg-muted/50">
        <Container>
          <div className="mb-12">
            <div className="flex items-center gap-2 mb-4">
              <Gauge className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium text-primary uppercase tracking-wider">
                Selection Guide
              </span>
            </div>
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Motor Starter Selection
            </h2>
            <p className="text-muted-foreground max-w-2xl">
              Choose the right starter based on motor size, application, and starting requirements.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {starterTypes.map((starter) => (
              <Card key={starter.name}>
                <CardHeader>
                  <CardTitle className="text-lg">{starter.name}</CardTitle>
                  <Badge variant="outline" className="w-fit">
                    {starter.suitable}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-foreground mb-2">Components</h4>
                    <ul className="space-y-1">
                      {starter.components.map((comp) => (
                        <li key={comp} className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <span className="h-1 w-1 rounded-full bg-primary" />
                          {comp}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-foreground mb-2">Advantages</h4>
                    <ul className="space-y-1">
                      {starter.advantages.map((adv) => (
                        <li key={adv} className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <CheckCircle2 className="h-3 w-3 text-primary" />
                          {adv}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      {/* VFD Highlight */}
      <section className="py-16">
        <Container>
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge variant="secondary" className="mb-4">
                Energy Efficiency
              </Badge>
              <h2 className="text-3xl font-bold text-foreground mb-6">
                VFDs for Energy Savings
              </h2>
              <p className="text-muted-foreground mb-6">
                Variable Frequency Drives can reduce energy consumption by up to 50% 
                in pump and fan applications. Get VFDs from leading brands with local 
                support and quick delivery.
              </p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2 text-muted-foreground">
                  <Zap className="h-5 w-5 text-primary" />
                  Precise speed control for process optimization
                </li>
                <li className="flex items-center gap-2 text-muted-foreground">
                  <Zap className="h-5 w-5 text-primary" />
                  Built-in motor protection features
                </li>
                <li className="flex items-center gap-2 text-muted-foreground">
                  <Zap className="h-5 w-5 text-primary" />
                  Communication interfaces for automation
                </li>
              </ul>
              <Button asChild>
                <Link to="/products?subcategory=vfds">
                  Browse VFDs
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="bg-gradient-to-br from-primary/5 to-secondary/10 rounded-2xl p-8">
              <h3 className="text-xl font-semibold text-foreground mb-4">
                VFD Sizing Calculator
              </h3>
              <p className="text-muted-foreground mb-4">
                Need help selecting the right VFD for your application?
              </p>
              <div className="space-y-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  Motor power and voltage
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  Application type (pump, fan, conveyor)
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  Speed range requirements
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  Communication protocol needs
                </div>
              </div>
              <Button variant="outline" className="mt-6" asChild>
                <Link to="/contact">
                  Get VFD Recommendation
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
              Build Your MCC with Confidence
            </h2>
            <p className="text-primary-foreground/80 mb-8">
              Source all MCC components from verified sellers. Get technical support 
              for starter selection, VFD sizing, and protection coordination.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg" variant="secondary" asChild>
                <Link to="/products">
                  Browse All Products
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10" asChild>
                <Link to="/contact">
                  Get Expert Help
                </Link>
              </Button>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
};

export default MotorControlCentersPage;
