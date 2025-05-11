
import { supabase } from "@/integrations/supabase/client";
import { Subcategory } from "@/types/category";
import { Database } from "@/integrations/supabase/types";

// Define the type for the product category enum from the Database
type ProductCategory = Database["public"]["Enums"]["product_category"];

export const fetchSubcategories = async (category?: string): Promise<Subcategory[]> => {
  try {
    let query = supabase
      .from('product_subcategories')
      .select('*')
      .order('sort_order', { ascending: true });
    
    if (category) {
      // Convert hyphenated category slug to snake_case for database query
      const normalizedCategory = category.replace(/-/g, '_');
      
      // Check if the normalized category matches any valid enum value
      const isValidCategory = isCategoryValid(normalizedCategory);
      
      if (isValidCategory) {
        // If valid enum value, use it directly
        query = query.eq('category', normalizedCategory as ProductCategory);
      } else {
        console.warn(`Invalid category: ${category} (normalized: ${normalizedCategory})`);
        return [];
      }
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

// Helper function to check if a category string matches any valid enum value
const isCategoryValid = (category: string): boolean => {
  // List of valid category values from the enum
  const validCategories = [
    "starters_and_switches",
    "motors_and_pumps",
    "control_panel_accessories",
    "low_voltage_switchgear",
    "control_gear_and_signalling_devices",
    "wires_and_cables",
    "industrial_plugs_and_sockets",
    "transformers",
    "capacitors",
    "lighting",
    "earthing_equipment",
    "measuring_instruments",
    "conduits_and_accessories",
    "hand_tools",
    "fans",
    "led_lights",
    "relays",
    "switches_and_sockets",
    "industrial_fans",
    "industrial_automation_vfd",
    "testing_and_measuring_instruments",
    "capacitors_and_reactors",
    "admin_panel"
  ];
  
  return validCategories.includes(category);
};

export const getCategoryDisplayName = (categorySlug: string): string => {
  // Convert snake_case to Title Case
  return categorySlug
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};
