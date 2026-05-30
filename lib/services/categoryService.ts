import axiosInstance from './axiosInstance';
import { API_ROUTES } from '../constants/apiRoutes';

export interface Category {
  id: string;
  name: string;
  description: string;
  restaurantId: string;
  imageUrl: string | null;
  parentId: string | null;
  isActive: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryData {
  name: string;
  description: string;
  imageUrl?: string | null;
  parentId?: string | null;
  displayOrder?: number;
}

export interface UpdateCategoryData {
  name?: string;
  description?: string;
  imageUrl?: string | null;
  parentId?: string | null;
  isActive?: boolean;
  displayOrder?: number;
}

export interface CategoryListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'active' | 'inactive' | 'all' | string;
  restaurantId?: string;
}

export interface CategoryListResponse {
  success: boolean;
  data: Category[];
  total: number;
  page: number;
  limit: number;
}

const categoryService = {
  /** Fetch all categories for a restaurant */
  async list(params: CategoryListParams): Promise<CategoryListResponse> {
    const res = await axiosInstance.get<CategoryListResponse>(
      API_ROUTES.CATEGORIES.LIST,
      { params }
    );
    return res.data;
  },

  /** Fetch details of a single category */
  async getDetail(id: string, restaurantId?: string): Promise<Category> {
    const res = await axiosInstance.get<{ success: boolean; data: Category }>(
      API_ROUTES.CATEGORIES.DETAIL(id),
      { params: { restaurantId } }
    );
    return res.data.data;
  },

  /** Create a new category */
  async create(data: CreateCategoryData, restaurantId?: string): Promise<Category> {
    const res = await axiosInstance.post<{ success: boolean; data: Category }>(
      API_ROUTES.CATEGORIES.CREATE,
      { ...data, restaurantId }
    );
    return res.data.data;
  },

  /** Update an existing category */
  async update(id: string, data: UpdateCategoryData, restaurantId?: string): Promise<Category> {
    const res = await axiosInstance.put<{ success: boolean; data: Category }>(
      API_ROUTES.CATEGORIES.UPDATE(id),
      { ...data, restaurantId }
    );
    return res.data.data;
  },

  /** Safe delete a category */
  async delete(id: string, restaurantId?: string): Promise<void> {
    await axiosInstance.delete(
      API_ROUTES.CATEGORIES.DELETE(id),
      { params: { restaurantId } }
    );
  },
};

export default categoryService;
