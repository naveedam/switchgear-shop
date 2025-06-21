
import axios from 'axios';

// You'll need to replace this with your actual Strapi URL
const STRAPI_URL = process.env.REACT_APP_STRAPI_URL || 'http://localhost:1337';

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
