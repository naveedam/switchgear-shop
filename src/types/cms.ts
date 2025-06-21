
export interface StrapiImage {
  id: number;
  attributes: {
    url: string;
    alternativeText?: string;
    caption?: string;
    width: number;
    height: number;
  };
}

export interface HeroSlide {
  id: number;
  attributes: {
    title: string;
    description: string;
    ctaText: string;
    ctaLink: string;
    image: {
      data: StrapiImage;
    };
    createdAt: string;
    updatedAt: string;
  };
}

export interface Benefit {
  id: number;
  attributes: {
    title: string;
    description: string;
    icon: string; // Icon name from lucide-react
    createdAt: string;
    updatedAt: string;
  };
}

export interface Testimonial {
  id: number;
  attributes: {
    name: string;
    role: string;
    company?: string;
    testimonial: string;
    rating: number;
    avatar?: {
      data: StrapiImage;
    };
    createdAt: string;
    updatedAt: string;
  };
}

export interface SiteSettings {
  id: number;
  attributes: {
    siteName: string;
    tagline?: string;
    contactEmail: string;
    contactPhone: string;
    address?: string;
    socialMedia?: {
      facebook?: string;
      twitter?: string;
      instagram?: string;
      linkedin?: string;
    };
    createdAt: string;
    updatedAt: string;
  };
}

export interface CategoryContent {
  id: number;
  attributes: {
    slug: string;
    description: string;
    featuredImage?: {
      data: StrapiImage;
    };
    seoTitle?: string;
    seoDescription?: string;
    createdAt: string;
    updatedAt: string;
  };
}
