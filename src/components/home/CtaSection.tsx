import React from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ArrowRight, Building2, ShoppingBag } from 'lucide-react';

const CtaSection: React.FC = () => (
  <section className="section-padding bg-primary text-primary-foreground relative overflow-hidden">
    {/* Background decorations */}
    <div className="absolute inset-0 opacity-10">
      <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl transform -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl transform translate-x-1/2 translate-y-1/2" />
    </div>

    <div className="container-wide relative">
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
          Ready to Transform Your Procurement?
        </h2>
        <p className="text-xl text-primary-foreground/80 mb-10 leading-relaxed">
          Join thousands of businesses on India's premier B2B marketplace for industrial electrical equipment.
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
              Join as Buyer
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
              Become a Seller
            </Link>
          </Button>
        </div>

        <p className="mt-8 text-sm text-primary-foreground/60">
          No registration fees • Start selling in 24 hours • Dedicated seller support
        </p>
      </div>
    </div>
  </section>
);

export default CtaSection;
