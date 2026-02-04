import React from 'react';
import { Link } from 'react-router-dom';
import { Container } from '@/components/ui/container';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Gauge, 
  Zap, 
  TrendingDown, 
  ArrowRight, 
  CheckCircle2, 
  BarChart3,
  Lightbulb,
  Leaf
} from 'lucide-react';

const productCategories = [
  {
    title: 'Energy Meters',
    description: 'Digital and smart meters for energy monitoring',
    products: [
      { name: 'Digital Energy Meters', href: '/products?subcategory=energy-meters' },
      { name: 'Smart Meters', href: '/products?subcategory=energy-meters', badge: 'IoT Ready' },
      { name: 'Prepaid Meters', href: '/products?subcategory=prepaid-meters' },
      { name: 'Net Meters', href: '/products?subcategory=net-meters' },
    ],
    icon: Gauge,
  },
  {
    title: 'Multifunction Meters',
    description: 'Advanced meters for power quality analysis',
    products: [
      { name: 'Panel Meters', href: '/products?subcategory=multifunction-meters' },
      { name: 'Power Analyzers', href: '/products?subcategory=power-analyzers' },
      { name: 'Data Loggers', href: '/products?subcategory=data-loggers' },
      { name: 'Modbus Meters', href: '/products?subcategory=multifunction-meters', badge: 'BMS' },
    ],
    icon: BarChart3,
  },
  {
    title: 'Power Factor Correction',
    description: 'Capacitor banks and APFC panels',
    products: [
      { name: 'Power Capacitors', href: '/products?subcategory=capacitors' },
      { name: 'Detuned Reactors', href: '/products?subcategory=detuned-reactors' },
      { name: 'APFC Controllers', href: '/products?subcategory=apfc-controllers' },
      { name: 'APFC Panels', href: '/products?subcategory=apfc-panels' },
    ],
    icon: Zap,
  },
  {
    title: 'Current & Voltage Sensing',
    description: 'CTs, PTs, and transducers for accurate measurement',
    products: [
      { name: 'Current Transformers', href: '/products?subcategory=cts-pts' },
      { name: 'Potential Transformers', href: '/products?subcategory=cts-pts' },
      { name: 'Rogowski Coils', href: '/products?subcategory=rogowski-coils' },
      { name: 'Transducers', href: '/products?subcategory=transducers' },
    ],
    icon: TrendingDown,
  },
];

const energySolutions = [
  {
    title: 'Power Factor Improvement',
    description: 'Maintain power factor above 0.95 to avoid utility penalties and reduce losses.',
    savings: 'Up to 20% reduction in electricity bills',
    components: ['APFC Panels', 'Power Capacitors', 'Detuned Reactors'],
    icon: Zap,
  },
  {
    title: 'Energy Monitoring System',
    description: 'Real-time monitoring of energy consumption with analytics and reporting.',
    savings: 'Identify 10-15% energy wastage',
    components: ['Smart Meters', 'Communication Gateways', 'Software Platform'],
    icon: BarChart3,
  },
  {
    title: 'Load Management',
    description: 'Optimize peak demand and reduce maximum demand charges.',
    savings: 'Up to 30% reduction in demand charges',
    components: ['Demand Controllers', 'Auto-changeover', 'Timer Switches'],
    icon: TrendingDown,
  },
];

const benefits = [
  {
    metric: '20-30%',
    label: 'Energy Cost Reduction',
    description: 'Through PF correction and monitoring',
  },
  {
    metric: '0.99',
    label: 'Target Power Factor',
    description: 'Avoid penalties, earn incentives',
  },
  {
    metric: '24/7',
    label: 'Remote Monitoring',
    description: 'IoT-enabled smart meters',
  },
  {
    metric: '< 5%',
    label: 'Harmonic Distortion',
    description: 'With detuned reactor systems',
  },
];

const EnergyManagementPage: React.FC = () => {
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
              Energy Management Solutions
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              Reduce energy costs with smart metering, power factor correction, 
              and energy monitoring systems. Comply with energy audit requirements 
              and sustainability goals.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button size="lg" asChild>
                <Link to="/products?subcategory=energy-meters">
                  Browse Energy Meters
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/contact">
                  Energy Audit Support
                </Link>
              </Button>
            </div>
          </div>
        </Container>
      </section>

      {/* Benefits Stats */}
      <section className="py-12 border-b">
        <Container>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {benefits.map((benefit) => (
              <div key={benefit.label} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-primary mb-2">
                  {benefit.metric}
                </div>
                <div className="font-medium text-foreground">{benefit.label}</div>
                <div className="text-sm text-muted-foreground">{benefit.description}</div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Product Categories */}
      <section className="py-16">
        <Container>
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Energy Management Products
            </h2>
            <p className="text-muted-foreground max-w-2xl">
              From basic energy meters to advanced power analyzers and APFC systems.
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

      {/* Energy Solutions */}
      <section className="py-16 bg-muted/50">
        <Container>
          <div className="mb-12">
            <div className="flex items-center gap-2 mb-4">
              <Leaf className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium text-primary uppercase tracking-wider">
                Solutions
              </span>
            </div>
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Energy Saving Solutions
            </h2>
            <p className="text-muted-foreground max-w-2xl">
              Proven solutions to reduce energy costs and improve efficiency.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {energySolutions.map((solution) => (
              <Card key={solution.title}>
                <CardHeader>
                  <div className="p-3 rounded-lg bg-primary/10 w-fit mb-2">
                    <solution.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{solution.title}</CardTitle>
                  <CardDescription>{solution.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                    <div className="text-sm font-medium text-primary">{solution.savings}</div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-foreground mb-2">Key Components</h4>
                    <ul className="space-y-1">
                      {solution.components.map((comp) => (
                        <li key={comp} className="text-sm text-muted-foreground flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                          {comp}
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

      {/* APFC Highlight */}
      <section className="py-16">
        <Container>
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge variant="secondary" className="mb-4">
                Power Factor Correction
              </Badge>
              <h2 className="text-3xl font-bold text-foreground mb-6">
                APFC Systems for Industrial Loads
              </h2>
              <p className="text-muted-foreground mb-6">
                Automatic Power Factor Correction panels maintain optimal power factor 
                regardless of load variations. Avoid penalties and earn incentives from 
                utility providers.
              </p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2 text-muted-foreground">
                  <Lightbulb className="h-5 w-5 text-primary" />
                  Automatic step switching based on load
                </li>
                <li className="flex items-center gap-2 text-muted-foreground">
                  <Lightbulb className="h-5 w-5 text-primary" />
                  Detuned reactors for harmonic filtering
                </li>
                <li className="flex items-center gap-2 text-muted-foreground">
                  <Lightbulb className="h-5 w-5 text-primary" />
                  Communication interface for remote monitoring
                </li>
              </ul>
              <Button asChild>
                <Link to="/products?subcategory=apfc-panels">
                  Browse APFC Systems
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="bg-gradient-to-br from-primary/5 to-secondary/10 rounded-2xl p-8">
              <h3 className="text-xl font-semibold text-foreground mb-4">
                APFC Panel Sizing
              </h3>
              <p className="text-muted-foreground mb-4">
                Get the right APFC panel sizing based on your load profile.
              </p>
              <div className="space-y-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  Connected load and demand
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  Existing power factor
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  Harmonic content in system
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  Target power factor
                </div>
              </div>
              <Button variant="outline" className="mt-6" asChild>
                <Link to="/contact">
                  Get APFC Recommendation
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
              Start Saving Energy Today
            </h2>
            <p className="text-primary-foreground/80 mb-8">
              Explore our range of energy management products and start reducing 
              your electricity costs. Expert support for energy audits and system design.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg" variant="secondary" asChild>
                <Link to="/products">
                  Browse All Products
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10" asChild>
                <Link to="/contact">
                  Contact for Energy Audit
                </Link>
              </Button>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
};

export default EnergyManagementPage;
