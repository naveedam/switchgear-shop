import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ShieldCheck, FileText, Lock, Users, Rocket, CheckCircle } from 'lucide-react';

const platformPromises = [
  {
    icon: ShieldCheck,
    title: 'Every Seller is Verified',
    description: 'We manually verify GST registration, KYC documents, and brand authorizations before any seller can list products.',
  },
  {
    icon: Lock,
    title: 'Your Money is Protected',
    description: 'Payments are held in a secure escrow account. Sellers receive funds only after you confirm delivery and quality.',
  },
  {
    icon: FileText,
    title: 'Fully GST Compliant',
    description: 'Every transaction generates proper tax invoices with CGST/SGST/IGST breakdowns, HSN codes, and GSTR-1 export support.',
  },
  {
    icon: Users,
    title: 'Controlled Seller Access',
    description: 'RFQs are routed only to verified sellers who match the required product categories. No spam quotes from unrelated vendors.',
  },
  {
    icon: CheckCircle,
    title: 'Transparent Pricing',
    description: 'Compare quotes from multiple sellers side-by-side. Accept partial quotes, negotiate line-by-line, and see all costs upfront.',
  },
  {
    icon: Rocket,
    title: 'Early Partner Advantage',
    description: 'We\'re onboarding founding partners now. Early sellers get reduced commissions. Early buyers get dedicated procurement support.',
  },
];

const TestimonialsSection: React.FC = () => {
  return (
    <section className="section-padding bg-secondary/30">
      <div className="container-wide">
        <div className="text-center mb-16">
          <h2 className="section-title">Our Commitment to You</h2>
          <p className="section-subtitle mx-auto">
            We're building India's most trusted B2B switchgear marketplace — here's how we earn your trust.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {platformPromises.map((promise, index) => {
            const Icon = promise.icon;
            return (
              <Card key={index} className="bg-card border-border/50 hover:shadow-soft transition-shadow duration-300">
                <CardContent className="p-8">
                  <div className="mb-4 inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">{promise.title}</h3>
                  <p className="text-muted-foreground leading-relaxed text-sm">
                    {promise.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Early access banner */}
        <div className="mt-12 p-6 rounded-xl bg-primary/5 border border-primary/10 text-center">
          <p className="text-primary font-semibold text-lg mb-1">
            🚀 Now Onboarding Founding Partners
          </p>
          <p className="text-muted-foreground text-sm max-w-2xl mx-auto">
            SwitchgearShop is in early access. We're carefully onboarding verified sellers and buyers in Bangalore and across India. 
            Join now for priority support and founding partner benefits.
          </p>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
