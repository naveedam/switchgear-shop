
import { supabase } from "@/integrations/supabase/client";
import { Category } from "@/types/category";

export const fetchCategories = async (): Promise<Category[]> => {
  try {
    // Based on your database structure, product subcategories table has a "category" field
    // We'll query distinct categories from this table
    const { data, error } = await supabase
      .from('product_subcategories')
      .select('category')
      .distinct();

    if (error) {
      console.error('Error fetching categories:', error);
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Transform the category enum values into proper Category objects
    const categories: Category[] = data.map((item, index) => {
      const categoryName = item.category.toString();
      // Convert enum value to a more readable format (replace underscores with spaces and capitalize)
      const formattedName = categoryName
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (char) => char.toUpperCase());

      return {
        id: (index + 1).toString(),
        name: formattedName,
        slug: categoryName.toLowerCase(),
        // Use a default image for now
        imageUrl: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&w=300&h=200'
      };
    });

    return categories;
  } catch (error) {
    console.error('Error in fetchCategories:', error);
    return [];
  }
};
