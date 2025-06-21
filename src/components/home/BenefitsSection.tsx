
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ShieldCheck, Truck, Clock, Award } from 'lucide-react';
import { useBenefits } from '@/hooks/useStrapiContent';

// Fallback benefits
const fallbackBenefits = [
  {
    icon: <ShieldCheck className="h-6 w-6" />,
    title: "Verified Suppliers",
    description: "All sellers on our platform are thoroughly vetted for quality and reliability.",
  },
  {
    icon: <Truck className="h-6 w-6" />,
    title: "Fast Shipping",
    description: "Efficient logistics network ensures your orders arrive on time, every time.",
  },
  {
    icon: <Clock className="h-6 w-6" />,
    title: "24/7 Support",
    description: "Our customer service team is available round-the-clock to assist you.",
  },
  {
    icon: <Award className="h-6 w-6" />,
    title: "Quality Guaranteed",
    description: "Every product on our platform meets rigorous industry standards.",
  },
];

// Icon mapping
const getIcon = (iconName: string) => {
  const icons: { [key: string]: React.ReactNode } = {
    'shield-check': <ShieldCheck className="h-6 w-6" />,
    'truck': <Truck className="h-6 w-6" />,
    'clock': <Clock className="h-6 w-6" />,
    'award': <Award className="h-6 w-6" />,
  };
  return icons[iconName] || <ShieldCheck className="h-6 w-6" />;
};

const BenefitsSection = () => {
  const { benefits: strapiBenefits, loading, error } = useBenefits();

  // Use Strapi benefits if available, otherwise use fallback
  const benefits = strapiBenefits.length > 0 
    ? strapiBenefits.map(benefit => ({
        icon: getIcon(benefit.attributes.icon),
        title: benefit.attributes.title,
        description: benefit.attributes.description,
      }))
    : fallbackBenefits;

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
          Why Choose SwitchgearShop?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {benefits.map((b, i) => (
            <Card key={i} className="border-0 shadow-sm">
              <CardContent className="pt-6 text-center">
                <div className="mb-4 inline-flex items-center justify-center w-12 h-12 rounded-full bg-brand-100 text-brand-600">
                  {b.icon}
                </div>
                <h3 className="text-lg font-medium mb-2">{b.title}</h3>
                <p className="text-gray-600">{b.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BenefitsSection;
