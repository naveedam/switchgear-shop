
import axios from 'axios';

// Use Vite's import.meta.env instead of process.env
const STRAPI_URL = import.meta.env.VITE_STRAPI_URL || 'http://localhost:1337';

const strapiApi = axios.create({
  baseURL: `${STRAPI_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const strapiService = {
  // Hero Slides
  getHeroSlides: async () => {
    const response = await strapiApi.get('/hero-slides?populate=*');
    return response.data.data;
  },

  // Benefits
  getBenefits: async () => {
    const response = await strapiApi.get('/benefits?populate=*');
    return response.data.data;
  },

  // Testimonials
  getTestimonials: async () => {
    const response = await strapiApi.get('/testimonials?populate=*');
    return response.data.data;
  },

  // Site Settings
  getSiteSettings: async () => {
    const response = await strapiApi.get('/site-setting?populate=*');
    return response.data.data;
  },

  // Category Content
  getCategoryContent: async (categorySlug: string) => {
    const response = await strapiApi.get(`/category-contents?filters[slug][$eq]=${categorySlug}&populate=*`);
    return response.data.data[0];
  },
};
