
import { supabase } from "@/integrations/supabase/client";
import { Category } from "@/types/category";

export const fetchCategories = async (): Promise<Category[]> => {
  try {
    const { data, error } = await supabase
      .from('product_categories')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error fetching categories:', error);
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Transform the data into Category objects
    const categories: Category[] = data.map(item => ({
      id: item.id,
      name: item.name,
      slug: item.slug,
      description: item.description,
      imageUrl: item.image_url,
      sortOrder: item.sort_order
    }));

    return categories;
  } catch (error) {
    console.error('Error in fetchCategories:', error);
    return [];
  }
};

