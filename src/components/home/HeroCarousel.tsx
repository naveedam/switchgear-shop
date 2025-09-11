
import React from 'react';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { getStrapiImageUrl } from '@/utils/strapiHelpers';

interface Slide {
  id: number;
  title: string;
  description: string;
  image: string;
  ctaText: string;
  ctaLink: string;
}

interface HeroCarouselProps {
  slides: Slide[];
}

const HeroCarousel: React.FC<HeroCarouselProps> = ({ slides }) => (
  <section className="relative">
    <Carousel className="w-full">
      <CarouselContent>
        {slides.map((slide) => (
          <CarouselItem key={slide.id}>
            <div className="relative h-[500px] md:h-[600px] w-full overflow-hidden">
              <div 
                className="absolute inset-0 bg-cover bg-center" 
                style={{ backgroundImage: `url(${getStrapiImageUrl(slide.image) || slide.image})` }}
              >
                <div className="absolute inset-0 bg-black bg-opacity-50" />
              </div>
              <div className="absolute inset-0 flex items-center justify-start p-8 md:p-16">
                <div className="max-w-lg text-white">
                  <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
                    {slide.title}
                  </h1>
                  <p className="text-lg md:text-xl mb-6 text-gray-200">
                    {slide.description}
                  </p>
                  <Button asChild size="lg">
                    <Link to={slide.ctaLink}>{slide.ctaText}</Link>
                  </Button>
                </div>
              </div>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious className="left-4" />
      <CarouselNext className="right-4" />
    </Carousel>
  </section>
);

export default HeroCarousel;
