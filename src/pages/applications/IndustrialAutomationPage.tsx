import React from 'react';
import { Link } from 'react-router-dom';
import { Container } from '@/components/ui/container';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Cpu, 
  Monitor, 
  Activity, 
  ArrowRight, 
  CheckCircle2, 
  Zap,
  Settings,
  Network,
  Box
} from 'lucide-react';

const productCategories = [
  {
    title: 'PLCs & Controllers',
    description: 'Programmable logic controllers for process automation',
    products: [
      { name: 'Micro PLCs', href: '/products?subcategory=plcs' },
      { name: 'Modular PLCs', href: '/products?subcategory=plcs', badge: 'Industrial' },
      { name: 'Safety PLCs', href: '/products?subcategory=safety-plcs' },
      { name: 'Motion Controllers', href: '/products?subcategory=motion-controllers' },
    ],
    icon: Cpu,
  },
  {
    title: 'HMI & Visualization',
    description: 'Touch panels and SCADA systems for operator interface',
    products: [
      { name: 'Touch Panels', href: '/products?subcategory=hmis' },
      { name: 'Panel PCs', href: '/products?subcategory=panel-pcs' },
      { name: 'SCADA Software', href: '/products?subcategory=scada' },
      { name: 'Remote I/O', href: '/products?subcategory=remote-io' },
    ],
    icon: Monitor,
  },
  {
    title: 'Variable Frequency Drives',
    description: 'VFDs for motor speed control and energy savings',
    products: [
      { name: 'General Purpose VFDs', href: '/products?subcategory=vfds' },
      { name: 'HVAC Drives', href: '/products?subcategory=hvac-drives' },
      { name: 'Crane Drives', href: '/products?subcategory=crane-drives' },
      { name: 'Servo Drives', href: '/products?subcategory=servo-drives', badge: 'Precision' },
    ],
    icon: Activity,
  },
  {
    title: 'Power Supplies & I/O',
    description: 'Industrial power supplies and I/O modules',
    products: [
      { name: 'SMPS', href: '/products?subcategory=power-supplies' },
      { name: 'UPS Systems', href: '/products?subcategory=ups' },
      { name: 'I/O Modules', href: '/products?subcategory=io-modules' },
      { name: 'Signal Conditioners', href: '/products?subcategory=signal-conditioners' },
    ],
    icon: Zap,
  },
];

const automationSolutions = [
  {
    title: 'Process Automation',
    description: 'Complete automation for manufacturing processes with PLCs, HMIs, and sensors.',
    applications: ['Batch Processing', 'Continuous Flow', 'Assembly Lines', 'Packaging'],
    icon: Settings,
  },
  {
    title: 'Building Automation',
    description: 'BMS solutions for HVAC, lighting, and energy management in buildings.',
    applications: ['HVAC Control', 'Lighting Control', 'Access Control', 'Fire Safety'],
    icon: Box,
  },
  {
    title: 'Industrial IoT',
    description: 'Connected systems for remote monitoring, predictive maintenance, and analytics.',
    applications: ['Remote Monitoring', 'Predictive Maintenance', 'OEE Tracking', 'Energy Analytics'],
    icon: Network,
  },
];

const communicationProtocols = [
  { name: 'Modbus RTU/TCP', description: 'Industry standard for device communication' },
  { name: 'Profibus/Profinet', description: 'Siemens automation networks' },
  { name: 'EtherNet/IP', description: 'Allen-Bradley compatible networks' },
  { name: 'BACnet', description: 'Building automation standard' },
  { name: 'OPC UA', description: 'Modern industrial interoperability' },
  { name: 'MQTT', description: 'IoT and cloud connectivity' },
];

const IndustrialAutomationPage: React.FC = () => {
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
              Industrial Automation Solutions
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              PLCs, HMIs, VFDs, and automation components for smart manufacturing. 
              Build connected factories with Industry 4.0 ready solutions from 
              leading automation brands.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button size="lg" asChild>
                <Link to="/products?subcategory=plcs">
                  Browse PLCs
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/contact">
                  Get System Design Help
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
              Automation Components
            </h2>
            <p className="text-muted-foreground max-w-2xl">
              From PLCs to power supplies, all components for your automation projects.
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

      {/* Automation Solutions */}
      <section className="py-16 bg-muted/50">
        <Container>
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Automation Solutions
            </h2>
            <p className="text-muted-foreground max-w-2xl">
              End-to-end automation solutions for various industrial applications.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {automationSolutions.map((solution) => (
              <Card key={solution.title}>
                <CardHeader>
                  <div className="p-3 rounded-lg bg-primary/10 w-fit mb-2">
                    <solution.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{solution.title}</CardTitle>
                  <CardDescription>{solution.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {solution.applications.map((app) => (
                      <Badge key={app} variant="secondary" className="text-xs">
                        {app}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      {/* Communication Protocols */}
      <section className="py-16">
        <Container>
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            <div>
              <Badge variant="secondary" className="mb-4">
                Connectivity
              </Badge>
              <h2 className="text-3xl font-bold text-foreground mb-6">
                Communication Protocols
              </h2>
              <p className="text-muted-foreground mb-8">
                Our automation products support industry-standard communication 
                protocols for seamless integration with existing systems.
              </p>
              <div className="grid gap-4">
                {communicationProtocols.map((protocol) => (
                  <div key={protocol.name} className="flex items-start gap-3 p-3 rounded-lg border bg-card">
                    <Network className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <div className="font-medium text-foreground">{protocol.name}</div>
                      <div className="text-sm text-muted-foreground">{protocol.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-gradient-to-br from-primary/5 to-secondary/10 rounded-2xl p-8">
              <h3 className="text-xl font-semibold text-foreground mb-4">
                Need System Integration Support?
              </h3>
              <p className="text-muted-foreground mb-6">
                Our technical team can help you select compatible products and 
                design integrated automation systems.
              </p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-2 text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  System architecture design
                </li>
                <li className="flex items-center gap-2 text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  Component selection and BOM
                </li>
                <li className="flex items-center gap-2 text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  Protocol compatibility check
                </li>
                <li className="flex items-center gap-2 text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  Vendor coordination support
                </li>
              </ul>
              <Button asChild>
                <Link to="/contact">
                  Get Technical Support
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </Container>
      </section>

      {/* Brands Section */}
      <section className="py-16 bg-muted/50">
        <Container>
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Leading Automation Brands
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Source automation products from trusted global and Indian brands 
              through our verified seller network.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-8 text-muted-foreground">
            {['Siemens', 'ABB', 'Schneider', 'Allen-Bradley', 'Mitsubishi', 'Delta', 'Omron', 'Honeywell'].map((brand) => (
              <div key={brand} className="px-6 py-3 rounded-lg border bg-card text-foreground font-medium">
                {brand}
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary text-primary-foreground">
        <Container>
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold mb-4">
              Automate Your Operations
            </h2>
            <p className="text-primary-foreground/80 mb-8">
              Explore our range of automation products and build smarter, 
              more efficient industrial systems. Expert support available.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg" variant="secondary" asChild>
                <Link to="/products">
                  Browse All Products
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10" asChild>
                <Link to="/contact">
                  Discuss Your Project
                </Link>
              </Button>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
};

export default IndustrialAutomationPage;
