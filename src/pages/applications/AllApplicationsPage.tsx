import React from 'react';
import { Link } from 'react-router-dom';
import { Container } from '@/components/ui/container';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Wrench, Zap, Cog, Gauge, Cpu } from 'lucide-react';

const applications = [
  {
    title: 'Panel Building',
    description: 'Complete range of switchgear, protection devices, and panel accessories for LT panels, MCC panels, APFC panels, and control panels.',
    href: '/applications/panel-building',
    icon: Wrench,
    products: ['MCCBs', 'MCBs', 'Contactors', 'Distribution Boards', 'Terminal Blocks'],
  },
  {
    title: 'Power Distribution',
    description: 'Comprehensive range of switchgear and distribution equipment for commercial, industrial, and infrastructure power systems.',
    href: '/applications/power-distribution',
    icon: Zap,
    products: ['ACBs', 'Switch Disconnectors', 'Busbar Systems', 'Energy Meters'],
  },
  {
    title: 'Motor Control Centers',
    description: 'Complete MCC solutions with motor starters, contactors, VFDs, and protection relays for industrial motor control.',
    href: '/applications/motor-control-centers',
    icon: Cog,
    products: ['Motor Starters', 'Contactors', 'VFDs', 'Overload Relays'],
  },
  {
    title: 'Energy Management',
    description: 'Reduce energy costs with smart metering, power factor correction, and energy monitoring systems.',
    href: '/applications/energy-management',
    icon: Gauge,
    products: ['Energy Meters', 'APFC Panels', 'Power Analyzers', 'CTs & PTs'],
  },
  {
    title: 'Industrial Automation',
    description: 'PLCs, HMIs, VFDs, and automation components for smart manufacturing and Industry 4.0 solutions.',
    href: '/applications/industrial-automation',
    icon: Cpu,
    products: ['PLCs', 'HMIs', 'VFDs', 'Power Supplies'],
  },
];

const AllApplicationsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/10 via-background to-secondary/20 py-16 md:py-20">
        <Container>
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Applications
            </h1>
            <p className="text-lg text-muted-foreground">
              Explore curated product collections and solution guides organized by 
              industrial application. Find the right components for your specific 
              use case.
            </p>
          </div>
        </Container>
      </section>

      {/* Applications Grid */}
      <section className="py-16">
        <Container>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {applications.map((app) => (
              <Card key={app.title} className="group hover:shadow-lg transition-all hover:border-primary/20">
                <CardHeader>
                  <div className="p-3 rounded-lg bg-primary/10 w-fit mb-3 group-hover:bg-primary/20 transition-colors">
                    <app.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{app.title}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {app.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {app.products.slice(0, 4).map((product) => (
                      <span
                        key={product}
                        className="px-2 py-1 rounded-md bg-secondary text-secondary-foreground text-xs"
                      >
                        {product}
                      </span>
                    ))}
                  </div>
                  <Button variant="outline" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors" asChild>
                    <Link to={app.href}>
                      Explore {app.title}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-muted/50">
        <Container>
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Can't Find Your Application?
            </h2>
            <p className="text-muted-foreground mb-6">
              Contact our technical team for custom product recommendations based 
              on your specific requirements.
            </p>
            <Button asChild>
              <Link to="/contact">
                Contact Us
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </Container>
      </section>
    </div>
  );
};

export default AllApplicationsPage;
