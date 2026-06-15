import axiosInstance from './axiosInstance';
import { API_ROUTES } from '../constants/apiRoutes';

export enum PaymentStatus {
  PENDING = 0,
  COMPLETED = 1,
  FAILED = 2,
  REFUNDED = 3,
  CANCELLED = 4,
}

export enum PaymentPurpose {
  ORDER = 0,
  DEPOSIT = 1,
  REFUND = 2,
}

export interface Payment {
  id: string;
  orderId?: string;
  reservationId?: string;
  paymentMethodId: string;
  transactionId?: string;
  amount: number;
  cashReceive: number;
  cashback: number;
  paymentDate: string;
  status: PaymentStatus;
  purpose: PaymentPurpose;
  checkoutUrl?: string;
  metadata?: Record<string, any>;
  paymentMethod: { id: string; code: string; name: string };
  order?: { id: string; reference: string; totalAmount: number };
  reservation?: {
    id: string;
    confirmationCode: string;
    depositAmount: number;
    customer?: { user: { fullName?: string; email?: string; phoneNumber?: string } };
  };
}

export interface PaymentListResult {
  items: Payment[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface TransferInfo {
  paymentId: string;
  amount: number;
  transferContent: string;
  qrUrl: string | null;
  bankInfo: {
    bankCode: string;
    accountNumber: string;
    accountName: string;
  };
}

export interface PaymentFilterParams {
  restaurantId?: string;
  page?: number;
  limit?: number;
  status?: number;
  purpose?: number;
  from?: string;
  to?: string;
}

function unwrap<T>(data: any): T {
  return (data?.data ?? data) as T;
}

export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  [PaymentStatus.PENDING]: 'Chờ thanh toán',
  [PaymentStatus.COMPLETED]: 'Đã thanh toán',
  [PaymentStatus.FAILED]: 'Thất bại',
  [PaymentStatus.REFUNDED]: 'Hoàn tiền',
  [PaymentStatus.CANCELLED]: 'Đã huỷ',
};

export const PAYMENT_STATUS_COLOR: Record<PaymentStatus, string> = {
  [PaymentStatus.PENDING]: '#f59e0b',
  [PaymentStatus.COMPLETED]: '#10b981',
  [PaymentStatus.FAILED]: '#ef4444',
  [PaymentStatus.REFUNDED]: '#8b5cf6',
  [PaymentStatus.CANCELLED]: '#6b7280',
};

const paymentService = {
  async list(params: PaymentFilterParams): Promise<PaymentListResult> {
    const res = await axiosInstance.get(API_ROUTES.PAYMENTS.LIST, { params });
    return unwrap<PaymentListResult>(res.data);
  },

  async getById(id: string): Promise<Payment> {
    const res = await axiosInstance.get(API_ROUTES.PAYMENTS.DETAIL(id));
    return unwrap<Payment>(res.data);
  },

  async payCash(dto: {
    orderId?: string;
    reservationId?: string;
    cashReceive: number;
    purpose?: PaymentPurpose;
  }): Promise<Payment> {
    const res = await axiosInstance.post(API_ROUTES.PAYMENTS.CASH, dto);
    return unwrap<Payment>(res.data);
  },

  async getTransferInfo(dto: {
    orderId?: string;
    reservationId?: string;
    amount: number;
    restaurantId: string;
  }): Promise<TransferInfo> {
    const res = await axiosInstance.post(API_ROUTES.PAYMENTS.TRANSFER_INFO, dto);
    return unwrap<TransferInfo>(res.data);
  },

  /** Poll payment status by ID (for SePay QR waiting screen) */
  async pollStatus(paymentId: string): Promise<{ status: PaymentStatus }> {
    const res = await axiosInstance.get(API_ROUTES.PAYMENTS.DETAIL(paymentId));
    const p = unwrap<Payment>(res.data);
    return { status: p.status };
  },
};

export default paymentService;
