const STRAPI_URL = import.meta.env.VITE_STRAPI_URL || 'http://localhost:1337';

export const getStrapiImageUrl = (image: any): string => {
  if (!image?.data?.attributes?.url) return '';
  
  const url = image.data.attributes.url;
  
  // If URL is already absolute, return as is
  if (url.startsWith('http')) return url;
  
  // Otherwise, prepend Strapi URL
  return `${STRAPI_URL}${url}`;
};

export const formatStrapiContent = (content: string): string => {
  // You can add any content formatting logic here
  return content;
};

// Helper to get icon component dynamically
export const getIconComponent = (iconName: string) => {
  // This will need to be expanded based on which icons you use
  const iconMap: { [key: string]: any } = {
    'shield-check': 'ShieldCheck',
    'truck': 'Truck',
    'clock': 'Clock',
    'award': 'Award',
  };
  
  return iconMap[iconName] || 'ShieldCheck';
};
