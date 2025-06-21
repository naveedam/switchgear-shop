
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useTestimonials } from '@/hooks/useStrapiContent';
import { getStrapiImageUrl } from '@/utils/strapiHelpers';

// Fallback testimonials
const fallbackTestimonials = [
  {
    initials: 'JD',
    name: 'John Doe',
    role: 'Procurement Manager',
    testimonial: 'SwitchgearShop has transformed how we source industrial components. Their platform is user-friendly, and the quality of products has consistently exceeded our expectations.',
    rating: 5,
  },
  {
    initials: 'AR',
    name: 'Alex Rodriguez',
    role: 'Chief Engineer',
    testimonial: 'SwitchgearShop has transformed how we source industrial components. Their platform is user-friendly, and the quality of products has consistently exceeded our expectations.',
    rating: 5,
  },
  {
    initials: 'MK',
    name: 'Maria Kim',
    role: 'Operations Director',
    testimonial: 'SwitchgearShop has transformed how we source industrial components. Their platform is user-friendly, and the quality of products has consistently exceeded our expectations.',
    rating: 4,
  },
];

const TestimonialsSection: React.FC = () => {
  const { testimonials: strapiTestimonials, loading, error } = useTestimonials();

  // Use Strapi testimonials if available, otherwise use fallback
  const testimonials = strapiTestimonials.length > 0 
    ? strapiTestimonials.map(testimonial => ({
        initials: testimonial.attributes.name.split(' ').map(n => n[0]).join(''),
        name: testimonial.attributes.name,
        role: testimonial.attributes.role,
        company: testimonial.attributes.company,
        testimonial: testimonial.attributes.testimonial,
        rating: testimonial.attributes.rating,
        avatar: testimonial.attributes.avatar ? getStrapiImageUrl(testimonial.attributes.avatar) : null,
      }))
    : fallbackTestimonials;

  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
          What Our Clients Say
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((person, i) => (
            <Card key={i} className="card-hover">
              <CardContent className="pt-6">
                <div className="flex items-center mb-4">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <svg
                      key={j}
                      className={`w-5 h-5 ${j < person.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                    </svg>
                  ))}
                </div>
                <p className="text-gray-700 mb-4">
                  "{person.testimonial}"
                </p>
                <div className="flex items-center">
                  <div className="mr-3">
                    {person.avatar ? (
                      <img 
                        src={person.avatar} 
                        alt={person.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-semibold">
                        {person.initials}
                      </div>
                    )}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{person.name}</h4>
                    <p className="text-sm text-gray-500">
                      {person.role}
                      {person.company && ` at ${person.company}`}
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
