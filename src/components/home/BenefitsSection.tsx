import React from 'react';
import { ShieldCheck, FileText, Lock, Users, ClipboardCheck, Handshake } from 'lucide-react';

const benefits = [
  {
    icon: ShieldCheck,
    title: "Verified Sellers Only",
    description: "Every seller undergoes GST verification, KYC validation, and onboarding approval before listing products.",
  },
  {
    icon: Lock,
    title: "Escrow-Protected Payments",
    description: "Buyer payments are held in a secure escrow account. Funds are released to sellers only after confirmed delivery.",
  },
  {
    icon: FileText,
    title: "GST-Compliant Invoicing",
    description: "Automatic CGST/SGST/IGST calculation, HSN codes, and GSTR-1 ready invoices on every transaction.",
  },
  {
    icon: ClipboardCheck,
    title: "Controlled RFQ Routing",
    description: "BOM-based RFQs are auto-routed only to verified sellers matched by product category and brand authorization.",
  },
  {
    icon: Users,
    title: "Multi-Seller Quoting",
    description: "Receive and compare quotes from multiple verified sellers side-by-side. Accept partial or full quotes per line item.",
  },
  {
    icon: Handshake,
    title: "Early Partner Benefits",
    description: "Join as a founding seller or buyer. Early partners receive priority support, reduced commission rates, and co-marketing.",
  },
];

const BenefitsSection: React.FC = () => {
  return (
    <section className="section-padding bg-background">
      <div className="container-wide">
        <div className="text-center mb-16">
          <h2 className="section-title">Built for Trust from Day One</h2>
          <p className="section-subtitle mx-auto">
            Every feature is designed to make B2B electrical procurement secure, compliant, and transparent.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <div 
                key={index} 
                className="group p-6 rounded-xl bg-card border border-border/50 hover:border-primary/20 hover:shadow-soft transition-all duration-300"
              >
                <div className="mb-4 inline-flex items-center justify-center w-14 h-14 rounded-xl bg-primary/5 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                  <Icon className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">{benefit.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{benefit.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default BenefitsSection;
