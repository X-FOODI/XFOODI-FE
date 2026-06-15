import axiosInstance from './axiosInstance';
import { API_ROUTES } from '../constants/apiRoutes';

export interface FeedbackImage {
  id: string;
  imageUrl: string;
  displayOrder: number;
  isCover: boolean;
}

export interface FeedbackCustomer {
  id: string;
  user: { id: string; fullName?: string; avatarUrl?: string };
}

export interface Feedback {
  id: string;
  orderId: string;
  customerId: string;
  restaurantId: string;
  rating: number;
  comment?: string;
  isAnonymous: boolean;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  customer?: FeedbackCustomer;
  images?: FeedbackImage[];
  order?: { id: string; reference: string };
}

export interface FeedbackListResult {
  items: Feedback[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  averageRating: number;
  totalCount: number;
}

export interface CreateFeedbackDto {
  rating: number;
  comment?: string;
  isAnonymous?: boolean;
  imageUrls?: string[];
}

export interface FeedbackFilterParams {
  restaurantId?: string;
  page?: number;
  limit?: number;
  minRating?: number;
  maxRating?: number;
  isPublished?: boolean;
  search?: string;
}

function unwrap<T>(data: any): T {
  return (data?.data ?? data) as T;
}

const feedbackService = {
  async create(orderId: string, dto: CreateFeedbackDto): Promise<Feedback> {
    const res = await axiosInstance.post(API_ROUTES.FEEDBACKS.CREATE(orderId), dto);
    return unwrap<Feedback>(res.data);
  },

  async getByOrderId(orderId: string): Promise<Feedback | null> {
    const res = await axiosInstance.get(API_ROUTES.FEEDBACKS.BY_ORDER(orderId));
    return unwrap<Feedback | null>(res.data);
  },

  async list(params: FeedbackFilterParams): Promise<FeedbackListResult> {
    const res = await axiosInstance.get(API_ROUTES.FEEDBACKS.LIST, { params });
    return unwrap<FeedbackListResult>(res.data);
  },

  async getById(id: string): Promise<Feedback> {
    const res = await axiosInstance.get(API_ROUTES.FEEDBACKS.DETAIL(id));
    return unwrap<Feedback>(res.data);
  },

  async update(id: string, dto: Partial<CreateFeedbackDto & { isPublished?: boolean }>): Promise<Feedback> {
    const res = await axiosInstance.patch(API_ROUTES.FEEDBACKS.UPDATE(id), dto);
    return unwrap<Feedback>(res.data);
  },

  async togglePublish(id: string, isPublished: boolean): Promise<Feedback> {
    const res = await axiosInstance.patch(API_ROUTES.FEEDBACKS.TOGGLE_PUBLISH(id), { isPublished });
    return unwrap<Feedback>(res.data);
  },

  async delete(id: string): Promise<void> {
    await axiosInstance.delete(API_ROUTES.FEEDBACKS.DELETE(id));
  },
};

export default feedbackService;
