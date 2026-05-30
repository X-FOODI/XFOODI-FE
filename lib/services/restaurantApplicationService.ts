import axiosInstance from './axiosInstance';
import { API_ROUTES } from '../constants/apiRoutes';

export type ApplicationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface RestaurantApplication {
  id: string;
  restaurantName: string;
  slug: string;
  description?: string;
  address: string;
  phone: string;
  email: string;
  logoUrl?: string;
  status: ApplicationStatus;
  reviewNote?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    fullName: string;
    email: string;
    avatarUrl?: string;
  };
  reviewer?: {
    id: string;
    fullName: string;
  };
  documents?: {
    businessLicenseUrl: string | null;
    ownershipProofUrl: string | null;
    nationalIdFrontUrl: string | null;
    nationalIdBackUrl: string | null;
  };
}

export interface CreateApplicationData {
  restaurantName: string;
  slug: string;
  description?: string;
  address: string;
  phone: string;
  email: string;
  restaurantImage?: File; // Ảnh nhà hàng (hiển thị trên homepage)
  latitude?: number;      // Vĩ độ
  longitude?: number;     // Kinh độ
  cuisineType?: string;   // Loại ẩm thực
  businessLicense?: File;
  ownershipProof?: File;
  nationalId?: File;       // CCCD mặt trước
  nationalIdBack?: File;  // CCCD mặt sau
}

export interface ApplicationListResponse {
  items: RestaurantApplication[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const restaurantApplicationService = {
  /** Customer: Tạo đơn đăng ký mở nhà hàng */
  async create(data: CreateApplicationData): Promise<RestaurantApplication> {
    const formData = new FormData();
    formData.append('restaurantName', data.restaurantName);
    formData.append('slug', data.slug);
    formData.append('address', data.address);
    formData.append('phone', data.phone);
    formData.append('email', data.email);
    if (data.description) formData.append('description', data.description);
    if (data.restaurantImage) formData.append('restaurantImage', data.restaurantImage);
    if (data.latitude  != null) formData.append('latitude',    String(data.latitude));
    if (data.longitude != null) formData.append('longitude',   String(data.longitude));
    if (data.cuisineType)       formData.append('cuisineType', data.cuisineType);
    if (data.businessLicense) formData.append('businessLicense', data.businessLicense);
    if (data.ownershipProof) formData.append('ownershipProof', data.ownershipProof);
    if (data.nationalId) formData.append('nationalId', data.nationalId);
    if (data.nationalIdBack) formData.append('nationalIdBack', data.nationalIdBack);

    const res = await axiosInstance.post<{ success: boolean; data: RestaurantApplication }>(
      API_ROUTES.RESTAURANT_APPLICATIONS.CREATE,
      formData
    );
    return res.data.data;
  },

  /** Customer: Xem trạng thái đơn của mình */
  async getMy(): Promise<RestaurantApplication | null> {
    const res = await axiosInstance.get<{ success: boolean; data: RestaurantApplication | null }>(
      API_ROUTES.RESTAURANT_APPLICATIONS.MY
    );
    return res.data.data;
  },

  /** Admin: Danh sách tất cả đơn */
  async list(params?: {
    status?: ApplicationStatus;
    page?: number;
    limit?: number;
  }): Promise<ApplicationListResponse> {
    const res = await axiosInstance.get<{ success: boolean; data: ApplicationListResponse }>(
      API_ROUTES.RESTAURANT_APPLICATIONS.LIST,
      { params }
    );
    return res.data.data;
  },

  /** Admin: Chi tiết 1 đơn (kèm URLs tài liệu đã giải mã) */
  async getDetail(id: string): Promise<RestaurantApplication> {
    const res = await axiosInstance.get<{ success: boolean; data: RestaurantApplication }>(
      API_ROUTES.RESTAURANT_APPLICATIONS.DETAIL(id)
    );
    return res.data.data;
  },

  /** Admin: Duyệt đơn */
  async approve(id: string): Promise<{ restaurantId: string; restaurantSlug: string }> {
    const res = await axiosInstance.post<{ success: boolean; data: { restaurantId: string; restaurantSlug: string } }>(
      API_ROUTES.RESTAURANT_APPLICATIONS.APPROVE(id)
    );
    return res.data.data;
  },

  /** Admin: Từ chối đơn */
  async reject(id: string, reason: string): Promise<void> {
    await axiosInstance.post(API_ROUTES.RESTAURANT_APPLICATIONS.REJECT(id), { reason });
  },
};

export default restaurantApplicationService;
