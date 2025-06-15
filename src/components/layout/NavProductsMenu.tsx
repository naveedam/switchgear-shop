
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger
} from "@/components/ui/navigation-menu";
import { fetchCategories } from "@/services/categoryService";
import { Category } from "@/types/category";

const itemsPerColumn = 5;

const NavProductsMenu: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    fetchCategories().then(setCategories);
  }, []);

  const categoryColumns = () => {
    const columns = [];
    for (let i = 0; i < categories.length; i += itemsPerColumn) {
      columns.push(categories.slice(i, i + itemsPerColumn));
    }
    return columns;
  };

  return (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger>Products</NavigationMenuTrigger>
          <NavigationMenuContent>
            <div className="grid grid-cols-3 w-[800px] gap-3 p-4">
              {categoryColumns().map((column, idx) => (
                <div key={idx} className="flex flex-col space-y-2">
                  {column.map((category) => (
                    <Link
                      key={category.id}
                      to={`/categories/${category.slug}`}
                      className="block p-2 hover:bg-gray-100 rounded"
                    >
                      {category.name}
                    </Link>
                  ))}
                </div>
              ))}
            </div>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <Link
            to="/categories"
            className="flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
          >
            All Categories
          </Link>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <Link
            to="/sellers"
            className="flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
          >
            Sellers
          </Link>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <Link
            to="/about"
            className="flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
          >
            About
          </Link>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
};

export default NavProductsMenu;
