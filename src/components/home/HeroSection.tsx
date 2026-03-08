import React from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ArrowRight, Shield, Zap, Award, FileText, Lock } from 'lucide-react';

const HeroSection: React.FC = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-background via-background to-secondary/30">
      <div className="container-wide section-padding">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="space-y-8 animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/5 border border-primary/10 rounded-full text-sm text-primary font-medium">
              <Shield className="h-4 w-4" />
              Verified &amp; GST-Compliant B2B Marketplace
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
              Premium Switchgear
              <span className="block text-primary">Solutions</span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground max-w-xl leading-relaxed">
              India's purpose-built B2B marketplace for industrial electrical equipment. Every seller is verified, every invoice is GST-compliant, and every payment is escrow-protected.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Button asChild size="lg" className="h-12 px-8 text-base">
                <Link to="/products">
                  Browse Products
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="h-12 px-8 text-base">
                <Link to="/register?role=seller">
                  Apply as Seller
                </Link>
              </Button>
            </div>

            {/* Trust Pillars — honest, verifiable claims */}
            <div className="grid grid-cols-3 gap-6 pt-8 border-t border-border">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-sm font-semibold text-foreground">Verified Sellers</div>
                  <div className="text-xs text-muted-foreground">GST &amp; KYC checked</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Lock className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-sm font-semibold text-foreground">Escrow Payments</div>
                  <div className="text-xs text-muted-foreground">Funds released on delivery</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-sm font-semibold text-foreground">GST Invoicing</div>
                  <div className="text-xs text-muted-foreground">CGST/SGST/IGST compliant</div>
                </div>
              </div>
            </div>
          </div>

          {/* Visual */}
          <div className="relative hidden lg:block">
            <div className="relative aspect-square max-w-lg mx-auto">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-primary/5 rounded-3xl transform rotate-6" />
              <div className="absolute inset-0 bg-gradient-to-br from-secondary to-secondary/50 rounded-3xl transform -rotate-3" />
              
              <div className="relative rounded-2xl overflow-hidden shadow-elevated">
                <img 
                  src="https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&w=800&h=800"
                  alt="Industrial switchgear equipment"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent" />
              </div>

              <div className="absolute -bottom-6 -left-6 bg-card rounded-xl shadow-elevated p-4 flex items-center gap-3 animate-fade-in">
                <div className="h-12 w-12 rounded-lg bg-success/10 flex items-center justify-center">
                  <Zap className="h-6 w-6 text-success" />
                </div>
                <div>
                  <div className="font-semibold text-foreground">Fast Delivery</div>
                  <div className="text-sm text-muted-foreground">Pan-India shipping</div>
                </div>
              </div>

              <div className="absolute -top-6 -right-6 bg-card rounded-xl shadow-elevated p-4 flex items-center gap-3 animate-fade-in" style={{ animationDelay: '0.2s' }}>
                <div className="h-12 w-12 rounded-lg bg-warning/10 flex items-center justify-center">
                  <Award className="h-6 w-6 text-warning" />
                </div>
                <div>
                  <div className="font-semibold text-foreground">Quality Assured</div>
                  <div className="text-sm text-muted-foreground">BIS &amp; IEC certified</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary/5 to-transparent pointer-events-none" />
    </section>
  );
};

export default HeroSection;
