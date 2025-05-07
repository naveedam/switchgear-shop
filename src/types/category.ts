
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
  category: string;
  description?: string;
  imageUrl?: string;
  sortOrder?: number;
  status?: string;
}
