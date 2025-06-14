
import React from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const CtaSection: React.FC = () => (
  <section className="py-20 bg-brand-700 text-white">
    <div className="container mx-auto px-4 text-center">
      <h2 className="text-3xl md:text-4xl font-bold mb-4">
        Ready to Grow Your Switchgear Business?
      </h2>
      <p className="text-xl max-w-2xl mx-auto mb-8 text-brand-100">
        Join thousands of buyers and sellers on the premier B2B marketplace for low voltage switchgear products.
      </p>
      <div className="flex flex-col sm:flex-row justify-center gap-4">
        <Button asChild size="lg" variant="outline" className="bg-transparent border-white text-white hover:bg-white hover:text-brand-700">
          <Link to="/register?role=buyer">Join as Buyer</Link>
        </Button>
        <Button asChild size="lg" className="bg-white text-brand-700 hover:bg-brand-100">
          <Link to="/register?role=seller">Become a Seller</Link>
        </Button>
      </div>
    </div>
  </section>
);

export default CtaSection;
