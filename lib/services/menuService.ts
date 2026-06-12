import type { DishItem, MenuCategory } from "../types/menu";
import axiosInstance from "./axiosInstance";

/**
 * Service for menu-related API calls
 */
class MenuService {
  private readonly BASE_PATH = "/dishes";
  private menuCache: MenuCategory[] | null = null;
  private menuRequest: Promise<MenuCategory[]> | null = null;

  /**
   * Fetch menu with all categories and dishes
   * @returns Promise with menu data grouped by categories
   */
  async getMenu(options?: { forceRefresh?: boolean }): Promise<MenuCategory[]> {
    const forceRefresh = options?.forceRefresh ?? false;

    if (!forceRefresh && this.menuCache) {
      return this.menuCache;
    }

    if (!forceRefresh && this.menuRequest) {
      return this.menuRequest;
    }

    try {
      const request = axiosInstance
        .get<MenuCategory[]>(`${this.BASE_PATH}/menu`)
        .then((response) => {
          this.menuCache = response.data;
          return response.data;
        })
        .finally(() => {
          this.menuRequest = null;
        });

      this.menuRequest = request;
      return request;
    } catch (error) {
      console.error("Error fetching menu:", error);
      throw new Error("Failed to fetch menu data");
    }
  }

  /**
   * Fetch a single dish by ID
   * @param dishId - The ID of the dish
   * @returns Promise with dish details
   */
  async getDishById(dishId: string): Promise<DishItem> {
    try {
      const response = await axiosInstance.get<DishItem>(
        `${this.BASE_PATH}/${dishId}`,
      );
      return response.data;
    } catch (error) {
      console.error(`Error fetching dish ${dishId}:`, error);
      throw new Error("Failed to fetch dish details");
    }
  }

  /**
   * Fetch dishes by category
   * @param categoryId - The category ID
   * @returns Promise with array of dishes
   */
  async getDishesByCategory(categoryId: string): Promise<DishItem[]> {
    try {
      const response = await axiosInstance.get<DishItem[]>(
        `${this.BASE_PATH}/category/${categoryId}`,
      );
      return response.data;
    } catch (error) {
      console.error(`Error fetching dishes for category ${categoryId}:`, error);
      throw new Error("Failed to fetch category dishes");
    }
  }

  /**
   * Search dishes by name
   * @param searchTerm - The search term
   * @returns Promise with matching dishes
   */
  async searchDishes(searchTerm: string): Promise<DishItem[]> {
    try {
      const response = await axiosInstance.get<DishItem[]>(
        `${this.BASE_PATH}/search`,
        {
          params: { q: searchTerm },
        },
      );
      return response.data;
    } catch (error) {
      console.error(`Error searching dishes with term "${searchTerm}":`, error);
      throw new Error("Failed to search dishes");
    }
  }
}

// Export singleton instance
export const menuService = new MenuService();
export default menuService;
