
import { supabase } from "@/integrations/supabase/client";
import { Subcategory } from "@/types/category";
import { Database } from "@/integrations/supabase/types";

export const fetchSubcategories = async (category?: string): Promise<Subcategory[]> => {
  try {
    let query = supabase
      .from('product_subcategories')
      .select('*')
      .order('sort_order', { ascending: true });
    
    if (category) {
      // Cast the category parameter to the Supabase enum type
      const categoryEnum = category as Database["public"]["Enums"]["product_category"];
      query = query.eq('category', categoryEnum);
    }
    
    const { data, error } = await query;

    if (error) {
      console.error('Error fetching subcategories:', error);
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Transform the data into Subcategory objects
    const subcategories: Subcategory[] = data.map(item => ({
      id: item.id,
      name: item.name,
      category: item.category,
      description: item.description,
      imageUrl: item.image_url,
      sortOrder: item.sort_order,
      status: item.status
    }));

    return subcategories;
  } catch (error) {
    console.error('Error in fetchSubcategories:', error);
    return [];
  }
};

export const getCategoryDisplayName = (categorySlug: string): string => {
  // Convert snake_case to Title Case
  return categorySlug
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};
