import axiosInstance from './axiosInstance';
import { API_ROUTES } from '../constants/apiRoutes';

export interface Dish {
  id: string;
  categoryId: string;
  restaurantId: string;
  name: string;
  description: string;
  price: string;
  unit: string;
  isVegetarian: boolean;
  isSpicy: boolean;
  isBestSeller: boolean;
  isActive: boolean;
  autoDisableByStock: boolean;
  createdAt: string;
  updatedAt: string;
  category?: { id: string; name: string };
}

export interface CreateDishData {
  categoryId: string;
  name: string;
  description: string;
  price: number | string;
  unit: string;
  isVegetarian?: boolean;
  isSpicy?: boolean;
  isBestSeller?: boolean;
  isActive?: boolean;
  autoDisableByStock?: boolean;
}

export interface UpdateDishData {
  categoryId?: string;
  name?: string;
  description?: string;
  price?: number | string;
  unit?: string;
  isVegetarian?: boolean;
  isSpicy?: boolean;
  isBestSeller?: boolean;
  isActive?: boolean;
  autoDisableByStock?: boolean;
}

export interface DishListParams {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  status?: string;
  isVegetarian?: boolean;
  isSpicy?: boolean;
  isBestSeller?: boolean;
  restaurantId?: string;
}

export interface DishListResponse {
  success: boolean;
  data: Dish[];
  total: number;
  page: number;
  limit: number;
}

const dishService = {
  async list(params: DishListParams): Promise<DishListResponse> {
    const res = await axiosInstance.get<DishListResponse>(API_ROUTES.DISHES.LIST, { params });
    return res.data;
  },

  async getDetail(id: string, restaurantId?: string): Promise<Dish> {
    const res = await axiosInstance.get<{ success: boolean; data: Dish }>(
      API_ROUTES.DISHES.DETAIL(id),
      { params: { restaurantId } }
    );
    return res.data.data;
  },

  async create(data: CreateDishData, restaurantId?: string): Promise<Dish> {
    const res = await axiosInstance.post<{ success: boolean; data: Dish }>(
      API_ROUTES.DISHES.CREATE,
      { ...data, restaurantId }
    );
    return res.data.data;
  },

  async update(id: string, data: UpdateDishData, restaurantId?: string): Promise<Dish> {
    const res = await axiosInstance.put<{ success: boolean; data: Dish }>(
      API_ROUTES.DISHES.UPDATE(id),
      { ...data, restaurantId }
    );
    return res.data.data;
  },

  async delete(id: string, restaurantId?: string): Promise<void> {
    await axiosInstance.delete(API_ROUTES.DISHES.DELETE(id), { params: { restaurantId } });
  },
};

export default dishService;
