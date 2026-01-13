import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Star, Quote } from 'lucide-react';

const testimonials = [
  {
    name: 'Rajesh Kumar',
    role: 'Procurement Manager',
    company: 'TechCorp Industries',
    testimonial: 'SwitchgearShop has revolutionized our procurement process. The platform is intuitive, and the quality of products consistently exceeds our expectations.',
    rating: 5,
    image: null,
  },
  {
    name: 'Priya Sharma',
    role: 'Chief Engineer',
    company: 'PowerGrid Solutions',
    testimonial: 'Finding reliable suppliers for industrial components was always challenging. This marketplace brings everything together with verified quality and competitive pricing.',
    rating: 5,
    image: null,
  },
  {
    name: 'Mohammed Ali',
    role: 'Operations Director',
    company: 'ElectroMax Ltd',
    testimonial: 'The support team is exceptional. They helped us source specialized equipment within days that would have taken weeks through traditional channels.',
    rating: 5,
    image: null,
  },
];

const TestimonialsSection: React.FC = () => {
  return (
    <section className="section-padding bg-secondary/30">
      <div className="container-wide">
        <div className="text-center mb-16">
          <h2 className="section-title">What Our Clients Say</h2>
          <p className="section-subtitle mx-auto">
            Trusted by thousands of businesses across India
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="bg-card border-border/50 hover:shadow-soft transition-shadow duration-300">
              <CardContent className="p-8">
                {/* Quote icon */}
                <Quote className="h-10 w-10 text-primary/20 mb-4" />
                
                {/* Stars */}
                <div className="flex items-center mb-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${i < testimonial.rating ? 'text-warning fill-warning' : 'text-muted'}`}
                    />
                  ))}
                </div>

                {/* Testimonial text */}
                <p className="text-foreground mb-6 leading-relaxed">
                  "{testimonial.testimonial}"
                </p>

                {/* Author */}
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold mr-4">
                    {testimonial.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">{testimonial.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {testimonial.role} at {testimonial.company}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
