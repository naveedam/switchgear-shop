
import { useState, useEffect } from 'react';
import { strapiService } from '@/services/strapiService';
import { HeroSlide, Benefit, Testimonial, SiteSettings } from '@/types/cms';

export const useHeroSlides = () => {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSlides = async () => {
      try {
        setLoading(true);
        const data = await strapiService.getHeroSlides();
        setSlides(data);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch hero slides:', err);
        setError('Failed to load hero slides');
      } finally {
        setLoading(false);
      }
    };

    fetchSlides();
  }, []);

  return { slides, loading, error };
};

export const useBenefits = () => {
  const [benefits, setBenefits] = useState<Benefit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBenefits = async () => {
      try {
        setLoading(true);
        const data = await strapiService.getBenefits();
        setBenefits(data);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch benefits:', err);
        setError('Failed to load benefits');
      } finally {
        setLoading(false);
      }
    };

    fetchBenefits();
  }, []);

  return { benefits, loading, error };
};

export const useTestimonials = () => {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        setLoading(true);
        const data = await strapiService.getTestimonials();
        setTestimonials(data);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch testimonials:', err);
        setError('Failed to load testimonials');
      } finally {
        setLoading(false);
      }
    };

    fetchTestimonials();
  }, []);

  return { testimonials, loading, error };
};

export const useSiteSettings = () => {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const data = await strapiService.getSiteSettings();
        setSettings(data);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch site settings:', err);
        setError('Failed to load site settings');
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  return { settings, loading, error };
};
