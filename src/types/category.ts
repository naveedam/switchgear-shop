
export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  sortOrder?: number;
}

export interface Subcategory {
  id: string;
  name: string;
  category: string; // Using string type instead of the enum directly for flexibility
  description?: string;
  imageUrl?: string;
  sortOrder?: number;
  status?: string;
}
