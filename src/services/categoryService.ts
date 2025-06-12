
import { supabase } from "@/integrations/supabase/client";
import { Category } from "@/types/category";

export const fetchCategories = async (): Promise<Category[]> => {
  try {
    console.log('Fetching categories from database...');
    
    const { data, error } = await supabase
      .from('product_categories')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Supabase error fetching categories:', error);
      return [];
    }

    console.log('Raw category data from database:', data);

    if (!data || data.length === 0) {
      console.log('No categories found in database');
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

    console.log('Transformed categories:', categories);
    return categories;
  } catch (error) {
    console.error('Error in fetchCategories:', error);
    return [];
  }
};
