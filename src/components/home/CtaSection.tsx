import React from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ArrowRight, Building2, ShoppingBag, Shield } from 'lucide-react';

const CtaSection: React.FC = () => (
  <section className="section-padding bg-primary text-primary-foreground relative overflow-hidden">
    <div className="absolute inset-0 opacity-10">
      <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl transform -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl transform translate-x-1/2 translate-y-1/2" />
    </div>

    <div className="container-wide relative">
      <div className="max-w-3xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 bg-primary-foreground/10 border border-primary-foreground/20 rounded-full text-sm font-medium">
          <Shield className="h-4 w-4" />
          Early Access — Founding Partners Welcome
        </div>

        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
          Join India's Trusted Switchgear Marketplace
        </h2>
        <p className="text-xl text-primary-foreground/80 mb-10 leading-relaxed">
          We're onboarding verified sellers and procurement teams. Get early access with dedicated support, reduced commissions, and priority onboarding.
        </p>
        
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Button 
            asChild 
            size="lg" 
            variant="secondary"
            className="h-14 px-8 text-base font-semibold"
          >
            <Link to="/register?role=buyer" className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5" />
              Register as Buyer
              <ArrowRight className="h-5 w-5" />
            </Link>
          </Button>
          <Button 
            asChild 
            size="lg" 
            variant="outline"
            className="h-14 px-8 text-base font-semibold border-2 border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground hover:text-primary"
          >
            <Link to="/register?role=seller" className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Apply as Seller
            </Link>
          </Button>
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-primary-foreground/60">
          <span>✓ No registration fees</span>
          <span>✓ GST-verified onboarding</span>
          <span>✓ Escrow-protected payments</span>
          <span>✓ Founding partner benefits</span>
        </div>
      </div>
    </div>
  </section>
);

export default CtaSection;
