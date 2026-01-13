import React from 'react';
import { ShieldCheck, Truck, Clock, Award, CheckCircle, Headphones } from 'lucide-react';

const benefits = [
  {
    icon: ShieldCheck,
    title: "Verified Suppliers",
    description: "Every seller is thoroughly vetted for quality, reliability, and compliance with industry standards.",
  },
  {
    icon: Truck,
    title: "Fast Shipping",
    description: "Efficient logistics network ensures your orders reach you on time, every time across India.",
  },
  {
    icon: Headphones,
    title: "24/7 Support",
    description: "Our dedicated support team is available round-the-clock to assist with any queries.",
  },
  {
    icon: Award,
    title: "Quality Guaranteed",
    description: "All products meet rigorous industry standards with authentic certifications.",
  },
  {
    icon: CheckCircle,
    title: "Secure Payments",
    description: "Multiple payment options with enterprise-grade security for all transactions.",
  },
  {
    icon: Clock,
    title: "Quick Quotes",
    description: "Get competitive quotes from multiple sellers within hours, not days.",
  },
];

const BenefitsSection: React.FC = () => {
  return (
    <section className="section-padding bg-background">
      <div className="container-wide">
        <div className="text-center mb-16">
          <h2 className="section-title">Why Choose SwitchgearShop?</h2>
          <p className="section-subtitle mx-auto">
            India's trusted B2B marketplace for industrial electrical equipment
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
