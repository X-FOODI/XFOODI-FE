/**
 * Menu and Dish related types
 */

// Backend API response types
export interface DishItem {
  id: string;
  name: string;
  description: string;
  price: number;
  unit: string;
  isVegetarian: boolean;
  isSpicy: boolean;
  isBestSeller: boolean;
  images: DishImage[];
  imageUrl: string | null;
  categoryId: string;
  categoryName: string;
  isPopular?: boolean;
}

export interface DishImage {
  id: string;
  imageUrl: string;
  imageType: number;
  displayOrder: number;
  isActive: boolean;
}

export interface MenuCategory {
  categoryId: string;
  categoryName: string;
  items: DishItem[];
}

// Frontend UI types
export interface MenuItem {
  id: string;
  name: string;
  price: string;
  tags?: string[];
  note?: string;
  description?: string;
  image?: string;
  categoryId?: string;
  categoryName?: string;
  isPopular?: boolean;
  isBestSeller?: boolean;
  isSpicy?: boolean;
  isVegetarian?: boolean;
}

export interface Category {
  id: string;
  name: string;
}

export interface MenuSection {
  key: string;
  title: string;
  description: string;
  items: MenuItem[];
}

// Cart related types
export interface CartItem {
  id: string;
  lineId?: string;
  name: string;
  price: string;
  quantity: number;
  category: "food" | "drink";
  categoryId: string;
  categoryName?: string;
  image?: string;
  status?: string;
  note?: string;
  /** Set when this row is a combo parent */
  comboId?: string;
  /** Child dish rows nested under a combo */
  children?: CartItem[];
}

export type DishTag = "spicy" | "vegan" | "best" | "popular";

// Helper types for category grouping
export interface CategoryWithDishes {
  category: Category;
  dishes: MenuItem[];
}
