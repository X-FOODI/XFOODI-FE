import axiosInstance from "./axiosInstance";
import adminAxiosInstance from "./adminAxiosInstance";

export interface RestaurantDashboardSummary {
  revenue: { total: number; changePercent: number };
  orders: { total: number; completed: number; liveProcessing: number };
  reservations: { total: number; pending: number };
  newCustomers: { total: number; changePercent: number };
  fromDate: string;
  toDate: string;
}

export interface TrendPoint {
  label: string;
  value: number;
  date: string;
}

export interface OrderTrendPoint {
  label: string;
  total: number;
  date: string;
}

export interface TopDish {
  dishId: string;
  name: string;
  quantity: number;
  revenue: number;
}

export interface FeedbackItem {
  id: string;
  customerName?: string;
  isAnonymous: boolean;
  avatarUrl?: string;
  rating: number;
  comment?: string;
  createdDate: string;
}

export interface FeedbacksResponse {
  items: FeedbackItem[];
  totalCount: number;
  averageRating: number;
}

export interface AdminDashboardSummary {
  totalRestaurants: { total: number; changePercent: number; active: number };
  totalRevenue: { total: number; changePercent: number };
  totalOrders: { total: number; changePercent: number };
  totalUsers: { total: number; changePercent: number; newThisMonth: number };
  fromDate: string;
  toDate: string;
}

export interface TopRestaurant {
  id: string;
  name: string;
  slug: string;
  revenue: number;
  status: "active" | "inactive";
  rating: number;
  orders: number;
}

export const dashboardService = {
  // Tenant (Restaurant) Dashboard APIs
  async getRestaurantSummary(filter: string): Promise<RestaurantDashboardSummary> {
    const res = await axiosInstance.get<{ success: boolean; data: RestaurantDashboardSummary }>(
      `/dashboard/restaurant/summary`,
      { params: { filter } }
    );
    return res.data.data;
  },

  async getRestaurantTrends(filter: string): Promise<{ revenueTrend: TrendPoint[]; orderTrend: OrderTrendPoint[] }> {
    const res = await axiosInstance.get<{ success: boolean; data: { revenueTrend: TrendPoint[]; orderTrend: OrderTrendPoint[] } }>(
      `/dashboard/restaurant/trends`,
      { params: { filter } }
    );
    return res.data.data;
  },

  async getRestaurantTopDishes(): Promise<TopDish[]> {
    const res = await axiosInstance.get<{ success: boolean; data: TopDish[] }>(
      `/dashboard/restaurant/top-dishes`
    );
    return res.data.data;
  },

  async getRestaurantLatestFeedbacks(): Promise<FeedbacksResponse> {
    const res = await axiosInstance.get<{ success: boolean; data: FeedbacksResponse }>(
      `/dashboard/restaurant/latest-feedbacks`
    );
    return res.data.data;
  },

  // Admin Dashboard APIs
  async getAdminSummary(filter: string): Promise<AdminDashboardSummary> {
    const res = await adminAxiosInstance.get<{ success: boolean; data: AdminDashboardSummary }>(
      `/dashboard/admin/summary`,
      { params: { filter } }
    );
    return res.data.data;
  },

  async getAdminTrends(filter: string): Promise<{ revenueTrend: TrendPoint[]; orderTrend: OrderTrendPoint[] }> {
    const res = await adminAxiosInstance.get<{ success: boolean; data: { revenueTrend: TrendPoint[]; orderTrend: OrderTrendPoint[] } }>(
      `/dashboard/admin/trends`,
      { params: { filter } }
    );
    return res.data.data;
  },

  async getAdminTopRestaurants(): Promise<TopRestaurant[]> {
    const res = await adminAxiosInstance.get<{ success: boolean; data: TopRestaurant[] }>(
      `/dashboard/admin/top-restaurants`
    );
    return res.data.data;
  },
};
