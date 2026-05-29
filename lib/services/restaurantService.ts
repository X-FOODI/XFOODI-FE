import axiosInstance from './axiosInstance';
import { API_ROUTES } from '../constants/apiRoutes';

export interface PublicRestaurant {
  id: string;
  name: string;
  slug: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  logoUrl?: string;
  planType: string;
  latitude?: number;
  longitude?: number;
  cuisineType?: string;
  createdAt: string;
}

const restaurantService = {
  /** Public: lấy danh sách tất cả nhà hàng đang hoạt động */
  async listPublic(): Promise<PublicRestaurant[]> {
    const res = await axiosInstance.get<{ success: boolean; data: PublicRestaurant[] }>(
      API_ROUTES.RESTAURANTS.LIST
    );
    return res.data.data;
  },
};

export default restaurantService;
